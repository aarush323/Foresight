import json
from datetime import datetime
from app.database import Database

def persist_run_to_db(report: dict, db: Database):
    """
    Called once after crew_report.json is written.
    Reads the report dict and writes all relevant data into the DB.
    This is the SINGLE source of truth writer.
    """
    run_id = report.get("run_id")
    if not run_id:
        return

    # 1. Write the run summary to run_history
    db.save_run_summary(
        run_id=run_id,
        oem_name=report.get("oem_name", "Unknown"),
        analysis_date=report.get("analysis_date", datetime.now().isoformat()),
        summary=report.get("summary", {}),
        raw_json=json.dumps(report)
    )

    for v in report.get("vehicles", []):
        # 2. Upsert vehicle static data
        db.upsert_vehicle_from_report(v)

        # 3. Write failure predictions to failure_history
        # The schema in database.py save_failure_predictions expects (vehicle_id, predictions_list)
        db.save_failure_predictions(v["vehicle_id"], v.get("failure_predictions", []))

        # 4. Write outreach if present
        outreach = v.get("outreach_log")
        if outreach:
            db.save_outreach(
                vehicle_id=v["vehicle_id"],
                run_id=run_id,
                channel=outreach.get("channel"),
                message=outreach.get("message"),
                status=outreach.get("status")
            )

        # 5. Write appointment if present
        appt = v.get("scheduling_details")
        if appt:
            db.upsert_appointment(appt, v["vehicle_id"], run_id)

        # 6. Write feedback/satisfaction if present
        # In the report, it might be under feedback_report
        feedback = v.get("feedback_report")
        if feedback:
            db.save_satisfaction_from_report(feedback, v["vehicle_id"])

    # 7. Write manufacturing patterns
    # In the report, it's under rca_report -> patterns
    rca = report.get("rca_report", {})
    patterns = rca.get("patterns", [])
    for pattern in patterns:
        db.save_manufacturing_pattern(run_id, pattern)
