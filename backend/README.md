# Kezza Agent API

This FastAPI service is included alongside the Kezza Agent Expo app. It exposes the authentication, referral, and commission endpoints consumed by the mobile client. The API runs as a separate process and stores data in PostgreSQL; it is not embedded in the mobile binary.

## Local setup

Use Python 3.10 or newer and a PostgreSQL database. From the project root:

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

Edit `backend/.env` with the local database credentials. Keep real secrets in this ignored file; never put backend credentials in the Expo `EXPO_PUBLIC_*` environment.
To use a private environment file stored elsewhere, set `KEZZA_BACKEND_ENV` to its path before starting the API.

Apply the database migrations from the backend directory:

```bash
cd backend
.venv/bin/alembic upgrade head
cd ..
```

Start the API in one terminal:

```bash
npm run start:backend
```

The API listens on port 8000 by default. Check `http://localhost:8000/health` for service status and `http://localhost:8000/health/db` for database connectivity.

## Connect the mobile app

Set `EXPO_PUBLIC_API_URL` in the project root `.env` to the API base URL, including `/api/v1`. Use `http://localhost:8000/api/v1` for a simulator on the same machine, or the machine's current LAN IP for a physical phone. Start Expo in a second terminal with `npm run start`.

The app and API share the same contract described in [the integration notes](../docs/backend-integration.md). Local OTP requests return a development code; production SMS delivery still requires provider configuration on the server.
