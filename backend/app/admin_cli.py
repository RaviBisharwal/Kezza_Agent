"""Administrative CLI for Kezza platform operations.

Supports:
- Provisioning admin users with email & password (stored securely as PBKDF2-SHA256)
- Reviewing pending agent commissions
- Approving single or all pending commissions
- Recording verified treatment payments (which automatically calculates commissions)
"""

import argparse
import re
import secrets
import sys
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Optional

# Ensure backend directory is on sys.path for direct script execution
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from sqlalchemy import func, select

from app.database import SessionLocal
from app.models.patient import Patient
from app.models.user import User
from app.services.admin_service import (
    approve_all_pending_commissions,
    approve_commission,
    list_pending_commissions,
)
from app.services.auth_service import hash_password
from app.services.payment_service import process_treatment_payment

PHONE_PATTERN = re.compile(r"^\+91[6-9]\d{9}$")


def provision_admin(
    name: str,
    email: Optional[str] = None,
    password: Optional[str] = None,
    phone_e164: Optional[str] = None,
    promote_existing: bool = False,
) -> str:
    full_name = name.strip()
    if not full_name:
        raise ValueError("Administrator name is required")

    clean_email = email.strip().lower() if email else None
    clean_phone = phone_e164.strip() if phone_e164 else None

    if not clean_email and not clean_phone:
        raise ValueError("Either an administrator email or phone number is required")

    if clean_phone and not PHONE_PATTERN.fullmatch(clean_phone):
        raise ValueError(
            "Phone number must be an Indian mobile in E.164 format, for example +919876543210"
        )

    if password and len(password) < 6:
        raise ValueError("Password must be at least 6 characters long")

    hashed_pw = hash_password(password) if password else None

    with SessionLocal.begin() as db:
        user = None
        if clean_email:
            user = db.scalar(
                select(User).where(func.lower(User.email) == clean_email).with_for_update()
            )
        if not user and clean_phone:
            user = db.scalar(
                select(User).where(User.phone_e164 == clean_phone).with_for_update()
            )

        if user:
            if user.role != "admin" and not promote_existing:
                raise ValueError(
                    f"This account ({clean_email or clean_phone}) is currently role '{user.role}'. "
                    "Pass --promote-existing to grant administrator privileges."
                )
            user.role = "admin"
            user.full_name = full_name
            if clean_email:
                user.email = clean_email
            if clean_phone:
                user.phone_e164 = clean_phone
            if hashed_pw:
                user.password_hash = hashed_pw
            user.is_active = True
            identifier = user.email or user.phone_e164
            return f"Updated administrator: {identifier} ({full_name})"
        else:
            assigned_phone = clean_phone or f"+919{secrets.randbelow(900000000) + 100000000}"
            user = User(
                phone_e164=assigned_phone,
                full_name=full_name,
                email=clean_email,
                password_hash=hashed_pw,
                role="admin",
                is_active=True,
            )
            db.add(user)
            identifier = clean_email or assigned_phone
            return f"Successfully provisioned administrator: {identifier} ({full_name})"


def _get_admin_id(db, admin_phone: Optional[str] = None) -> uuid.UUID:
    """Find the specified admin or the first active admin user."""
    if admin_phone:
        admin_user = db.scalar(
            select(User).where(User.phone_e164 == admin_phone.strip(), User.role == "admin")
        )
        if not admin_user:
            raise ValueError(f"Admin account with phone {admin_phone} not found.")
        return admin_user.id

    admin_user = db.scalar(
        select(User).where(User.role == "admin", User.is_active.is_(True)).order_by(User.created_at.asc())
    )
    if not admin_user:
        raise ValueError(
            "No active administrator found. Please run 'provision' first to create an admin account."
        )
    return admin_user.id


def cmd_list_pending() -> None:
    """Print all commissions awaiting admin approval."""
    with SessionLocal() as db:
        pending = list_pending_commissions(db)

    if not pending:
        print("\nNo pending commissions found. All commissions are up to date.")
        return

    print(f"\nFound {len(pending)} commission(s) pending admin approval:\n")
    print(f"{'ID':<38} {'Agent':<20} {'Patient':<20} {'Treatment':<24} {'Commission (INR)':<18} {'Tier':<14}")
    print("-" * 140)
    for c in pending:
        agent_str = f"{c['agent_name'][:12]} ({c['agent_code']})"
        patient_str = f"{c['patient_name'][:12]} ({c['patient_phone_e164'][-4:]})"
        comm_inr = f"₹{c['amount_minor_units'] / 100:,.2f}"
        tier_str = f"{c['tier_percent']}% ({c['tier_name']})"
        print(f"{c['commission_id']:<38} {agent_str:<20} {patient_str:<20} {c['treatment_name'][:22]:<24} {comm_inr:<18} {tier_str:<14}")
    print()


def cmd_approve(commission_id: Optional[str] = None, approve_all: bool = False, admin_phone: Optional[str] = None) -> None:
    """Approve one or all pending commissions."""
    with SessionLocal() as db:
        admin_id = _get_admin_id(db, admin_phone)

        if approve_all:
            result = approve_all_pending_commissions(admin_id, db)
            print(f"\nBatch approval completed: {result['approved_count']} commission(s) approved.")
            return

        if not commission_id:
            raise ValueError("Specify either --id <commission_id> or --all.")

        comm_uuid = uuid.UUID(commission_id.strip())
        result = approve_commission(comm_uuid, admin_id, db)
        print(f"\nSuccessfully approved commission {result['commission_id']} (Status: {result['status']}).")


