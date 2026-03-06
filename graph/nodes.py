import json
import hashlib
import numpy as np
from datetime import datetime, timedelta
from geopy.distance import geodesic

from .state import MaintenanceState, FinalState
from app.database import get_db
from app.llm import get_llm, cached_llm_call, safe_parse_json
from app.pipeline_state import emit_log
from tools.telematics import get_vehicle_telemetry
from tools.service_center import SERVICE_CENTERS

# ─────────────────────────────────────────────
# NODE 1: DATA ANALYSIS
# ─────────────────────────────────────────────
def data_analysis_node(state: MaintenanceState):
    vid = state["vehicle_id"]
    run_id = state["run_id"]
    emit_log(f"  📡 {vid} - Reading telemetry")

    db = get_db()

    # 1. Get current sensor readings
    raw = get_vehicle_telemetry.invoke({"vehicle_id": vid})
    sensors = json.loads(raw)

    # 2. Pull telemetry history
    history = db.get_telemetry_history(vid)

    # 3. Z-score anomaly detection
    anomalies = []
    sensor_keys = {
        "engine_temp_f": {"threshold": 220, "direction": "high"},
        "oil_pressure_psi": {"threshold": 25, "direction": "low"},
        "brake_pad_mm": {"threshold": 3.5, "direction": "low"},
        "battery_voltage": {"threshold": 11.5, "direction": "low"},
    }

    for key, cfg in sensor_keys.items():
        current = sensors.get(key)
        if current is None:
            continue

        # Try Z-score if enough history
        hist_vals = []
        for h in history:
            s = h.get("sensors", {})
            if isinstance(s, str):
                try:
                    s = json.loads(s)
                except Exception:
                    continue
            if key in s:
                hist_vals.append(s[key])

        if len(hist_vals) >= 5:
            mean = np.mean(hist_vals)
            std = np.std(hist_vals)
            if std > 0:
                z = abs((current - mean) / std)
            else:
                z = 0
            if z > 2.5:
                anomalies.append({
                    "sensor": key, "value": current,
                    "z_score": round(float(z), 2),
                    "level": "critical" if z > 3.0 else "warning"
                })
        else:
            # Fallback: hardcoded thresholds
            flagged = False
            if cfg["direction"] == "high" and current > cfg["threshold"]:
                flagged = True
            elif cfg["direction"] == "low" and current < cfg["threshold"]:
                flagged = True
            if flagged:
                anomalies.append({
                    "sensor": key, "value": current,
                    "z_score": None,
                    "level": "warning"
                })

    # Also flag DTC codes
    dtcs = sensors.get("dtc_codes", [])
    if dtcs:
        anomalies.append({
            "sensor": "dtc_codes", "value": dtcs,
            "z_score": None, "level": "critical"
        })

    # 4. Health score — only deduct for anomalies with numeric z_score
    health_score = 100
    for a in anomalies:
        z = a.get("z_score")
        if z is not None:
            if a["level"] == "critical" or z > 3.0:
                health_score -= 20
            elif z > 2.5:
                health_score -= 10
        else:
            # threshold-based fallback anomaly
            if a["level"] == "critical":
                health_score -= 20
            else:
                health_score -= 10
    health_score = max(0, health_score)
    emit_log(f"  📊 {vid} - Health score: {health_score}/100 ({len(anomalies)} anomalies)")

    # 5. Save telemetry
    db.save_telemetry(vid, run_id, sensors)

    # 6. LLM summary
    normal_sensors = [k for k in sensor_keys if k not in [a["sensor"] for a in anomalies]]
    anomaly_text = "\n".join([f"  - {a['sensor']}: {a['value']} (z={a['z_score']}, {a['level']})" for a in anomalies]) or "  None"

    prompt = f"""Vehicle {vid} sensor analysis:
Health Score: {health_score}/100
Flagged sensors:
{anomaly_text}
Normal sensors: {', '.join(normal_sensors) if normal_sensors else 'None'}

Write a 2 sentence clinical fleet health summary."""

    try:
        llm = get_llm("data_analysis")
        summary = cached_llm_call(llm, prompt, task_type="data_analysis")
    except Exception as e:
        print(f"  [LLM error] {e}")
        summary = f"Vehicle {vid} health score: {health_score}/100. {'Anomalies detected.' if anomalies else 'No anomalies.'}"

    # 7. Return
    fleet_report = {
        "vehicle_id": vid,
        "health_score": health_score,
        "sensors": sensors,
        "anomalies": anomalies,
        "summary": summary
    }
    return {"fleet_report": fleet_report}


