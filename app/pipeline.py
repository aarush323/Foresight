import time
from datetime import datetime
from graph import build_vehicle_graph, build_final_graph
from graph.state import MaintenanceState
from app import pipeline_state as ps
import json

VEHICLES = [f"VEH{str(i).zfill(3)}" for i in range(1, 11)]
OEM_NAME = "TataMotors"


def save_crew_report(final_result: dict):
    report = final_result.get("final_report", final_result)
    with open("data/crew_report.json", "w") as f:
        json.dump(report, f, indent=2, default=str)
    ps.emit_log("💾 Saved data/crew_report.json")


def run_pipeline(oem_name: str, vehicles: list):
    graph = build_vehicle_graph()
    all_vehicle_results = []
    run_id = f"RUN_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    for i, vid in enumerate(vehicles):
        ps.emit_log(f"🚗 [{i+1}/{len(vehicles)}] Starting {vid}")

        initial_state: MaintenanceState = {
            "oem_name": oem_name,
            "vehicle_id": vid,
            "vehicle_count": len(vehicles),
            "run_id": run_id,
            "analysis_date": datetime.now().isoformat(),
            "priority_override": False,
            "fleet_report": None,
            "failure_predictions": None,
            "outreach_log": None,
            "scheduling_details": None,
            "feedback_report": None,
            "has_critical_issues": False,
            "scheduling_failed": False,
        }

        try:
            result = graph.invoke(initial_state)
            all_vehicle_results.append(result)
            hs = result.get("fleet_report", {}).get("health_score", "?")
            status = "🔴 CRITICAL" if result.get("has_critical_issues") else "🟢 HEALTHY"
            ps.emit_log(f"✅ {vid} done — {status} (health: {hs}/100)")
        except Exception as e:
            ps.emit_log(f"❌ {vid} FAILED: {e}")
            all_vehicle_results.append({
                "vehicle_id": vid,
                "fleet_report": {"health_score": 0, "anomalies": [], "summary": "Processing failed"},
                "failure_predictions": [],
                "has_critical_issues": False,
                "error": str(e)
            })

        if i < len(vehicles) - 1:
            time.sleep(2)

    try:
        final_graph = build_final_graph()
        final_result = final_graph.invoke({
            "all_vehicle_results": all_vehicle_results,
            "oem_name": oem_name,
            "run_id": run_id,
            "rca_report": None,
            "final_report": None
        })
        save_crew_report(final_result)
        
        # Persist to DB
        from app.database import Database
        from app.persistence import persist_run_to_db
        db = Database()
        persist_run_to_db(final_result.get("final_report", final_result), db)
    except Exception as e:
        ps.emit_log(f"❌ Final analysis failed: {e}")
        fallback = {
            "run_id": run_id,
            "oem_name": oem_name,
            "analysis_date": datetime.now().isoformat(),
            "summary": {"fleet_size": len(vehicles), "error": str(e)},
            "vehicles": [{"vehicle_id": r.get("vehicle_id", "?")} for r in all_vehicle_results]
        }
        save_crew_report({"final_report": fallback})


def run_pipeline_with_logging():
    """Wrapper called from a background thread by POST /api/run."""
    try:
        ps.pipeline_running = True
        ps.pipeline_complete = False
        ps.emit_log("🚀 Pipeline started")
        ps.emit_log(f"📋 Processing {len(VEHICLES)} vehicles for {OEM_NAME}")
        run_pipeline(OEM_NAME, VEHICLES)
        ps.emit_log("✅ Pipeline complete!")
        ps.pipeline_complete = True
    except Exception as e:
        ps.emit_log(f"❌ Pipeline failed: {e}")
    finally:
        ps.pipeline_running = False
