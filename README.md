# Kezza Agent

Kezza Agent is a mobile app for field agents, with its FastAPI service included in `backend/`. The Expo client and API run as separate processes and use the API contract documented in [the integration notes](docs/backend-integration.md).

## Agent workflow

1. Sign in with an Indian mobile number and the API's OTP flow.
2. If the number is new, complete agent registration after OTP verification.
3. Add a patient lead with their name, mobile number, and optional service interest.
4. Track the lead through registered, contacted, consultation booked, converted, or closed statuses.
5. Copy or share the agent referral link.
6. Review commission earnings returned by `GET /api/v1/wallet/agent`.

## Backend and data ownership

The API in `backend/` serves `/api/v1/auth`, `/api/v1/referrals`, and `/api/v1/wallet/agent`. The mobile client never writes directly to PostgreSQL. The backend currently has no agent-points ledger or endpoint, so the app does not display a fabricated agent-points balance. See [backend integration notes](docs/backend-integration.md) for the API contract and remaining backend work.

The API currently returns patient referral links using the existing `kezzamobile://` patient-app scheme. The separate agent app has its own `kezza-agent://` scheme; referrals intentionally open the patient app so a patient can complete their own signup.

## Run on macOS

Install Node.js 20 or newer, Python 3.10 or newer, and PostgreSQL. Configure the API and app environment files as described in [backend setup](backend/README.md). For Expo Go on a physical phone, set `EXPO_PUBLIC_API_URL` to the computer's Wi-Fi/LAN IP address, not `localhost`; allow port 8000 through the firewall if prompted.

Configure the backend database as described in [backend setup](backend/README.md), then start both services together:

```bash
npm run start:all
```

Expo and FastAPI logs appear in the same terminal. Press Ctrl+C to stop both services. To run them in separate terminals, use `npm run start:backend` and `npm run start`.

Scan the QR code with Expo Go, or press `i` if Xcode's iOS Simulator is installed. The API's local development OTP is returned as `dev_code`; production OTP delivery must be configured on the backend.

## API and privacy notes

- `EXPO_PUBLIC_API_URL` is bundled into the client and is not a place for secrets.
- The agent must confirm that the patient agreed to have their contact details submitted before creating a lead. The current API schema has no consent field, so this client confirmation is not a server-side consent record.
- An existing account with a non-agent role is refused by the agent app.
- API permissions remain enforced by JWT checks on the server; client-side route guards only control navigation.

## Project layout

`src/app` contains Expo Router screens; `src/features` contains API types and queries; `src/lib` contains the API client and shared utilities; `src/store` contains the app session; `src/components` contains shared mobile UI. `backend/app` contains the FastAPI routes, services, schemas, and models; `backend/migrations` contains the database migrations.
