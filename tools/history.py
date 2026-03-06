from langchain_core.tools import tool
from datetime import datetime
import json
import random
from typing import Dict, Any, List, Optional
from app.database import Database

@tool
def get_maintenance_history(vehicle_id: str) -> str:
    """
    Simulates a comprehensive vehicle maintenance history and predictive failure calculation.
    Uses calculated risk formulas based on vehicle age, mileage and usage.
    """
    db = Database()
    vehicle = db.get_vehicle_detail(vehicle_id)
    if not vehicle:
        return json.dumps({"error": "Vehicle not found"})

    history = db.get_failure_history(vehicle_id)
    
    # Formula logic
    components = [
        {"name": "Brake Pads", "base_rate": 0.15, "mileage_factor": 0.000008},
        {"name": "Battery", "base_rate": 0.12, "age_factor": 0.05},
        {"name": "Transmission", "base_rate": 0.06, "usage_factor": 0.03}
    ]
    
    predictions = []
    age = vehicle["age_years"]
    mileage = vehicle["mileage"]
    usage = vehicle["usage_type"]
    climate = vehicle["climate"]

    for comp in components:
        prob = comp["base_rate"]
        if "age_factor" in comp: prob += comp["age_factor"] * age
        if "mileage_factor" in comp: prob += comp["mileage_factor"] * mileage
        
        usage_mult = {"heavy": 1.4, "normal": 1.0, "light": 0.7}
        if "usage_factor" in comp: prob += comp["usage_factor"] * usage_mult.get(usage, 1.0)
        
        prob = min(prob, 0.95)
        
        predictions.append({
            "component": comp["name"],
            "failure_probability": round(prob, 3),
            "severity": "High" if prob > 0.7 else "Medium" if prob > 0.4 else "Low",
            "estimated_days_to_failure": int(365 * (1 - prob) * random.uniform(0.5, 1.5))
        })

    result = {
        "vehicle_id": vehicle_id,
        "history_records": history,
        "predictions": predictions,
        "patterns": db.get_manufacturing_patterns(vehicle["model"], vehicle["year"])
    }
    
    return json.dumps(result)
