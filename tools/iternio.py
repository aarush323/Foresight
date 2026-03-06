from langchain_core.tools import tool
import json
import random

@tool
def optimize_ev_route(vehicle_id: str, distance_km: float) -> str:
    """
    Simulates Iternio API for EV route planning and charging optimization.
    Returns optimal charging stops and energy consumption.
    """
    # Deterministic but random-ish simulation
    consumption_rate = 0.2 # kWh per km
    total_energy = distance_km * consumption_rate
    
    stops = []
    if distance_km > 200:
        stops.append({
            "station_name": "ChargePoint Hub - Navi Mumbai",
            "distance": 120,
            "charge_time_mins": 25,
            "connector_type": "CCS2"
        })
    
    result = {
        "vehicle_id": vehicle_id,
        "distance": distance_km,
        "total_energy_kwh": round(total_energy, 1),
        "charging_stops": stops,
        "estimated_travel_time_hours": round(distance_km / 60, 1)
    }
    
    return json.dumps(result)