# ─────────────────────────────────────────────
# NODE 2: DIAGNOSIS
# ─────────────────────────────────────────────
def diagnosis_node(state: MaintenanceState):
    vid = state["vehicle_id"]
    emit_log(f"  🧠 {vid} - Running AI diagnosis")

    db = get_db()
    vehicle = db.get_vehicle_detail(vid)
    fleet_report = state.get("fleet_report", {})
    failure_history = db.get_failure_history(vid)
    mfg_patterns = db.get_manufacturing_patterns(vehicle["model"], vehicle["year"]) if vehicle else []

    # Failure probability formula
    age = vehicle.get("age_years", 0) if vehicle else 0
    mileage = vehicle.get("mileage", 0) if vehicle else 0
    usage = vehicle.get("usage_type", "normal") if vehicle else "normal"
    usage_factor_map = {"heavy": 0.1, "normal": 0.05, "light": 0.02}
    prob = 0.1 + (age * 0.05) + (mileage * 0.000008) + usage_factor_map.get(usage, 0.05)
    prob = min(prob, 0.95)

    anomalies = fleet_report.get("anomalies", [])
    health_score = fleet_report.get("health_score", 100)

    prompt = f"""You are an automotive diagnostics expert.

Vehicle: {vid} {vehicle.get('model', 'N/A') if vehicle else 'N/A'} {vehicle.get('year', 'N/A') if vehicle else 'N/A'}
Location: {vehicle.get('city', 'N/A') if vehicle else 'N/A'}, Climate: {vehicle.get('climate', 'N/A') if vehicle else 'N/A'}
Usage: {vehicle.get('usage_type', 'N/A') if vehicle else 'N/A'}, Mileage: {mileage}km
Age: {age} years

Current sensor anomalies: {json.dumps(anomalies)}
Health score: {health_score}/100
Calculated failure probability: {round(prob, 3)}

Historical failures for this vehicle:
{json.dumps(failure_history[:5]) if failure_history else 'None'}

Known issues with {vehicle.get('model', 'N/A') if vehicle else 'N/A'} {vehicle.get('year', 'N/A') if vehicle else 'N/A'}:
{json.dumps(mfg_patterns[:3]) if mfg_patterns else 'None'}

Predict component failures. Return JSON only:
{{
  "predictions": [
    {{
      "component": "str",
      "severity": 0.0,
      "probability": 0.0,
      "reasoning": "str",
      "urgency": "immediate/soon/monitor"
    }}
  ],
  "overall_risk": "critical/warning/healthy",
  "has_critical_issues": true
}}"""

    try:
        llm = get_llm("diagnosis")
        response = cached_llm_call(llm, prompt, task_type="diagnosis")
        parsed = safe_parse_json(response)
    except Exception as e:
        print(f"  [LLM error] {e}")
        parsed = {"error": True}

    if parsed.get("error"):
        # Correct fallback: never mark critical unless prob is genuinely high
        has_critical = (health_score < 60) or (prob > 0.6) or any(
            a.get("z_score") is not None and a["z_score"] > 3.0 for a in anomalies
        )
        predictions = [{
            "component": "General",
            "severity": round(prob, 2),
            "probability": round(prob, 2),
            "reasoning": "Based on vehicle age and mileage",
            "urgency": "immediate" if prob > 0.6 else "monitor"
        }]
        parsed = {
            "predictions": predictions,
            "overall_risk": "critical" if has_critical else "healthy",
            "has_critical_issues": has_critical
        }

    predictions = parsed.get("predictions", [])
    # Enforce: never critical unless logic confirms it
    has_critical = parsed.get("has_critical_issues", False)
    if has_critical:
        # Double-check with our own logic
        has_critical = (health_score < 60) or (prob > 0.6) or any(
            a.get("z_score") is not None and a["z_score"] > 3.0 for a in anomalies
        )

    if has_critical:
        emit_log(f"  🔴 {vid} - {len(predictions)} critical issue(s) found")
    else:
        emit_log(f"  🟢 {vid} - No critical issues")

    db.save_failure_predictions(vid, predictions)

    return {
        "failure_predictions": predictions,
        "has_critical_issues": has_critical
    }


