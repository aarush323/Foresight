from langgraph.graph import StateGraph, START, END
from .state import MaintenanceState, FinalState
from .nodes import (
    data_analysis_node, diagnosis_node, customer_engagement_node,
    scheduling_node, notify_delay_node, feedback_node,
    manufacturing_node, orchestrator_node
)
from .edges import route_after_diagnosis, route_after_scheduling


def build_vehicle_graph():
    """Per-vehicle graph: data_analysis → diagnosis → conditional engagement/scheduling."""
    workflow = StateGraph(MaintenanceState)

    workflow.add_node("data_analysis", data_analysis_node)
    workflow.add_node("diagnosis", diagnosis_node)
    workflow.add_node("customer_engagement", customer_engagement_node)
    workflow.add_node("scheduling", scheduling_node)
    workflow.add_node("notify_delay", notify_delay_node)
    workflow.add_node("feedback", feedback_node)

    workflow.add_edge(START, "data_analysis")
    workflow.add_edge("data_analysis", "diagnosis")

    workflow.add_conditional_edges(
        "diagnosis",
        route_after_diagnosis,
        {
            "customer_engagement": "customer_engagement",
            "__end__": END
        }
    )

    workflow.add_edge("customer_engagement", "scheduling")

    workflow.add_conditional_edges(
        "scheduling",
        route_after_scheduling,
        {
            "notify_delay": "notify_delay",
            "feedback": "feedback"
        }
    )

    workflow.add_edge("notify_delay", END)
    workflow.add_edge("feedback", END)

    return workflow.compile()


def build_final_graph():
    """Post-loop graph: manufacturing → orchestrator (both run once)."""
    workflow = StateGraph(FinalState)

    workflow.add_node("manufacturing", manufacturing_node)
    workflow.add_node("orchestrator", orchestrator_node)

    workflow.add_edge(START, "manufacturing")
    workflow.add_edge("manufacturing", "orchestrator")
    workflow.add_edge("orchestrator", END)

    return workflow.compile()
