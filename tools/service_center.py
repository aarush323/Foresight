from langchain_core.tools import tool
from geopy.distance import geodesic
import json
from typing import Dict, Any, List, Optional
from app.database import Database

# Static Service Centers
SERVICE_CENTERS = {
    "mumbai": {
        "id": "mumbai",
        "name": "Mumbai Tech Hub",
        "coords": (19.0760, 72.8777),
        "technicians": [
            {"id": "M001", "name": "Rajesh", "specialization": "EV Battery"},
            {"id": "M002", "name": "Suresh", "specialization": "Brakes"},
            {"id": "M003", "name": "Vikram", "specialization": "Engine/Drivetrain"}
        ]
    },
    "delhi": {
        "id": "delhi",
        "name": "Delhi Auto Care",
        "coords": (28.6139, 77.2090),
        "technicians": [
            {"id": "D001", "name": "Amit", "specialization": "EV Battery"},
            {"id": "D002", "name": "Priya", "specialization": "Brakes"},
            {"id": "D003", "name": "Rahul", "specialization": "Engine/Drivetrain"}
        ]
    },
    "bangalore": {
        "id": "bangalore",
        "name": "Bangalore EV Clinic",
        "coords": (12.9716, 77.5946),
        "technicians": [
            {"id": "B001", "name": "Karthik", "specialization": "EV Battery"},
            {"id": "B002", "name": "Deepa", "specialization": "Brakes"},
            {"id": "B003", "name": "Santosh", "specialization": "Engine/Drivetrain"}
        ]
    },
    "chennai": {
        "id": "chennai",
        "name": "Chennai Service",
        "coords": (13.0827, 80.2707),
        "technicians": [
            {"id": "C001", "name": "Mani", "specialization": "EV Battery"},
            {"id": "C002", "name": "Anbu", "specialization": "Brakes"},
            {"id": "C003", "name": "Selvam", "specialization": "Engine/Drivetrain"}
        ]
    },
    "hyderabad": {
        "id": "hyderabad",
        "name": "Hyderabad Motors",
        "coords": (17.3850, 78.4867),
        "technicians": [
            {"id": "H001", "name": "Arjun", "specialization": "EV Battery"},
            {"id": "H002", "name": "Zaid", "specialization": "Brakes"},
            {"id": "H003", "name": "Kiran", "specialization": "Engine/Drivetrain"}
        ]
    }
}

@tool
def get_available_centers_sorted_by_distance(lat: float, lng: float) -> str:
    """Finds service centers sorted by proximity to the vehicle."""
    centers_list = []
    vehicle_loc = (lat, lng)
    
    for cid, data in SERVICE_CENTERS.items():
        dist = geodesic(vehicle_loc, data["coords"]).km
        centers_list.append({
            "id": data["id"],
            "name": data["name"],
            "distance_km": round(dist, 1),
            "technicians": data["technicians"]
        })
    
    sorted_centers = sorted(centers_list, key=lambda x: x["distance_km"])
    return json.dumps(sorted_centers)

@tool
def book_service_appointment(vehicle_id: str, center_id: str, tech_id: str, slot: str) -> str:
    """Books an appointment at a service center via the persistent database."""
    db = Database()
    center = SERVICE_CENTERS.get(center_id)
    if not center:
        return json.dumps({"error": "Invalid center ID"})
        
    tech = next((t for t in center["technicians"] if t["id"] == tech_id), None)
    if not tech:
        return json.dumps({"error": "Invalid technician ID"})

    app_id = db.book_appointment(
        vehicle_id, center_id, tech_id, tech["specialization"], slot
    )
    
    return json.dumps({
        "status": "success",
        "appointment_id": app_id,
        "details": {
            "center": center["name"],
            "technician": tech["name"],
            "specialization": tech["specialization"],
            "slot": slot
        }
    })