# ─────────────────────────────────────────────
# NODE 3: CUSTOMER ENGAGEMENT
# ─────────────────────────────────────────────
def customer_engagement_node(state: MaintenanceState):
    vid = state["vehicle_id"]
    run_id = state["run_id"]
    emit_log(f"  📱 {vid} - Composing customer message")

    db = get_db()
    vehicle = db.get_vehicle_detail(vid)
    predictions = state.get("failure_predictions", [])

    # Determine channel
    max_sev = 0
    top_component = "General"
    for p in predictions:
        sev = p.get("severity", 0)
        if isinstance(sev, (int, float)) and sev > max_sev:
            max_sev = sev
            top_component = p.get("component", "General")

    if max_sev > 0.7:
        channel = "SMS"
    elif max_sev > 0.4:
        channel = "email"
    else:
        channel = "app"

    owner_name = vehicle.get("owner_name", "Customer") if vehicle else "Customer"
    model = vehicle.get("model", "Vehicle") if vehicle else "Vehicle"
    year = vehicle.get("year", "") if vehicle else ""
    city = vehicle.get("city", "") if vehicle else ""

    prompt = f"""Examples of good maintenance messages:

SMS Critical: 'Hi Priya, urgent: your brake system needs immediate attention. Book at Mumbai center today. Reply YES to confirm.'

Email Warning: 'Dear Rahul, diagnostics show your Model 3 battery has early wear. We recommend scheduling within 2 weeks.'

App Low: 'Hey Amit, routine reminder: oil pressure slightly low. Worth checking at next service.'

Now write a {channel} message for:
Owner: {owner_name}
Vehicle: {model} {year}
Issue: {top_component} - severity {round(max_sev, 2)}
City: {city}

Match the tone and length to the channel type.
Return JSON only:
{{
  "message": "str",
  "channel": "{channel}",
  "subject": "str or null"
}}"""

    try:
        llm = get_llm("customer_engagement")
        response = cached_llm_call(llm, prompt, task_type="customer_engagement")
        parsed = safe_parse_json(response)
    except Exception as e:
        print(f"  [LLM error] {e}")
        parsed = {"error": True}

    if parsed.get("error"):
        msg = f"Hi {owner_name}, your {model} needs attention for {top_component}. Please schedule a service visit."
        parsed = {"message": msg, "channel": channel, "subject": None}

    message = parsed.get("message", "Service needed")
    db.save_outreach(vid, run_id, channel, message, "sent")
    owner_name = vehicle.get("owner_name", "Customer") if vehicle else "Customer"
    emit_log(f"  📬 {vid} - Sent {channel} to {owner_name}")

    return {
        "outreach_log": {
            "channel": channel,
            "message": message,
            "subject": parsed.get("subject"),
            "status": "sent",
            "vehicle_id": vid
        }
    }


