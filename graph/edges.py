from .state import MaintenanceState

def route_after_diagnosis(state: MaintenanceState) -> str:
    if state.get("has_critical_issues"):
        return "customer_engagement"
    return "__end__"

def route_after_scheduling(state: MaintenanceState) -> str:
    if state.get("scheduling_failed"):
        return "notify_delay"
    return "feedback"
