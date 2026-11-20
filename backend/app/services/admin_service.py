import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, aliased

from app.models.agent import Agent
from app.models.commission import CommissionLedger
from app.models.patient import Patient
from app.models.payment import Payment
from app.models.points import PointsLedger
from app.models.branch import Branch
from app.models.referral import Referral
from app.models.user import User
from app.services.payment_service import INR_POLICY_VERSION

MAX_MANUAL_POINTS = 1_000_000


def get_admin_overview(db: Session) -> dict:
    """Return live platform totals from the existing ledgers and records."""
    def count(model, *criteria):
        return int(db.scalar(select(func.count()).select_from(model).where(*criteria)) or 0)

    active_patients = int(db.scalar(
        select(func.count()).select_from(Patient)
        .join(User, User.id == Patient.user_id).where(User.is_active.is_(True))
    ) or 0)
    issued_points = int(db.scalar(select(func.coalesce(func.sum(PointsLedger.points), 0)).where(PointsLedger.policy_version == INR_POLICY_VERSION, PointsLedger.points > 0)) or 0)
    redeemed_points = int(db.scalar(select(func.coalesce(func.sum(-PointsLedger.points), 0)).where(PointsLedger.policy_version == INR_POLICY_VERSION, PointsLedger.event_type == "redemption", PointsLedger.points < 0)) or 0)
    available_points = int(db.scalar(select(func.coalesce(func.sum(PointsLedger.points), 0)).where(PointsLedger.policy_version == INR_POLICY_VERSION)) or 0)
    approved_commissions = int(db.scalar(
        select(func.coalesce(func.sum(CommissionLedger.amount_minor_units), 0))
        .join(Payment, Payment.id == CommissionLedger.payment_id)
        .where(CommissionLedger.status == "approved", Payment.currency == "INR")
    ) or 0)
    return {
        "patients": count(Patient),
        "active_patients": active_patients,
        "active_agents": count(Agent, Agent.status == "active"),
        "pending_commissions": count(CommissionLedger, CommissionLedger.status == "pending"),
        "active_branches": count(Branch, Branch.is_active.is_(True)),
        "open_referrals": count(Referral, Referral.status.in_(["registered", "contacted", "consultation_booked"])),
        "loyalty_points_issued": issued_points,
        "loyalty_points_redeemed": redeemed_points,
        "loyalty_points_available": available_points,
        "approved_commissions_minor_units": approved_commissions,
        "verified_payments_minor_units": int(db.scalar(select(func.coalesce(func.sum(Payment.amount_minor_units), 0)).where(Payment.status == "verified", Payment.currency == "INR")) or 0),
        "currency": "INR",
    }


def list_admin_referrals(db: Session) -> list[dict]:
    rows = db.execute(
        select(Referral, Agent.agent_code, User.full_name, Branch.name)
        .join(Agent, Agent.id == Referral.referring_agent_id)
        .join(User, User.id == Agent.user_id)
        .outerjoin(Branch, Branch.id == Referral.preferred_branch_id)
        .order_by(Referral.created_at.desc())
        .limit(200)
    ).all()
    return [{
        "referral_id": str(ref.id), "patient_name": ref.patient_name,
        "patient_phone_e164": ref.patient_phone_e164, "status": ref.status,
        "service_interest": ref.service_interest, "agent_code": code,
        "agent_name": agent_name, "branch_name": branch_name,
        "created_at": ref.created_at.isoformat() if ref.created_at else "",
    } for ref, code, agent_name, branch_name in rows]


def list_branch_financials(db: Session) -> list[dict]:
    rows = db.execute(
        select(
            Branch.id, Branch.code, Branch.name, Branch.city, Branch.is_active,
            func.count(Payment.id).label("payments"),
            func.coalesce(func.sum(Payment.amount_minor_units), 0).label("revenue"),
        )
        .outerjoin(Payment, and_(Payment.branch_id == Branch.id, Payment.status == "verified", Payment.currency == "INR"))
        .group_by(Branch.id, Branch.code, Branch.name, Branch.city, Branch.is_active)
        .order_by(Branch.name.asc())
    ).all()
    return [{"branch_id": str(row.id), "code": row.code, "name": row.name,
        "city": row.city, "is_active": row.is_active, "verified_payments": row.payments,
        "verified_revenue_minor_units": int(row.revenue), "currency": "INR"} for row in rows]


def search_patients(query: str, db: Session) -> list[dict]:
    """Find a bounded set of patients by name or phone for audited point grants."""
    term = query.strip().replace("%", "").replace("_", "")
    if len(term) < 2:
        raise ValueError("Search using at least two letters or digits")

    balance = func.coalesce(func.sum(PointsLedger.points), 0)
    rows = db.execute(
        select(
            Patient.id,
            User.full_name,
            User.phone_e164,
            balance.label("total_points"),
        )
        .join(User, User.id == Patient.user_id)
        .outerjoin(
            PointsLedger,
            and_(
                PointsLedger.patient_id == Patient.id,
                PointsLedger.policy_version == INR_POLICY_VERSION,
            ),
        )
        .where(
            User.role == "patient",
            User.is_active.is_(True),
            (User.full_name.ilike(f"%{term}%"))
            | (User.phone_e164.ilike(f"%{term}%")),
        )
        .group_by(Patient.id, User.full_name, User.phone_e164)
        .order_by(User.full_name.asc(), Patient.id.asc())
        .limit(50)
    ).all()

    return [
        {
            "patient_id": str(patient_id),
            "full_name": full_name,
            "phone_e164": phone_e164,
            "total_points": int(total_points),
            "credit_minor_units": int(total_points) * 100 // 25,
        }
        for patient_id, full_name, phone_e164, total_points in rows
    ]


