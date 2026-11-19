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

Every request after authentication uses the server-issued bearer token. The mobile client never writes to PostgreSQL or changes a reward balance directly.

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
