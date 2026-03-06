from typing import TypedDict, Optional, List, Dict, Any

class MaintenanceState(TypedDict):
    """Per-vehicle graph state."""
    # INPUTS
    oem_name: str
    vehicle_id: str
    vehicle_count: int
    run_id: str
    analysis_date: str
    priority_override: bool

    # NODE OUTPUTS
    fleet_report: Optional[Dict]
    failure_predictions: Optional[List[Dict]]
    outreach_log: Optional[Dict]
    scheduling_details: Optional[Dict]
    feedback_report: Optional[Dict]

    # CONTROL FLAGS
    has_critical_issues: bool
    scheduling_failed: bool


class FinalState(TypedDict):
    """State for the final (manufacturing + orchestrator) graph."""
    all_vehicle_results: List[Dict]
    oem_name: str
    run_id: str
    rca_report: Optional[Dict]
    final_report: Optional[Dict]