# ─────────────────────────────────────────────
# NODE 4: SCHEDULING (No LLM)
# ─────────────────────────────────────────────
def scheduling_node(state: MaintenanceState):
    vid = state["vehicle_id"]
    emit_log(f"  📅 {vid} - Finding nearest service center")

    db = get_db()
    vehicle = db.get_vehicle_detail(vid)
    predictions = state.get("failure_predictions", [])

    if not vehicle:
        return {"scheduling_details": None, "scheduling_failed": True}

    vlat = vehicle.get("latitude", 19.0)
    vlng = vehicle.get("longitude", 72.8)
    vehicle_loc = (vlat, vlng)

    # Find top component to match specialization
    top_component = "General"
    for p in predictions:
        sev = p.get("severity", 0)
        if isinstance(sev, (int, float)) and sev > 0.3:
            top_component = p.get("component", "General")
            break

    # Map component to specialization
    spec_map = {
        "battery": "EV Battery", "ev battery": "EV Battery",
        "brake": "Brakes", "brakes": "Brakes", "brake pads": "Brakes",
        "engine": "Engine/Drivetrain", "drivetrain": "Engine/Drivetrain",
        "transmission": "Engine/Drivetrain",
    }
    needed_spec = "Engine/Drivetrain"  # default
    for key, spec in spec_map.items():
        if key in top_component.lower():
            needed_spec = spec
            break

    # Sort centers by distance
    sorted_centers = []
    for cid, cdata in SERVICE_CENTERS.items():
        dist = geodesic(vehicle_loc, cdata["coords"]).km
        sorted_centers.append((cid, cdata, dist))
    sorted_centers.sort(key=lambda x: x[2])

    # Try to book
    slot_time = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 10:00")

    for cid, cdata, dist in sorted_centers:
        # Find matching technician
        tech = None
        for t in cdata["technicians"]:
            if t["specialization"] == needed_spec:
                tech = t
                break
        if not tech:
            tech = cdata["technicians"][0]  # fallback to first

        try:
            app_id = db.book_appointment(vid, cid, tech["id"], tech["specialization"], slot_time)
            emit_log(f"  ✅ {vid} - Booked at {cdata['name']} ({round(dist,1)} km)")
            return {
                "scheduling_details": {
                    "appointment_id": app_id,
                    "center_name": cdata["name"],
                    "center_city": cid.title(),
                    "technician_name": tech["name"],
                    "specialization": tech["specialization"],
                    "slot_time": slot_time,
                    "distance_km": round(dist, 1),
                    "status": "booked"
                },
                "scheduling_failed": False
            }
        except Exception as e:
            print(f"    [booking error] {cid}: {e}")
            continue

    emit_log(f"  ⏳ {vid} - No slots available, marking delayed")
    return {"scheduling_details": {"status": "delayed"}, "scheduling_failed": True}


# ─────────────────────────────────────────────
# NODE 5: NOTIFY DELAY (No LLM)
# ─────────────────────────────────────────────
def notify_delay_node(state: MaintenanceState):
    vid = state["vehicle_id"]
    run_id = state["run_id"]
    emit_log(f"  ⏳ {vid} - Sending delay notification")

    db = get_db()
    vehicle = db.get_vehicle_detail(vid)
    owner_name = vehicle.get("owner_name", "Customer") if vehicle else "Customer"

    message = f"Hi {owner_name}, we're sorry — all service slots are currently full. We will contact you within 24 hours to confirm your appointment."
    db.save_outreach(vid, run_id, "SMS", message, "delayed")

    return {
        "outreach_log": {
            "channel": "SMS",
            "message": message,
            "status": "delayed",
            "vehicle_id": vid
        }
    }


