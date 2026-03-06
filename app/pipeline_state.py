from datetime import datetime

# Global pipeline state — imported by both api.py and pipeline.py
pipeline_logs: list = []
pipeline_running: bool = False
pipeline_complete: bool = False


def emit_log(message: str):
    timestamp = datetime.now().strftime("%H:%M:%S")
    entry = {"time": timestamp, "message": message}
    pipeline_logs.append(entry)
    print(f"[{timestamp}] {message}")


def reset_state():
    global pipeline_logs, pipeline_running, pipeline_complete
    pipeline_logs = []
    pipeline_running = False
    pipeline_complete = False
