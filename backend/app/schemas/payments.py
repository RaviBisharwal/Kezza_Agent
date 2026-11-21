from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class TreatmentPaymentCreateSchema(BaseModel):
    patient_id: UUID
    treatment_name: str = Field(..., min_length=1, max_length=150)
    amount_rupees: Decimal = Field(..., gt=0, decimal_places=2)
    payment_reference: str = Field(..., min_length=1, max_length=100)
    branch_id: UUID | None = None


class ManualPaymentCreateSchema(BaseModel):
    """Admin-recorded payment already collected outside Kezza."""

    patient_id: UUID
    treatment_name: str = Field(..., min_length=1, max_length=150)
    amount_rupees: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)
    payment_reference: str = Field(..., min_length=3, max_length=100)
    branch_id: UUID | None = None
    collected_outside_kezza: bool

    @field_validator("treatment_name", "payment_reference")
    @classmethod
    def _strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("collected_outside_kezza")
    @classmethod
    def _must_confirm(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("Confirm that the payment was collected outside Kezza")
        return value


class PaymentResponseSchema(BaseModel):
    payment_id: str
    treatment_name: str
    amount_minor_units: int
    currency: str
    status: str
    points_earned: int
    new_points_balance: int
    agent_commission_minor_units: int | None = None
    referral_converted: bool = False


class PaymentRefundSchema(BaseModel):
    reason: str = Field(..., min_length=3, max_length=255)
