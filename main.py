import threading
import uvicorn
from app.api import app
from app.database import Database
import time


def start_api():
    config = uvicorn.Config(app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)
    server.run()


if __name__ == "__main__":
    print("=" * 60)
    print("  Automotive Predictive Maintenance AI System")
    print("=" * 60)

    # 1. Initialize Database
    db = Database()
    print("✅ Database ready")

    # 2. Start FastAPI — blocks until server exits
    print("✅ API running at http://localhost:8000")
    print("   Open frontend and click ▶ Run Analysis")
    print("   http://localhost:5173")
    print("=" * 60)

    start_api()