# ─────────────────────────────────────────────
# NODE 6: FEEDBACK (No LLM)
# ─────────────────────────────────────────────
def feedback_node(state: MaintenanceState):
    vid = state["vehicle_id"]
    emit_log(f"  ⭐ {vid} - Recording service feedback")

    db = get_db()
    sched = state.get("scheduling_details")
    if not sched or not sched.get("appointment_id"):
        return {"feedback_report": {"status": "skipped", "reason": "no appointment"}}

    app_id = sched["appointment_id"]
    db.update_appointment_status(app_id, "completed")

    # Seeded satisfaction score
    seed = int(hashlib.md5(vid.encode()).hexdigest()[:8], 16)
    predictions = state.get("failure_predictions", [])
    max_sev = max((p.get("severity", 0) for p in predictions if isinstance(p.get("severity"), (int, float))), default=0)

    if max_sev >= 0.7:
        score = 5 + (seed % 4)  # 5-8
    else:
        score = 7 + (seed % 4)  # 7-10

    db.save_feedback(app_id, vid, score, "Service completed successfully")
    emit_log(f"  ⭐ {vid} - Satisfaction score: {score}/10")

    return {
        "feedback_report": {
            "appointment_id": app_id,
            "status": "completed",
            "satisfaction_score": score,
            "notes": "Service completed successfully"
        }
    }


# ─────────────────────────────────────────────
# NODE 7: MANUFACTURING (Runs ONCE, final graph)
# ─────────────────────────────────────────────
def manufacturing_node(state: FinalState):
    emit_log("  🏭 Analyzing cross-fleet failure patterns")

    db = get_db()
    all_results = state.get("all_vehicle_results", [])

    # Aggregate patterns
    patterns = {}
    for vr in all_results:
        vid = vr.get("vehicle_id", "")
        vehicle = db.get_vehicle_detail(vid)
        if not vehicle:
            continue
        model = vehicle["model"]
        year = vehicle["year"]
        key = f"{model}_{year}"
        if key not in patterns:
            patterns[key] = {"model": model, "year": year, "components": {}}

        predictions = vr.get("failure_predictions", [])
        for pred in predictions:
            comp = pred.get("component", "unknown")
            if comp not in patterns[key]["components"]:
                patterns[key]["components"][comp] = 0
            patterns[key]["components"][comp] += 1

    emit_log(f"  🔍 {sum(len(d['components']) for d in patterns.values())} failure patterns identified")
    # Write raw patterns to DB
    for key, data in patterns.items():
        for comp, count in data["components"].items():
            rate = count / len(all_results) if all_results else 0
            db.save_rca(data["model"], data["year"], comp, round(rate, 3), "pending")

    # LLM analysis
    prompt = f"""You are an automotive manufacturing quality engineer.

Fleet: {state.get('oem_name', 'OEM')}, {len(all_results)} vehicles analyzed

Failure patterns found:
{json.dumps(patterns, indent=2)}

Identify design flaws and root causes.
Return JSON only:
{{
  "patterns": [
    {{
      "model": "str",
      "year": 0,
      "component": "str",
      "failure_rate": 0.0,
      "root_cause": "str",
      "recommendation": "str"
    }}
  ],
  "critical_design_issues": ["str"],
  "llm_analysis": "str (2-3 paragraph prose)"
}}"""

    try:
        llm = get_llm("manufacturing")
        response = cached_llm_call(llm, prompt, task_type="manufacturing")
        parsed = safe_parse_json(response)
    except Exception as e:
        print(f"  [LLM error] {e}")
        parsed = {"error": True}

    if parsed.get("error"):
        parsed = {
            "patterns": [{"model": k.split("_")[0], "year": k.split("_")[1], "component": c, "failure_rate": n/max(len(all_results),1), "root_cause": "Pending analysis", "recommendation": "Monitor"} for k, d in patterns.items() for c, n in d["components"].items()],
            "critical_design_issues": [],
            "llm_analysis": "Manufacturing analysis pending LLM review."
        }

    # Update DB with LLM notes
    for p in parsed.get("patterns", []):
        try:
            db.update_rca_notes(str(p.get("model", "")), int(p.get("year", 0)), p.get("component", ""), p.get("root_cause", ""))
        except Exception:
            pass

    return {"rca_report": parsed}


