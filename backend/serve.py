import os
from pathlib import Path

from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parent
env_file = Path(os.environ.get("KEZZA_BACKEND_ENV", backend_dir / ".env"))


def main() -> None:
    load_dotenv(env_file)

    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=os.environ.get("BACKEND_HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", "8000")),
    )


if __name__ == "__main__":
    main()
