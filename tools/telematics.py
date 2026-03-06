from langchain_core.tools import tool
import json
import hashlib
from datetime import datetime
from typing import Dict, Any

def _generate_seed(vehicle_id: str) -> int:
    return int(hashlib.md5(vehicle_id.encode()).hexdigest()[:8], 16)

def _seeded_random(seed: int, min_val: float, max_val: float) -> float:
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    normalized = seed / 0x7fffffff
    return min_val + normalized * (max_val - min_val)

@tool
def get_vehicle_telemetry(vehicle_id: str) -> str:
    """
    Simulates real-time vehicle telematics data including engine metrics, 
    brake condition, battery status, and diagnostic codes.
    """
    if not vehicle_id.startswith("VEH"):
        return "Error: Invalid vehicle_id"

    base_seed = _generate_seed(vehicle_id)
    vehicle_num = int(vehicle_id[-3:]) if vehicle_id[-3:].isdigit() else 1
    
    # Even numbers have issues
    has_issues = vehicle_num % 2 == 0
    warning_level = "high" if vehicle_num in [4, 8] else ("medium" if has_issues else "none")
    
    dtcs = []
    if has_issues:
        if vehicle_num == 2: dtcs = ["P0300", "P0171"]
        elif vehicle_num == 4: dtcs = ["P0128", "P0420"]
        elif vehicle_num == 8: dtcs = ["P0300", "P0128"]
    
    # Simulated sensor readings
    temp_base = 195 if not has_issues else 215
    engine_temp = temp_base + _seeded_random(base_seed, -2, 5)
    
    oil_pressure = 40 if not has_issues else 22
    oil_pressure += _seeded_random(base_seed + 1, -3, 3)
    
    telematics = {
        "vehicle_id": vehicle_id,
        "engine_temp_f": round(engine_temp, 1),
        "oil_pressure_psi": round(oil_pressure, 1),
        "battery_voltage": round(12.6 if not has_issues else 11.7, 2),
        "brake_pad_mm": round(8.0 if not has_issues else 3.2, 1),
        "dtc_codes": dtcs,
        "status": "warning" if has_issues else "healthy"
    }
    
    return json.dumps(telematics)
