import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

class Database:
    def __init__(self, db_path: str = "data/vehicles.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.init()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init(self):
        """Create all tables if not exist."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vehicles (
                id TEXT PRIMARY KEY,
                model TEXT,
                year INTEGER,
                owner_name TEXT,
                owner_phone TEXT,
                owner_email TEXT,
                city TEXT,
                latitude REAL,
                longitude REAL,
                climate TEXT,
                usage_type TEXT,
                mileage INTEGER,
                age_years INTEGER
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS telemetry_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicle_id TEXT,
                run_id TEXT,
                timestamp TEXT,
                sensors TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS failure_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicle_id TEXT,
                component TEXT,
                severity REAL,
                mileage_at_failure INTEGER,
                date_recorded TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS manufacturing_qa (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model TEXT,
                year INTEGER,
                component TEXT,
                failure_rate REAL,
                rca_notes TEXT,
                date_recorded TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS outreach_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicle_id TEXT,
                run_id TEXT,
                channel TEXT,
                message TEXT,
                timestamp TEXT,
                status TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS appointments (
                id TEXT PRIMARY KEY,
                vehicle_id TEXT,
                center_id TEXT,
                technician_id TEXT,
                technician_specialization TEXT,
                slot_time TEXT,
                status TEXT,
                created_at TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS satisfaction (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                appointment_id TEXT,
                vehicle_id TEXT,
                score INTEGER,
                notes TEXT,
                timestamp TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS run_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT UNIQUE,
                oem_name TEXT,
                analysis_date TEXT,
                fleet_size INTEGER,
                average_health_score REAL,
                critical_count INTEGER,
                warning_count INTEGER,
                healthy_count INTEGER,
                appointments_booked INTEGER,
                raw_json TEXT
            )
        ''')

        conn.commit()
        conn.close()

    def upsert_vehicle_from_report(self, v: dict):
        """Upsert vehicle data from the pipeline report."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO vehicles (id, model, year, owner_name, city)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                model=excluded.model,
                year=excluded.year,
                owner_name=excluded.owner_name,
                city=excluded.city
        ''', (v["vehicle_id"], v.get("model"), v.get("year"), v.get("owner_name"), v.get("city")))
        conn.commit()
        conn.close()

    def save_run_summary(self, run_id: str, oem_name: str, analysis_date: str, summary: dict, raw_json: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO run_history (
                run_id, oem_name, analysis_date, fleet_size, 
                average_health_score, critical_count, warning_count, 
                healthy_count, appointments_booked, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(run_id) DO UPDATE SET
                analysis_date=excluded.analysis_date,
                average_health_score=excluded.average_health_score,
                critical_count=excluded.critical_count,
                raw_json=excluded.raw_json
        ''', (
            run_id, oem_name, analysis_date, summary.get("fleet_size"),
            summary.get("average_health_score"), summary.get("critical_count"),
            summary.get("warning_count"), summary.get("healthy_count"),
            summary.get("appointments_booked"), raw_json
        ))
        conn.commit()
        conn.close()

    def save_telemetry(self, vehicle_id: str, run_id: str, sensors_dict: Dict):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO telemetry_log (vehicle_id, run_id, timestamp, sensors)
            VALUES (?, ?, ?, ?)
        ''', (vehicle_id, run_id, datetime.now().isoformat(), json.dumps(sensors_dict)))
        conn.commit()
        conn.close()

    def get_telemetry_history(self, vehicle_id: str) -> List[Dict]:
        """Get last 20 telemetry readings for a vehicle."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM telemetry_log WHERE vehicle_id = ? ORDER BY timestamp DESC LIMIT 20",
            (vehicle_id,)
        )
        rows = []
        for row in cursor.fetchall():
            d = dict(row)
            if d.get("sensors"):
                try:
                    d["sensors"] = json.loads(d["sensors"])
                except Exception:
                    pass
            rows.append(d)
        conn.close()
        return rows

    def get_failure_history(self, vehicle_id: str) -> List[Dict]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM failure_history WHERE vehicle_id = ?", (vehicle_id,))
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return rows

    def save_failure_predictions(self, vehicle_id: str, predictions: list):
        """Write multiple failure predictions to failure_history table."""
        conn = self._get_connection()
        cursor = conn.cursor()
        for pred in predictions:
            cursor.execute('''
                INSERT INTO failure_history (vehicle_id, component, severity, mileage_at_failure, date_recorded)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                vehicle_id,
                pred.get("component", "unknown"),
                pred.get("severity", 0),
                0,
                datetime.now().isoformat()
            ))
        conn.commit()
        conn.close()

    def get_manufacturing_patterns(self, model: str, year: int) -> List[Dict]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM manufacturing_qa WHERE model = ? AND year = ?", (model, year))
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return rows

    def save_outreach(self, vehicle_id: str, run_id: str, channel: str, message: str, status: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO outreach_log (vehicle_id, run_id, channel, message, timestamp, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (vehicle_id, run_id, channel, message, datetime.now().isoformat(), status))
        conn.commit()
        conn.close()

    def upsert_appointment(self, appt: dict, vehicle_id: str, run_id: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        # Deterministic handle
        app_id = f"APP_{run_id}_{vehicle_id}"
        cursor.execute('''
            INSERT INTO appointments (id, vehicle_id, center_id, technician_id, technician_specialization, slot_time, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status=excluded.status
        ''', (
            app_id, vehicle_id, appt.get("center_name"), appt.get("technician_name"),
            appt.get("specialization"), appt.get("slot_time"), appt.get("status"), datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()

    def save_satisfaction_from_report(self, feedback: dict, vehicle_id: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO satisfaction (appointment_id, vehicle_id, score, notes, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            feedback.get("appointment_id"), vehicle_id, 
            feedback.get("satisfaction_score"), feedback.get("notes"),
            datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()

    def save_feedback(self, appointment_id: str, vehicle_id: str, score: int, notes: str):
        """Alias so graph nodes don't need to know the internal method name."""
        self.save_satisfaction_from_report(
            feedback={"appointment_id": appointment_id, "satisfaction_score": score, "notes": notes},
            vehicle_id=vehicle_id
        )

    def save_manufacturing_pattern(self, run_id: str, pattern: dict):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO manufacturing_qa (model, year, component, failure_rate, rca_notes, date_recorded)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            pattern.get("model"), pattern.get("year"), pattern.get("component"),
            pattern.get("failure_rate"), pattern.get("root_cause"), datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()

    def get_cumulative_stats(self) -> dict:
        """Aggregates across all run_history rows."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT run_id, analysis_date, average_health_score,
                   critical_count, warning_count, healthy_count,
                   fleet_size, appointments_booked
            FROM run_history
            ORDER BY analysis_date ASC
        ''')
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"runs": rows, "total_runs": len(rows)}

    def get_failure_trends(self) -> dict:
        """Counts each component in failure_history across ALL runs."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT component, COUNT(*) as occurrences,
                   AVG(severity) as avg_severity,
                   MAX(severity) as max_severity
            FROM failure_history
            GROUP BY component
            ORDER BY occurrences DESC
            LIMIT 20
        ''')
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"components": rows}

    def get_satisfaction_trend(self) -> dict:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT DATE(timestamp) as date, AVG(score) as avg_score, COUNT(*) as count
            FROM satisfaction
            GROUP BY DATE(timestamp)
            ORDER BY date ASC
        ''')
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"trend": rows}

    def get_vehicle_detail(self, vehicle_id: str) -> Optional[Dict]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    def book_appointment(self, vehicle_id: str, center_id: str, tech_id: str, tech_spec: str, slot_time: str):
        """Called by graph node. Returns a deterministic appointment ID."""
        conn = self._get_connection()
        cursor = conn.cursor()
        # We don't have run_id here easily from graph signature, 
        # but we can use timestamp to keep it unique or just generic deterministic
        app_id = f"APP_{vehicle_id}_{slot_time.replace(':', '').replace(' ', '_')}"
        cursor.execute('''
            INSERT INTO appointments (id, vehicle_id, center_id, technician_id, technician_specialization, slot_time, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET status='scheduled'
        ''', (app_id, vehicle_id, center_id, tech_id, tech_spec, slot_time, 'scheduled', datetime.now().isoformat()))
        conn.commit()
        conn.close()
        return app_id

    def save_rca(self, model: str, year: int, component: str, rate: float, rca_notes: str):
        """Called by manufacturing nodes in graph."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO manufacturing_qa (model, year, component, failure_rate, rca_notes, date_recorded)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (model, year, component, rate, rca_notes, datetime.now().isoformat()))
        conn.commit()
        conn.close()

    def update_appointment_status(self, appointment_id: str, status: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE appointments SET status = ? WHERE id = ?",
            (status, appointment_id)
        )
        conn.commit()
        conn.close()

    def update_rca_notes(self, model: str, year: int, component: str, notes: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE manufacturing_qa SET rca_notes = ? WHERE model = ? AND year = ? AND component = ?",
            (notes, model, year, component)
        )
        conn.commit()
        conn.close()

# Singleton instance — import this everywhere instead of Database()
_db_instance = None

def get_db() -> Database:
    global _db_instance
    if _db_instance is None:
        _db_instance = Database()
    return _db_instance