# ─────────────────────────────────────────────
# NODE 8: ORCHESTRATOR (Runs ONCE, final graph)
# ─────────────────────────────────────────────
def orchestrator_node(state: FinalState):
    emit_log("  📝 Generating final executive BI report")

    db = get_db()
    all_results = state.get("all_vehicle_results", [])
    rca_report = state.get("rca_report", {})
    oem_name = state.get("oem_name", "OEM")

    # Build fleet summary
    critical_count = 0
    warning_count = 0
    healthy_count = 0
    total_health = 0
    booked = 0
    delayed = 0

    vehicles_data = []
    for vr in all_results:
        vid = vr.get("vehicle_id", "")
        vehicle = db.get_vehicle_detail(vid)
        fr = vr.get("fleet_report", {})
        hs = fr.get("health_score", 100)
        total_health += hs

        preds = vr.get("failure_predictions", [])
        has_crit = vr.get("has_critical_issues", False)
        if has_crit:
            critical_count += 1
        elif hs < 80:
            warning_count += 1
        else:
            healthy_count += 1

        sched = vr.get("scheduling_details")
        if sched and sched.get("status") == "booked":
            booked += 1
        elif sched and sched.get("status") == "delayed":
            delayed += 1

        vehicles_data.append({
            "vehicle_id": vid,
            "model": vehicle.get("model", "N/A") if vehicle else "N/A",
            "year": vehicle.get("year", 0) if vehicle else 0,
            "owner_name": vehicle.get("owner_name", "N/A") if vehicle else "N/A",
            "city": vehicle.get("city", "N/A") if vehicle else "N/A",
            "health_score": hs,
            "status": "critical" if has_crit else ("warning" if hs < 80 else "healthy"),
            "predictions": preds,
            "appointment": sched,
            "outreach": vr.get("outreach_log"),
            "feedback": vr.get("feedback_report")
        })

    avg_health = round(total_health / max(len(all_results), 1), 1)

    fleet_summary = {
        "fleet_size": len(all_results),
        "average_health_score": avg_health,
        "critical_count": critical_count,
        "warning_count": warning_count,
        "healthy_count": healthy_count,
        "appointments_booked": booked,
        "appointments_delayed": delayed
    }

    # LLM report
    prompt = f"""You are a fleet intelligence analyst for {oem_name}.

Generate an executive BI report.

Fleet data:
{json.dumps(fleet_summary, indent=2)}

Manufacturing insights:
{json.dumps(rca_report, indent=2) if rca_report else 'None available'}

Return JSON only:
{{
  "executive_summary": "str (3 sentences)",
  "recommendations": ["str", "str", "str", "str", "str"],
  "risk_assessment": "str",
  "llm_report": "str (full markdown report with sections: ## Executive Summary, ## Critical Alerts Table, ## Fleet Health Overview, ## Diagnosis Summary, ## Scheduling Summary, ## Manufacturing Quality Insights, ## Recommendations. Use markdown tables where appropriate. Use emojis in section headers.)"
}}"""

    try:
        llm = get_llm("orchestrator")
        response = cached_llm_call(llm, prompt, task_type="orchestrator")
        parsed = safe_parse_json(response)
    except Exception as e:
        print(f"  [LLM error] {e}")
        parsed = {"error": True}

    if parsed.get("error"):
        parsed = {
            "executive_summary": f"Fleet of {len(all_results)} vehicles analyzed. {critical_count} critical issues found.",
            "recommendations": ["Schedule immediate service for critical vehicles", "Monitor warning vehicles", "Continue routine maintenance"],
            "risk_assessment": "moderate",
            "llm_report": f"# Fleet Report\n\n{critical_count} critical, {warning_count} warning, {healthy_count} healthy."
        }

    final_report = {
        "run_id": state.get("run_id", ""),
        "oem_name": oem_name,
        "analysis_date": datetime.now().isoformat(),
        "summary": fleet_summary,
        "vehicles": vehicles_data,
        "manufacturing_insights": rca_report,
        "recommendations": parsed.get("recommendations", []),
        "executive_summary": parsed.get("executive_summary", ""),
        "risk_assessment": parsed.get("risk_assessment", ""),
        "llm_report": parsed.get("llm_report", "")
    }

    return {"final_report": final_report}
