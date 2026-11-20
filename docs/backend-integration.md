# Kezza Agent: backend integration

The FastAPI service is included in this project under `backend/`. It runs separately from Expo and uses PostgreSQL. For local installation and startup, see [backend/README.md](../backend/README.md).

## Current API contract used by the app

| Agent workflow | Request | Purpose |
| --- | --- | --- |
| Request OTP | `POST /api/v1/auth/otp/request` | Start phone verification; `dev_code` is available only in development. |
| Verify OTP | `POST /api/v1/auth/otp/verify` | Sign in an existing agent or request registration. |
| Register agent | `POST /api/v1/auth/register` | Create an agent account after the phone has a verified OTP. |
| Load agent profile | Included in the auth response | Confirms the signed-in role and agent ID. |
| Referral code and counts | `GET /api/v1/referrals/my-code` | Display the agent's code and API-generated patient deep link. |
| Referral history | `GET /api/v1/referrals` | Read the authenticated agent's patient referrals and current statuses. |
| Create patient lead | `POST /api/v1/referrals/lead` | Store a referral lead for the authenticated agent. |
| Commission wallet | `GET /api/v1/wallet/agent` | Read commission tier, earnings totals, and commission ledger. |
| Pending commissions | `GET /api/v1/admin/commissions/pending` | Admin: review all commissions awaiting approval. |
| Approve commission | `POST /api/v1/admin/commissions/{id}/approve` | Admin: approve a specific pending commission. |
| Approve all commissions | `POST /api/v1/admin/commissions/approve-all` | Admin: batch-approve all pending commissions. |
| Platform overview | `GET /api/v1/admin/overview` | Admin: registered/active patient and agent counts, referral/branch totals, INR points totals, verified payments, pending and approved commissions. |
| Referral tracking | `GET /api/v1/admin/referrals` | Admin: latest 200 referrals with patient, partner, branch and status details. |
| Branch reports | `GET /api/v1/admin/reports/branches` | Admin: verified payment count and revenue by branch. |
| Patient search | `GET /api/v1/admin/patients/search?query=...` | Admin: search active patients by name or phone, including current INR points balance. |
| Audited points credit | `POST /api/v1/admin/patients/{patient_id}/points` | Admin: append a positive patient points adjustment with reason and acting admin recorded in the ledger. |
| Verify collected payment | `POST /api/v1/payments/verify-collected` | Integration: record payment, auto-convert referral, auto-calculate commission. |

Every request after authentication uses the server-issued bearer token. The mobile client never writes to PostgreSQL or changes a reward balance directly.

## Current admin dashboard coverage

The admin screen uses the existing FastAPI/JWT stack. Its workflow is: sign in as a provisioned admin, review live overview totals, inspect recent referrals and branch revenue, search a patient and optionally issue a reasoned points credit, then review and approve pending commissions. Manual point credits are append-only ledger entries tied to the acting admin and reason. Commission approval and points credit refresh the relevant overview data.

The current backend does not provide redemption request handling, a complete patient profile/payment history endpoint, partner directory/leaderboard, monthly or treatment revenue series, recent activity feed, admin/role management, settings, or a general audit-log query. The dashboard does not present these as live features until those server APIs and authorization rules exist. The overview reports actual ledger totals; point balances use the current INR policy version.

## Commission Lifecycle & Admin Approval

1. **Automatic Commission Calculation**:
   - When a patient payment is confirmed (via `POST /api/v1/payments/verify-collected` or the admin CLI), the backend automatically looks up the attributed referral.
   - It checks the referring agent's active direct agent network to determine their tier (`Base (1%)` up to `10%`).
   - It computes the commission exact to the paise (`amount * tier_percent / 100`).
   - It marks the referral status as `converted` and appends an entry to `commission_ledger` with `status="pending"`.

2. **Admin Review & Approval**:
   - The agent sees the newly calculated commission immediately in their mobile app under **"Pending admin approval"** with an amber status badge.
   - The Kezza administrator reviews pending commissions and approves them:
     - Via CLI: `npm run admin -- pending` then `npm run admin -- approve --all` (or `--id <uuid>`)
     - Via API: `POST /api/v1/admin/commissions/{id}/approve` or `POST /api/v1/admin/commissions/approve-all`
   - Once approved, the funds move into the agent's **"Approved"** balance and increment **"Total earned"**.

3. **CLI Management Commands**:
   - `npm run admin -- pending`: List all pending commissions.
   - `npm run admin -- approve --all`: Approve all pending commissions.
   - `npm run admin -- approve --id <id>`: Approve a specific commission.
   - `npm run admin -- record-payment --patient-phone <+91...> --treatment "Dental Cleaning" --amount 25000`: Record a treatment payment and auto-calculate agent commission.
   - `npm run admin -- provision --phone <+91...> --name "Admin Name"`: Provision a new admin user.

## Agent points are a backend feature gap

The current database and API expose patient points and agent commissions. They do not expose an agent-points balance or ledger. The app therefore displays commissions from the real endpoint and clearly explains that agent points are pending. It must not infer points from referrals or commissions.

Before enabling agent points, the backend needs these product and engineering decisions:

1. Define the event that awards points (for example, a verified treatment payment for a referred patient) and the point rate.
2. Define eligibility, caps, expiry, adjustments, and refund treatment.
3. Add an append-only `agent_points_ledger` tied to the agent and the source referral/payment. Add a uniqueness rule so retries cannot award twice.
4. Write point awards in the same server transaction that confirms the trusted payment and referral conversion. Append reversal entries when a qualifying payment is refunded.
5. Add a JWT-protected read endpoint such as `GET /api/v1/wallet/agent-points` returning the calculated balance and ledger. The agent mobile app should remain read-only for points.
6. Add migration, API schema, authorization checks, and backend coverage before showing a points balance in this app.

The sample route name above is a proposal, not an existing endpoint. The business rules need approval in the normal product process before they are treated as the Kezza policy.

## Consent boundary

The mobile form requires the agent to confirm the patient agreed to referral follow-up. The existing `ReferralLeadCreateSchema` has no consent field, and its route does not store a consent record. For an auditable production flow, extend the API and database to record the consent state, timestamp, and policy/version or capture the consent through an approved server-side process. The client checkbox alone is not an audit record.

## Network setup

`EXPO_PUBLIC_API_URL` must include `/api/v1`, for example `http://192.168.1.25:8000/api/v1`. A physical phone cannot reach the Mac through `localhost`; use the Mac's current Wi-Fi IP and ensure the backend listens on a network-reachable interface. The variable is bundled into the client and must contain no secret credentials.