def list_pending_commissions(db: Session) -> list[dict]:
    """List at most 100 pending commissions with the context admins need."""
    agent_user = aliased(User)
    patient_user = aliased(User)
    rows = db.execute(
        select(
            CommissionLedger,
            Agent.agent_code,
            agent_user.full_name,
            agent_user.phone_e164,
            patient_user.full_name,
            patient_user.phone_e164,
            Payment.treatment_name,
            Payment.currency,
        )
        .join(Agent, Agent.id == CommissionLedger.agent_id)
        .join(agent_user, agent_user.id == Agent.user_id)
        .join(Payment, Payment.id == CommissionLedger.payment_id)
        .join(Patient, Patient.id == Payment.patient_id)
        .join(patient_user, patient_user.id == Patient.user_id)
        .where(CommissionLedger.status == "pending")
        .order_by(CommissionLedger.created_at.asc(), CommissionLedger.id.asc())
        .limit(100)
    ).all()

    return [
        {
            "commission_id": str(commission.id),
            "agent_name": agent_name,
            "agent_phone_e164": agent_phone,
            "agent_code": agent_code,
            "patient_name": patient_name,
            "patient_phone_e164": patient_phone,
            "treatment_name": treatment_name,
            "amount_minor_units": commission.amount_minor_units,
            "currency": currency,
            "tier_name": commission.tier_name or "Legacy tier",
            "tier_percent": float(commission.tier_percent),
            "created_at": commission.created_at.isoformat()
            if commission.created_at
            else "",
        }
        for (
            commission,
            agent_code,
            agent_name,
            agent_phone,
            patient_name,
            patient_phone,
            treatment_name,
            currency,
        ) in rows
    ]


def approve_commission(
    commission_id: uuid.UUID,
    admin_user_id: uuid.UUID,
    db: Session,
) -> dict:
    """Approve a pending commission after locking its payment and ledger row."""
    commission_stub = db.get(CommissionLedger, commission_id)
    if not commission_stub:
        raise ValueError("Commission not found")

    payment = db.scalar(
        select(Payment)
        .where(Payment.id == commission_stub.payment_id)
        .with_for_update()
    )
    commission = db.scalar(
        select(CommissionLedger)
        .where(CommissionLedger.id == commission_id)
        .with_for_update()
    )
    if not payment or not commission:
        raise ValueError("Commission or payment not found")
    if commission.status != "pending":
        raise ValueError("Only pending commissions can be approved")
    if payment.status != "verified":
        raise ValueError("Commission payment is not verified")

    commission.status = "approved"
    commission.approved_at = datetime.now(timezone.utc)
    commission.approved_by_user_id = admin_user_id
    db.commit()

    return {
        "commission_id": str(commission.id),
        "status": commission.status,
        "approved_at": commission.approved_at.isoformat(),
        "approved_by_user_id": str(admin_user_id),
    }


def approve_all_pending_commissions(
    admin_user_id: uuid.UUID,
    db: Session,
) -> dict:
    """Approve all currently pending commissions."""
    pending_commissions = db.scalars(
        select(CommissionLedger.id).where(CommissionLedger.status == "pending")
    ).all()

    approved_ids = []
    failed_count = 0
    for comm_id in pending_commissions:
        try:
            res = approve_commission(comm_id, admin_user_id, db)
            approved_ids.append(res["commission_id"])
        except Exception:
            failed_count += 1
            continue

    return {
        "approved_count": len(approved_ids),
        "failed_count": failed_count,
        "approved_commission_ids": approved_ids,
        "approved_by_user_id": str(admin_user_id),
    }


def grant_patient_points(
    patient_id: uuid.UUID,
    points: int,
    reason: str,
    admin_user_id: uuid.UUID,
    db: Session,
) -> dict:
    """Append an audited positive points adjustment and return its new balance."""
    reason = reason.strip()
    if not reason or len(reason) < 3:
        raise ValueError("A reason of at least three characters is required")
    if points <= 0 or points > MAX_MANUAL_POINTS:
        raise ValueError(f"Points must be between 1 and {MAX_MANUAL_POINTS}")

    patient = db.scalar(
        select(Patient).where(Patient.id == patient_id).with_for_update()
    )
    if not patient:
        raise ValueError("Patient not found")

    current_balance = int(
        db.scalar(
            select(func.coalesce(func.sum(PointsLedger.points), 0)).where(
                PointsLedger.patient_id == patient.id,
                PointsLedger.policy_version == INR_POLICY_VERSION,
            )
        )
        or 0
    )
    new_balance = current_balance + points
    entry = PointsLedger(
        patient_id=patient.id,
        points=points,
        balance_after=new_balance,
        event_type="manual_adjustment",
        description=f"Admin grant: {reason}",
        policy_version=INR_POLICY_VERSION,
        created_by_user_id=admin_user_id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "ledger_id": str(entry.id),
        "patient_id": str(patient.id),
        "points_added": points,
        "total_points": new_balance,
        "credit_minor_units": new_balance * 100 // 25,
        "reason": reason,
        "created_by_user_id": str(admin_user_id),
        "created_at": entry.created_at.isoformat() if entry.created_at else "",
    }
