import uuid

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.branch import Branch
from app.models.payment import Payment
from app.models.points import PointsLedger
from app.models.user import User

OTP = "123456"


def _login(client: TestClient, phone: str, name: str, role: str | None = None):
    client.post("/api/v1/auth/otp/request", json={"phone_e164": phone})
    verify = client.post(
        "/api/v1/auth/otp/verify", json={"phone_e164": phone, "otp_code": OTP}
    )
    assert verify.status_code == 200, verify.text
    if role is None:
        return verify.json()
    reg = client.post(
        "/api/v1/auth/register",
        json={"phone_e164": phone, "full_name": name, "role": role, "email": f"{phone[1:]}@example.com"},
    )
    assert reg.status_code == 200, reg.text
    return reg.json()


def _setup(client: TestClient, db: Session):
    patient = _login(client, "+919830000001", "Manual Patient", "patient")
    agent = _login(client, "+919830000002", "Plain Agent", "agent")
    db.add(User(phone_e164="+919830000003", full_name="Admin", role="admin"))
    db.commit()
    admin = _login(client, "+919830000003", "Admin")
    return patient, agent, {"Authorization": f"Bearer {admin['access_token']}"}


def _body(patient_id, **over):
    body = {
        "patient_id": patient_id,
        "treatment_name": "Root Canal",
        "amount_rupees": "1500.00",
        "payment_reference": f"RCPT-{uuid.uuid4().hex[:8]}",
        "collected_outside_kezza": True,
    }
    body.update(over)
    return body


def test_admin_records_payment_and_audit(client: TestClient, db_session: Session):
    patient, _, headers = _setup(client, db_session)
    pid = patient["user"]["patient_id"]
    res = client.post("/api/v1/admin/payments", headers=headers, json=_body(pid))
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["amount_minor_units"] == 150_000
    assert data["points_earned"] == 1500
    assert data["new_points_balance"] == 1500
    ledger = db_session.scalars(
        select(PointsLedger).where(PointsLedger.patient_id == uuid.UUID(pid))
    ).one()
    admin_id = db_session.scalar(select(User.id).where(User.role == "admin"))
    assert ledger.created_by_user_id == admin_id
    assert str(ledger.payment_id) == data["payment_id"]


def test_duplicate_reference_is_rejected_without_double_award(client, db_session):
    patient, _, headers = _setup(client, db_session)
    pid = patient["user"]["patient_id"]
    body = _body(pid, payment_reference="RCPT-DUP-1")
    assert client.post("/api/v1/admin/payments", headers=headers, json=body).status_code == 200
    again = client.post("/api/v1/admin/payments", headers=headers, json=body)
    assert again.status_code == 409
    assert db_session.scalar(select(func.count(Payment.id)).where(Payment.payment_reference == "RCPT-DUP-1")) == 1
    total = db_session.scalar(
        select(func.sum(PointsLedger.points)).where(PointsLedger.patient_id == uuid.UUID(pid))
    )
    assert total == 1500


def test_validation_failures(client, db_session):
    patient, _, headers = _setup(client, db_session)
    pid = patient["user"]["patient_id"]
    url = "/api/v1/admin/payments"
    assert client.post(url, headers=headers, json=_body(str(uuid.uuid4()))).status_code == 404
    assert client.post(url, headers=headers, json=_body(pid, amount_rupees="0")).status_code == 422
    assert client.post(url, headers=headers, json=_body(pid, amount_rupees="-5")).status_code == 422
    assert client.post(url, headers=headers, json=_body(pid, branch_id=str(uuid.uuid4()))).status_code == 422
    assert client.post(url, headers=headers, json=_body(pid, collected_outside_kezza=False)).status_code == 422
    assert client.post(url, headers=headers, json=_body(pid, payment_reference="  ")).status_code == 422
    assert db_session.scalar(select(func.count(Payment.id))) == 0


def test_valid_branch_accepted(client, db_session):
    patient, _, headers = _setup(client, db_session)
    branch = Branch(code="BR1", name="Main", city="Delhi", is_active=True)
    db_session.add(branch)
    db_session.commit()
    res = client.post(
        "/api/v1/admin/payments",
        headers=headers,
        json=_body(patient["user"]["patient_id"], branch_id=str(branch.id)),
    )
    assert res.status_code == 200, res.text


def test_non_admin_and_anonymous_rejected(client, db_session):
    patient, agent, _ = _setup(client, db_session)
    body = _body(patient["user"]["patient_id"])
    url = "/api/v1/admin/payments"
    assert client.post(url, json=body).status_code in (401, 403)
    for tok in (patient, agent):
        r = client.post(url, headers={"Authorization": f"Bearer {tok['access_token']}"}, json=body)
        assert r.status_code == 403
    assert db_session.scalar(select(func.count(Payment.id))) == 0
