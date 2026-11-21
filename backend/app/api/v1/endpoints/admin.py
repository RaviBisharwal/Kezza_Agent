import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.admin import AdminPointsGrantSchema
from app.schemas.payments import ManualPaymentCreateSchema, PaymentResponseSchema
from app.services.payment_service import process_treatment_payment
from app.services.admin_service import (
    approve_all_pending_commissions,
    approve_commission,
    get_admin_overview,
    list_admin_referrals,
    list_branch_financials,
    grant_patient_points,
    list_pending_commissions,
    search_patients,
)
from app.services.auth_service import get_current_admin

router = APIRouter(prefix="/admin", tags=["Administrator"])


@router.get("/overview")
def get_admin_overview_endpoint(
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return get_admin_overview(db)


@router.get("/referrals")
def get_admin_referrals_endpoint(
    _: dict = Depends(get_current_admin), db: Session = Depends(get_db),
):
    return list_admin_referrals(db)


@router.get("/reports/branches")
def get_branch_financials_endpoint(
    _: dict = Depends(get_current_admin), db: Session = Depends(get_db),
):
    return list_branch_financials(db)


@router.get("/commissions/pending")
def get_pending_commissions_endpoint(
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return list_pending_commissions(db)


@router.post("/commissions/{commission_id}/approve")
def approve_commission_endpoint(
    commission_id: uuid.UUID,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        return approve_commission(
            commission_id=commission_id,
            admin_user_id=uuid.UUID(current_admin["id"]),
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post("/commissions/approve-all")
def approve_all_commissions_endpoint(
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        return approve_all_pending_commissions(
            admin_user_id=uuid.UUID(current_admin["id"]),
            db=db,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get("/patients/search")
def search_patients_endpoint(
    query: str = Query(..., min_length=2, max_length=100),
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        return search_patients(query, db)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post("/patients/{patient_id}/points")
def grant_patient_points_endpoint(
    patient_id: uuid.UUID,
    payload: AdminPointsGrantSchema,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        return grant_patient_points(
            patient_id=patient_id,
            points=payload.points,
            reason=payload.reason,
            admin_user_id=uuid.UUID(current_admin["id"]),
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND
            if "not found" in str(exc).lower()
            else status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post("/payments", response_model=PaymentResponseSchema)
def record_manual_payment_endpoint(
    payload: ManualPaymentCreateSchema,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Record a payment the clinic already collected outside Kezza.

    Not provider-verified: the admin attests collection. Runs in one
    transaction; a reused reference is rejected with 409 and awards nothing.
    """
    try:
        result = process_treatment_payment(
            patient_id=payload.patient_id,
            treatment_name=payload.treatment_name,
            amount_rupees=payload.amount_rupees,
            payment_reference=payload.payment_reference,
            branch_id=payload.branch_id,
            db=db,
            recorded_by_user_id=uuid.UUID(current_admin["id"]),
        )
        return PaymentResponseSchema(**result)
    except ValueError as exc:
        message = str(exc)
        lowered = message.lower()
        if "already" in lowered:
            code = status.HTTP_409_CONFLICT
        elif "not found" in lowered:
            code = status.HTTP_404_NOT_FOUND
        else:
            code = status.HTTP_422_UNPROCESSABLE_ENTITY
        raise HTTPException(status_code=code, detail=message) from exc
