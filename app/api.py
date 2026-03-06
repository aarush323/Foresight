import asyncio
import json
import os
import threading
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from app.database import Database
from app import pipeline_state as ps

app = FastAPI(title="Automotive Predictive Maintenance API")
db = Database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_crew_report() -> dict:
    for path in ("data/crew_report.json", "data/sample-data.json"):
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
    return {"error": "No data available yet. Run the pipeline first."}


# ── Core endpoints ────────────────────────────────────────────────────────────

@app.get("/api/dashboard")
async def get_dashboard():
    report_path = "data/crew_report.json"
    if os.path.exists(report_path):
        with open(report_path) as f:
            return json.load(f)
    sample_path = "data/sample-data.json"
    if os.path.exists(sample_path):
        with open(sample_path) as f:
            data = json.load(f)
            data["_is_sample"] = True
            return data
    return {"error": "no data", "_is_sample": True}


@app.get("/api/vehicles/{vehicle_id}")
async def get_vehicle_detail(vehicle_id: str):
    # Always read from the latest run's JSON first (has full data)
    # DB is for historical aggregates only, not full vehicle detail
    report = _load_crew_report()
    for v in report.get("vehicles", []):
        if v.get("vehicle_id") == vehicle_id:
            # Enrich with historical failure count from DB
            history = db.get_failure_history(vehicle_id)
            v["historical_failure_count"] = len(history)
            v["failure_history"] = history[-5:]  # last 5
            return v
    raise HTTPException(status_code=404, detail="Vehicle not found in latest run")


@app.get("/api/status")
async def get_status():
    return {"status": "running", "timestamp": datetime.now().isoformat()}


@app.get("/api/manufacturing")
async def get_manufacturing():
    report = _load_crew_report()
    return report.get("manufacturing_insights", {"message": "No manufacturing data yet"})


@app.get("/api/summary")
async def get_summary():
    report = _load_crew_report()
    return report.get("summary", {"message": "No summary data yet"})


# ── Pipeline trigger & streaming ─────────────────────────────────────────────

@app.post("/api/run")
async def start_run():
    if ps.pipeline_running:
        raise HTTPException(status_code=409, detail="Pipeline already running")

    # Lazy import to avoid circular import at module level
    from app.pipeline import run_pipeline_with_logging

    ps.pipeline_logs.clear()
    ps.pipeline_running = True
    ps.pipeline_complete = False

    thread = threading.Thread(target=run_pipeline_with_logging, daemon=True)
    thread.start()
    return {"status": "started"}


@app.get("/api/run/status")
async def run_status():
    report_exists = os.path.exists("data/crew_report.json")
    return {
        "running": ps.pipeline_running,
        "complete": ps.pipeline_complete,
        "has_results": report_exists,
        "log_count": len(ps.pipeline_logs),
        "logs": ps.pipeline_logs,
    }


@app.get("/api/run/stream")
async def run_stream():
    async def log_stream():
        sent = 0
        while ps.pipeline_running or sent < len(ps.pipeline_logs):
            # If logs were cleared (new run), reset 'sent'
            if sent > len(ps.pipeline_logs):
                sent = 0
                
            while sent < len(ps.pipeline_logs):
                yield {"data": json.dumps(ps.pipeline_logs[sent])}
                sent += 1
                
            if ps.pipeline_complete and sent >= len(ps.pipeline_logs):
                break
                
            await asyncio.sleep(0.3)
        yield {"data": json.dumps({"time": "done", "message": "PIPELINE_COMPLETE"})}

    return EventSourceResponse(log_stream())

@app.get("/api/cumulative")
async def get_cumulative():
    """
    Returns cross-run aggregated stats for the dashboard trend charts.
    Reads from DB run_history table.
    """
    return db.get_cumulative_stats()


@app.get("/api/cumulative/failures")
async def get_failure_trends():
    """
    Returns component failure frequency across all runs.
    """
    return db.get_failure_trends()


@app.get("/api/cumulative/satisfaction")
async def get_satisfaction_trend():
    return db.get_satisfaction_trend()