def cmd_record_payment(
    patient_phone: str,
    treatment_name: str,
    amount_rupees: Decimal,
    payment_reference: Optional[str] = None,
    branch_id: Optional[str] = None,
) -> None:
    """Record a treatment payment, automatically calculating agent commission."""
    patient_phone = patient_phone.strip()
    if not payment_reference:
        payment_reference = f"INV-{secrets.token_hex(4).upper()}"

    with SessionLocal() as db:
        patient_user = db.scalar(select(User).where(User.phone_e164 == patient_phone))
        if not patient_user:
            raise ValueError(f"User with phone {patient_phone} not found.")

        patient = db.scalar(select(Patient).where(Patient.user_id == patient_user.id))
        if not patient:
            patient = Patient(user_id=patient_user.id)
            db.add(patient)
            db.flush()

        branch_uuid = uuid.UUID(branch_id) if branch_id else None

        result = process_treatment_payment(
            patient_id=patient.id,
            treatment_name=treatment_name.strip(),
            amount_rupees=amount_rupees,
            payment_reference=payment_reference,
            branch_id=branch_uuid,
            db=db,
        )

    print("\nPayment processed successfully:")
    print(f"  Payment ID:          {result['payment_id']}")
    print(f"  Treatment:           {result['treatment_name']}")
    print(f"  Amount Collected:    ₹{result['amount_minor_units'] / 100:,.2f} ({result['currency']})")
    print(f"  Patient Points:      +{result['points_earned']} (Balance: {result['new_points_balance']})")
    print(f"  Referral Converted:  {'Yes' if result['referral_converted'] else 'No (or already converted)'}")

    if result["agent_commission_minor_units"] is not None:
        comm_inr = result["agent_commission_minor_units"] / 100
        print(f"  Agent Commission:    ₹{comm_inr:,.2f} (Status: pending admin approval)")
        print("\nNotice: The commission is automatically calculated and placed in 'pending' status.")
        print("To approve it, run: python -m app.admin_cli approve --all")
    else:
        print("  Agent Commission:    None (Patient was not attributed to an agent referral)")
    print()


def main() -> None:
    parser = argparse.ArgumentParser(description="Kezza Administrative & Commission Management CLI")
    subparsers = parser.add_subparsers(dest="command", help="Administrative command")

    # 1. Provision (Supports email + password)
    p_prov = subparsers.add_parser("provision", help="Provision or update an administrator account")
    p_prov.add_argument("--name", default="Super Admin", help="Admin display name")
    p_prov.add_argument("--email", default=None, help="Administrator email (e.g. admin@kezza.com)")
    p_prov.add_argument("--password", default=None, help="Administrator password for email login")
    p_prov.add_argument("--phone", default=None, help="Admin phone in E.164 format (+91...)")
    p_prov.add_argument("--promote-existing", action="store_true", help="Promote an existing account to admin")

    # 2. List pending commissions
    subparsers.add_parser("pending", help="List all pending commissions")

    # 3. Approve commission
    p_app = subparsers.add_parser("approve", help="Approve pending commissions")
    p_app.add_argument("--id", help="UUID of the commission to approve")
    p_app.add_argument("--all", action="store_true", help="Approve all pending commissions")
    p_app.add_argument("--admin-phone", default=None, help="Admin phone number performing the approval")

    # 4. Record payment (triggers automatic commission calculation)
    p_pay = subparsers.add_parser("record-payment", help="Record patient payment & auto-calculate commission")
    p_pay.add_argument("--patient-phone", required=True, help="Patient mobile (+91...)")
    p_pay.add_argument("--treatment", required=True, help="Treatment name (e.g. 'Dental Cleaning')")
    p_pay.add_argument("--amount", required=True, type=Decimal, help="Payment amount in Rupees (e.g. 50000)")
    p_pay.add_argument("--reference", default=None, help="Unique invoice/payment reference")

    # Legacy fallback: support python -m app.admin_cli --phone ... --name ...
    parser.add_argument("--phone", help="Legacy admin provision phone")
    parser.add_argument("--name", help="Legacy admin provision name")
    parser.add_argument("--email", default=None, help="Legacy admin email")
    parser.add_argument("--password", default=None, help="Legacy admin password")
    parser.add_argument("--promote-existing", action="store_true", help="Legacy promote existing")

    args = parser.parse_args()

    try:
        if args.command == "provision":
            print(provision_admin(
                name=args.name,
                email=args.email,
                password=args.password,
                phone_e164=args.phone,
                promote_existing=args.promote_existing,
            ))
        elif args.command == "pending":
            cmd_list_pending()
        elif args.command == "approve":
            cmd_approve(args.id, args.all, args.admin_phone)
        elif args.command == "record-payment":
            cmd_record_payment(args.patient_phone, args.treatment, args.amount, args.reference)
        elif args.phone or args.email:
            print(provision_admin(
                name=args.name or "Admin",
                email=args.email,
                password=args.password,
                phone_e164=args.phone,
                promote_existing=args.promote_existing,
            ))
        else:
            parser.print_help()
            sys.exit(1)
    except Exception as exc:
        print(f"\nError: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
