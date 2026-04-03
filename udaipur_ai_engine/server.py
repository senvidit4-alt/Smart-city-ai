"""
FastAPI server for Udaipur Smart City Copilot
Wraps the existing LangGraph agent and exposes REST endpoints
consumed by the Next.js dashboard at http://localhost:3001.

Run from inside udaipur_ai_engine/:
    uvicorn server:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import sys
import asyncio
import concurrent.futures
from datetime import datetime, timedelta
from typing import Any, Optional

import pandas as pd
from dotenv import load_dotenv, find_dotenv
from fastapi import FastAPI, Query, Form, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Load env & fix working directory ──────────────────────────────────────────
# When uvicorn is launched from the repo root, resolve paths relative to this file.
HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
sys.path.insert(0, HERE)

load_dotenv(find_dotenv(), override=True)

# ── Import the existing agent (after chdir so joblib paths resolve) ───────────
# Wrapped in try/except — if agent.py fails (missing key, model error etc.)
# all the data endpoints still work; only /api/chat returns a graceful error.
_agent_import_error: str | None = None
try:
    from agent import agent_executor  # noqa: E402  (must be after chdir)
except Exception as _e:
    agent_executor = None  # type: ignore[assignment]
    _agent_import_error = str(_e)
    print(f"[server] WARNING: agent import failed — chat endpoint disabled. Error: {_e}")

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Udaipur Smart City Copilot API",
    description="Municipal intelligence backend for the Next.js dashboard",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Data helpers ───────────────────────────────────────────────────────────────

def _load(filename: str) -> pd.DataFrame | None:
    try:
        return pd.read_csv(os.path.join(HERE, "data", filename))
    except Exception:
        return None


def _content_to_text(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, (list, tuple)):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and isinstance(part.get("text"), str):
                parts.append(part["text"])
        return "\n".join(parts) if parts else str(content)
    if isinstance(content, dict) and isinstance(content.get("text"), str):
        return content["text"]
    return str(content)


def _extract_tool_calls(messages: list) -> tuple[list[str], list[dict]]:
    """Pull tool names + params from LangGraph message list."""
    tools_used: list[str] = []
    thinking_steps: list[dict] = []
    for msg in messages:
        # ToolMessage or AIMessage with tool_calls
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                name = tc.get("name", "") if isinstance(tc, dict) else getattr(tc, "name", "")
                args = tc.get("args", {}) if isinstance(tc, dict) else getattr(tc, "args", {})
                tools_used.append(name)
                thinking_steps.append({
                    "tool": name,
                    "params": {k: str(v) for k, v in (args or {}).items()},
                    "result_summary": None,
                })
        # Attach tool result summaries
        if hasattr(msg, "name") and msg.name and hasattr(msg, "content"):
            result_text = _content_to_text(msg.content)
            # Match to last thinking step with same tool name
            for step in reversed(thinking_steps):
                if step["tool"] == msg.name and step["result_summary"] is None:
                    step["result_summary"] = result_text[:120].replace("\n", " ")
                    break
    return list(dict.fromkeys(tools_used)), thinking_steps  # dedupe tools_used


# ── Pydantic models ────────────────────────────────────────────────────────────

class MessageItem(BaseModel):
    id: str = ""
    role: str
    content: str
    timestamp: str = ""


class ChatRequest(BaseModel):
    message: str
    history: list[MessageItem] = []


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "Udaipur Smart City Copilot API"}


# ── KPIs ───────────────────────────────────────────────────────────────────────

@app.get("/api/kpis")
def get_kpis():
    complaints_df = _load("complaints_data.csv")
    lakes_df = _load("lake_levels.csv")

    pending = 0
    high_severity_pct = 0
    if complaints_df is not None:
        pending = int(len(complaints_df[complaints_df["status"] == "Pending"]))
        if "severity" in complaints_df.columns:
            high = len(complaints_df[complaints_df["severity"].str.lower().isin(["high", "critical"])])
            high_severity_pct = round(high / max(len(complaints_df), 1) * 100)
        else:
            high_severity_pct = 23  # fallback

    fateh_level = 6.2
    fateh_risk = "medium"
    if lakes_df is not None:
        fs = lakes_df[lakes_df["lake_name"] == "Fateh Sagar"]["level_ft"]
        if not fs.empty:
            level_ft = float(fs.iloc[0])
            # Convert feet to metres for the frontend (1 ft ≈ 0.3048 m)
            fateh_level = round(level_ft * 0.3048, 1)
            if level_ft < 10:
                fateh_risk = "critical"
            elif level_ft < 12:
                fateh_risk = "high"
            elif level_ft < 14:
                fateh_risk = "medium"
            else:
                fateh_risk = "normal"

    return {
        "pending_complaints": pending or 127,
        "high_severity_pct": high_severity_pct or 23,
        "fateh_sagar_level": fateh_level,
        "fateh_sagar_risk": fateh_risk,
        "staff_efficiency": 82,
        "efficiency_trend": "up",
        "next_event_name": "Gangaur Fair",
        "next_event_days": 12,
        "next_event_risk": "high",
    }


# ── Complaints ─────────────────────────────────────────────────────────────────

@app.get("/api/complaints")
def get_complaints(
    ward: str = Query(default=""),
    type: str = Query(default=""),
    days: int = Query(default=30),
):
    df = _load("complaints_data.csv")
    if df is None:
        return {"complaints": [], "total": 0, "pending": 0, "surge_pct": 0}

    # Normalise column names
    df.columns = [c.lower().strip() for c in df.columns]

    # Map existing columns to frontend schema
    col_map = {
        "area": "ward",
        "category": "type",
        "complaint_id": "id",
        "date_filed": "date",
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    # Ensure required columns exist
    if "id" not in df.columns:
        df["id"] = [f"CMP-{1000 + i}" for i in range(len(df))]
    if "date" not in df.columns:
        df["date"] = datetime.now().strftime("%Y-%m-%d")
    if "severity" not in df.columns:
        df["severity"] = "medium"
    if "description" not in df.columns:
        df["description"] = df.get("type", pd.Series(["Issue"] * len(df)))
    if "location" not in df.columns:
        df["location"] = df.get("ward", pd.Series(["Udaipur"] * len(df)))

    # Filters
    cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    try:
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
        df = df[df["date"] >= cutoff]
    except Exception:
        pass

    if ward:
        df = df[df.get("ward", pd.Series()).str.lower() == ward.lower()]
    if type:
        df = df[df.get("type", pd.Series()).str.lower() == type.lower()]

    pending_mask = df.get("status", pd.Series(["Pending"] * len(df))).str.lower().isin(
        ["pending", "in_progress", "open"]
    )
    pending = int(pending_mask.sum())

    records = df.head(200).to_dict(orient="records")
    # Sanitise each record for JSON
    clean = []
    for r in records:
        clean.append({
            "id": str(r.get("id", "")),
            "date": str(r.get("date", "")),
            "ward": str(r.get("ward", r.get("area", "Unknown"))),
            "type": str(r.get("type", r.get("category", "General"))),
            "severity": str(r.get("severity", "medium")).lower(),
            "status": str(r.get("status", "pending")).lower().replace(" ", "_"),
            "description": str(r.get("description", ""))[:200],
            "location": str(r.get("location", "")),
        })

    return {
        "complaints": clean,
        "total": len(df),
        "pending": pending,
        "surge_pct": 18,
    }


# ── Events ─────────────────────────────────────────────────────────────────────

@app.get("/api/events")
def get_events(upcoming: bool = Query(default=True)):
    df = _load("events_data.csv")

    # Fallback static events if CSV missing or empty
    fallback = [
        {
            "id": "EVT-001", "name": "Gangaur Fair", "type": "Religious Festival",
            "date": (datetime.now() + timedelta(days=12)).strftime("%Y-%m-%d"),
            "location": "Gangaur Ghat, Old City", "crowd_estimate": 85000,
            "risk_level": "high", "trucks_required": 24, "officers_required": 180,
            "tankers_required": 12, "days_away": 12,
            "description": "Major religious festival with processions across the old city.",
            "cost_estimate": 485000,
            "checklist": [
                {"id": "c1", "label": "Deploy traffic marshals", "due_days_before": 3, "completed": False},
                {"id": "c2", "label": "Set up medical camps", "due_days_before": 5, "completed": True},
                {"id": "c3", "label": "Arrange water tankers", "due_days_before": 2, "completed": False},
                {"id": "c4", "label": "Coordinate with police", "due_days_before": 7, "completed": True},
            ],
        },
        {
            "id": "EVT-002", "name": "Mewar Festival", "type": "Cultural Festival",
            "date": (datetime.now() + timedelta(days=18)).strftime("%Y-%m-%d"),
            "location": "City Palace, Pichola Lake", "crowd_estimate": 60000,
            "risk_level": "medium", "trucks_required": 16, "officers_required": 120,
            "tankers_required": 8, "days_away": 18,
            "description": "Three-day cultural festival celebrating the arrival of spring.",
            "cost_estimate": 320000,
            "checklist": [
                {"id": "c1", "label": "Stage setup coordination", "due_days_before": 5, "completed": True},
                {"id": "c2", "label": "Parking management plan", "due_days_before": 3, "completed": False},
            ],
        },
        {
            "id": "EVT-003", "name": "Holi Celebration", "type": "Religious Festival",
            "date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
            "location": "Fateh Sagar Lake, City-wide", "crowd_estimate": 120000,
            "risk_level": "critical", "trucks_required": 35, "officers_required": 250,
            "tankers_required": 20, "days_away": 5,
            "description": "City-wide Holi celebrations with major gatherings at Fateh Sagar.",
            "cost_estimate": 720000,
            "checklist": [
                {"id": "c1", "label": "Emergency response teams", "due_days_before": 1, "completed": False},
                {"id": "c2", "label": "Water supply coordination", "due_days_before": 2, "completed": False},
                {"id": "c3", "label": "Crowd control barriers", "due_days_before": 2, "completed": True},
            ],
        },
    ]

    if df is None or df.empty:
        return fallback

    df.columns = [c.lower().strip() for c in df.columns]
    events = []
    for i, row in df.iterrows():
        name = str(row.get("event_name", row.get("name", f"Event {i}")))
        crowd = int(row.get("crowd", row.get("crowd_estimate", 10000)))
        events.append({
            "id": f"EVT-{i+1:03d}",
            "name": name,
            "type": str(row.get("type", row.get("event_type", "Festival"))),
            "date": (datetime.now() + timedelta(days=10 + i * 7)).strftime("%Y-%m-%d"),
            "location": str(row.get("area", row.get("location", "Udaipur"))),
            "crowd_estimate": crowd,
            "risk_level": str(row.get("risk_level", "medium")).lower(),
            "trucks_required": int(row.get("trucks_required", 10)),
            "officers_required": int(row.get("officers_required", 80)),
            "tankers_required": int(row.get("tankers_required", 5)),
            "days_away": 10 + i * 7,
            "description": str(row.get("description", f"{name} in Udaipur.")),
            "cost_estimate": int(row.get("cost_estimate", 200000)),
            "checklist": [
                {"id": "c1", "label": "Deploy traffic marshals", "due_days_before": 3, "completed": False},
                {"id": "c2", "label": "Arrange water tankers", "due_days_before": 2, "completed": False},
            ],
        })
    return events if events else fallback


# ── Water ──────────────────────────────────────────────────────────────────────

@app.get("/api/water/current")
def get_water():
    df = _load("lake_levels.csv")

    fateh_ft = 20.4  # defaults
    pichola_ft = 15.7

    if df is not None:
        df.columns = [c.lower().strip() for c in df.columns]
        fs = df[df["lake_name"].str.lower().str.contains("fateh", na=False)]["level_ft"]
        pc = df[df["lake_name"].str.lower().str.contains("pichola", na=False)]["level_ft"]
        if not fs.empty:
            fateh_ft = float(fs.iloc[0])
        if not pc.empty:
            pichola_ft = float(pc.iloc[0])

    def ft_to_m(ft: float) -> float:
        return round(ft * 0.3048, 1)

    def risk(ft: float, min_safe_ft: float) -> str:
        if ft < min_safe_ft * 0.7:
            return "critical"
        if ft < min_safe_ft:
            return "high"
        if ft < min_safe_ft * 1.2:
            return "medium"
        return "normal"

    fateh_m = ft_to_m(fateh_ft)
    pichola_m = ft_to_m(pichola_ft)

    return {
        "fateh_sagar": {
            "name": "Fateh Sagar Lake",
            "current_level": fateh_m,
            "max_capacity": 10.5,
            "min_safe": 4.0,
            "risk_level": risk(fateh_ft, 13.0),
            "last_updated": datetime.now().isoformat(),
        },
        "pichola": {
            "name": "Lake Pichola",
            "current_level": pichola_m,
            "max_capacity": 8.8,
            "min_safe": 3.5,
            "risk_level": risk(pichola_ft, 10.0),
            "last_updated": datetime.now().isoformat(),
        },
        "supply_mld": 142,
        "demand_mld": 168,
        "tankers_deployed": 28,
        "tankers_recommended": 35,
        "risk_areas": [
            {"name": "Hiran Magri Sector 4", "ward": "Hiran Magri", "risk_level": "high", "lat": 24.5854, "lng": 73.6784},
            {"name": "Badi Village", "ward": "Badi", "risk_level": "critical", "lat": 24.6234, "lng": 73.6123},
            {"name": "Pratap Nagar East", "ward": "Pratap Nagar", "risk_level": "medium", "lat": 24.5612, "lng": 73.7012},
            {"name": "Old City Core", "ward": "Old City", "risk_level": "medium", "lat": 24.5764, "lng": 73.6851},
        ],
        "forecast": [
            {"month": "Apr", "fateh_sagar": fateh_m, "pichola": pichola_m, "supply_availability": 85, "risk_level": "medium"},
            {"month": "May", "fateh_sagar": round(fateh_m - 0.8, 1), "pichola": round(pichola_m - 0.7, 1), "supply_availability": 72, "risk_level": "high"},
            {"month": "Jun", "fateh_sagar": round(fateh_m - 1.4, 1), "pichola": round(pichola_m - 1.2, 1), "supply_availability": 60, "risk_level": "high"},
            {"month": "Jul", "fateh_sagar": round(fateh_m - 0.1, 1), "pichola": round(pichola_m + 0.4, 1), "supply_availability": 88, "risk_level": "medium"},
            {"month": "Aug", "fateh_sagar": round(fateh_m + 2.2, 1), "pichola": round(pichola_m + 2.3, 1), "supply_availability": 98, "risk_level": "low"},
            {"month": "Sep", "fateh_sagar": round(fateh_m + 3.0, 1), "pichola": round(pichola_m + 3.0, 1), "supply_availability": 100, "risk_level": "normal"},
        ],
    }


# ── Staff ──────────────────────────────────────────────────────────────────────

@app.get("/api/staff/efficiency")
def get_staff(
    day: str = Query(default=""),
    department: str = Query(default=""),
):
    df = _load("staff_data.csv")

    # Build department rows — use real data if available, else sensible defaults
    dept_defaults = [
        {"department": "Water",          "total": 120, "available": 98,  "deployed": 85,  "efficiency_pct": 87, "overtime_hours": 42},
        {"department": "Sanitation",     "total": 200, "available": 165, "deployed": 148, "efficiency_pct": 74, "overtime_hours": 88},
        {"department": "Roads",          "total": 85,  "available": 72,  "deployed": 60,  "efficiency_pct": 83, "overtime_hours": 24},
        {"department": "Electricity",    "total": 95,  "available": 80,  "deployed": 71,  "efficiency_pct": 89, "overtime_hours": 18},
        {"department": "Parks",          "total": 60,  "available": 55,  "deployed": 42,  "efficiency_pct": 76, "overtime_hours": 12},
        {"department": "Health",         "total": 110, "available": 95,  "deployed": 88,  "efficiency_pct": 92, "overtime_hours": 30},
        {"department": "Administration", "total": 75,  "available": 68,  "deployed": 55,  "efficiency_pct": 80, "overtime_hours": 15},
    ]

    if df is not None and not df.empty:
        df.columns = [c.lower().strip() for c in df.columns]
        # If the CSV has department-level rows, use them
        if "department" in df.columns and "efficiency" in df.columns:
            dept_defaults = []
            for _, row in df.iterrows():
                dept_defaults.append({
                    "department": str(row.get("department", "General")),
                    "total": int(row.get("total", 100)),
                    "available": int(row.get("available", 80)),
                    "deployed": int(row.get("deployed", 70)),
                    "efficiency_pct": int(float(row.get("efficiency", 80))),
                    "overtime_hours": int(row.get("overtime_hours", 20)),
                })

    if department:
        dept_defaults = [d for d in dept_defaults if d["department"].lower() == department.lower()]

    return {
        "departments": dept_defaults,
        "potential_savings": 12400,
        "overtime_cost": 28600,
        "net_optimisation": 16200,
        "recommendations": [
            {
                "id": "rec-1",
                "department": "Sanitation",
                "issue": "18 staff on overtime in Hiran Magri zone",
                "action": "Reallocate 8 staff from Sector 11 (low demand) to Hiran Magri",
                "impact_savings": 4200,
                "impact_zones": 3,
                "icon": "Trash2",
            },
            {
                "id": "rec-2",
                "department": "Water",
                "issue": "Peak demand hours understaffed in Old City",
                "action": "Shift 5 staff to 6AM–2PM slot from 2PM–10PM",
                "impact_savings": 2800,
                "impact_zones": 2,
                "icon": "Droplets",
            },
            {
                "id": "rec-3",
                "department": "Roads",
                "issue": "Weekend deployment exceeds weekday by 40%",
                "action": "Balance weekend roster — reduce by 12 staff, add to weekday",
                "impact_savings": 3100,
                "impact_zones": 4,
                "icon": "Construction",
            },
        ],
        "weekly_trend": [
            {"day": "Mon", "efficiency": 84},
            {"day": "Tue", "efficiency": 79},
            {"day": "Wed", "efficiency": 82},
            {"day": "Thu", "efficiency": 88},
            {"day": "Fri", "efficiency": 85},
            {"day": "Sat", "efficiency": 76},
            {"day": "Sun", "efficiency": 71},
        ],
    }


# ── Alerts ────────────────────────────────────────────────────────────────────

@app.get("/api/alerts")
def get_alerts():
    alerts = []
    now = datetime.now()

    try:
        complaints_df = _load("complaints_data.csv")
        if complaints_df is not None and not complaints_df.empty:
            # Pending complaints as high-severity alerts (latest 3)
            pending = complaints_df[
                complaints_df["status"].str.lower() == "pending"
            ].tail(4)
            severity_cycle = ["critical", "high", "high", "medium"]
            for i, (_, row) in enumerate(pending.iterrows()):
                area = str(row.get("area", "Unknown"))
                category = str(row.get("category", "Issue"))
                date_str = str(row.get("date", ""))
                alerts.append({
                    "id": f"ALT-C{str(row.get('id', i))}",
                    "severity": severity_cycle[i % len(severity_cycle)],
                    "description": f"{category} complaint pending in {area}",
                    "ward": area,
                    "category": "Complaints",
                    "time_ago": "Recently" if not date_str else date_str,
                    "timestamp": now.isoformat(),
                })
    except Exception:
        pass

    try:
        lakes_df = _load("lake_levels.csv")
        if lakes_df is not None and not lakes_df.empty:
            fs = lakes_df[lakes_df["lake_name"] == "Fateh Sagar"].sort_values("date").iloc[-1]
            level_ft = float(fs["level_ft"])
            level_m = round(level_ft * 0.3048, 1)
            if level_ft < 13.0:
                sev = "critical" if level_ft < 10 else "medium"
                alerts.append({
                    "id": "ALT-W001",
                    "severity": sev,
                    "description": f"Fateh Sagar at {level_m}m — monitor closely through summer",
                    "ward": "Fateh Sagar",
                    "category": "Water",
                    "time_ago": "Live",
                    "timestamp": now.isoformat(),
                })
    except Exception:
        pass

    try:
        events_df = _load("events_data.csv")
        if events_df is not None and not events_df.empty:
            events_df["date"] = pd.to_datetime(events_df["date"], errors="coerce")
            upcoming = events_df[events_df["date"] >= pd.Timestamp(now)].sort_values("date")
            if not upcoming.empty:
                evt = upcoming.iloc[0]
                days_away = (evt["date"] - pd.Timestamp(now)).days
                sev = "critical" if days_away <= 5 else "high" if days_away <= 14 else "medium"
                alerts.append({
                    "id": "ALT-E001",
                    "severity": sev,
                    "description": f"{evt['event_name']} in {days_away}d — deployment plan required",
                    "ward": str(evt.get("area", "Udaipur")),
                    "category": "Events",
                    "time_ago": f"{days_away}d away",
                    "timestamp": now.isoformat(),
                })
    except Exception:
        pass

    # Always return at least the static fallback alerts so the feed is never empty
    if len(alerts) < 3:
        alerts += [
            {
                "id": "ALT-S001",
                "severity": "medium",
                "description": "Sanitation overtime exceeds budget by 18% this week",
                "ward": "City-wide",
                "category": "Staff",
                "time_ago": "3 hrs ago",
                "timestamp": (now - timedelta(hours=3)).isoformat(),
            },
            {
                "id": "ALT-S002",
                "severity": "low",
                "description": "Road repair crew delayed — Chetak Circle pothole backlog",
                "ward": "Chetak Circle",
                "category": "Roads",
                "time_ago": "4 hrs ago",
                "timestamp": (now - timedelta(hours=4)).isoformat(),
            },
        ]

    return alerts




@app.get("/api/briefing")
def get_briefing(mode: str = Query(default="summary")):
    complaints_df = _load("complaints_data.csv")
    lakes_df = _load("lake_levels.csv")

    pending = 127
    if complaints_df is not None:
        pending = int(len(complaints_df[complaints_df.get("status", pd.Series()).str.lower() == "pending"]))

    lake_level = "6.2m"
    if lakes_df is not None:
        fs = lakes_df[lakes_df["lake_name"] == "Fateh Sagar"]["level_ft"]
        if not fs.empty:
            lake_level = f"{round(float(fs.iloc[0]) * 0.3048, 1)}m"

    today = datetime.now().strftime("%d %b %Y")

    if mode == "critical":
        points = [
            "CRITICAL: Holi celebrations in 5 days — crowd estimate 1.2L, emergency response teams must be briefed by tomorrow 0900 hrs.",
            f"CRITICAL: {pending} complaints pending — Badi ward water supply failure affecting 3 tanker routes.",
            "HIGH: Gangaur Fair deployment plan incomplete — 72 officers and 10 trucks still unconfirmed.",
        ]
    elif mode == "full":
        points = [
            f"{pending} complaints pending across 10 wards — Hiran Magri leads with 34 open cases, 8 marked critical severity.",
            f"Fateh Sagar at {lake_level} — trending down 0.3m/week. Summer forecast projects critical threshold breach by June.",
            "Gangaur Fair in 12 days — deployment plan incomplete. 180 officers and 24 trucks required; only 60% resources confirmed.",
            "Staff efficiency at 82% city-wide — Sanitation at 74% with ₹28,600 overtime cost this week. 3 AI reallocation actions available.",
            "Holi celebrations in 5 days flagged CRITICAL — crowd estimate 1.2L, all emergency response teams must be briefed by tomorrow.",
            "Traffic: Surajpole and Chetak Circle showing elevated congestion patterns — recommend pre-positioning 4 traffic officers.",
            "Water tanker gap: 28 deployed vs 35 recommended — Badi and Hiran Magri most affected zones.",
        ]
    else:  # summary
        points = [
            f"{pending} complaints pending across 10 wards — Hiran Magri leads with 34 open cases, 8 marked critical severity requiring same-day resolution.",
            f"Fateh Sagar at {lake_level} (59% capacity) — trending down 0.3m/week. Summer forecast projects critical threshold breach by June if monsoon delayed.",
            "Gangaur Fair in 12 days — deployment plan incomplete. 180 officers and 24 trucks required; only 60% resources confirmed as of this morning.",
            "Staff efficiency at 82% city-wide — Sanitation department at 74% with ₹28,600 overtime cost this week. AI recommends 3 reallocation actions.",
            "Holi celebrations in 5 days flagged CRITICAL — crowd estimate 1.2L, all emergency response teams must be briefed by tomorrow 0900 hrs.",
        ]

    return {
        "mode": mode,
        "title": f"Morning Briefing — Udaipur Municipal Corporation ({today})",
        "points": points,
        "generated_at": datetime.now().isoformat(),
    }


# ── Chat ───────────────────────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat(request: Request):
    content_type = request.headers.get("content-type", "")

    # ── Parse body (JSON or multipart) ───────────────────────────────────────
    message: str = ""
    file: Optional[UploadFile] = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        message = str(form.get("message", ""))
        file = form.get("file")  # type: ignore[assignment]
    else:
        # JSON body (default path for normal text messages)
        try:
            body = await request.json()
            message = str(body.get("message", ""))
        except Exception:
            return {"reply": "⚠️ Could not parse request body.", "tools_used": [], "thinking_steps": []}

    if not message:
        return {"reply": "⚠️ No message received.", "tools_used": [], "thinking_steps": []}

    if agent_executor is None:
        return {
            "reply": f"⚠️ AI agent unavailable: {_agent_import_error or 'import failed'}. "
                     "Check GOOGLE_API_KEY and dependencies.",
            "tools_used": [],
            "thinking_steps": [],
        }

    # ── Build file context ────────────────────────────────────────────────────
    file_context = ""
    if file and file.filename:
        try:
            content = await file.read()
            ct = file.content_type or ""
            if "csv" in ct or file.filename.endswith(".csv"):
                import io
                df = pd.read_csv(io.StringIO(content.decode("utf-8", errors="replace")))
                file_context = (
                    f"\n\nUser uploaded CSV '{file.filename}' "
                    f"({df.shape[0]} rows × {df.shape[1]} cols):\n"
                    f"{df.head(20).to_string()}"
                )
            elif "pdf" in ct or file.filename.endswith(".pdf"):
                file_context = (
                    f"\n\nUser uploaded PDF '{file.filename}'. "
                    "Analyse based on the filename and the user's question."
                )
            elif ct.startswith("image/"):
                file_context = (
                    f"\n\nUser uploaded image '{file.filename}'. "
                    "Describe what a municipal officer might want to know about it."
                )
        except Exception as fe:
            file_context = f"\n\n[File read error: {fe}]"

    now = datetime.now()
    full_message = (
        message
        + file_context
        + f"\n\n[Context: Date: {now.strftime('%Y-%m-%d')}, "
        f"Time: {now.strftime('%H:%M')}, Day: {now.strftime('%A')}]"
    )

    def _run_agent() -> dict:
        response = agent_executor.invoke(
            {"messages": [("user", full_message)]}
        )
        messages = response.get("messages", [])
        reply = _content_to_text(messages[-1].content) if messages else "No response."
        tools_used, thinking_steps = _extract_tool_calls(messages)
        return {"reply": reply, "tools_used": tools_used, "thinking_steps": thinking_steps}

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(_run_agent)
            try:
                return future.result(timeout=150)
            except concurrent.futures.TimeoutError:
                return {
                    "reply": "⏱️ Agent timed out (>2.5 min). Try a shorter question.",
                    "tools_used": [],
                    "thinking_steps": [],
                }
    except Exception as e:
        err = str(e)
        if "RESOURCE_EXHAUSTED" in err or "429" in err or "quota" in err.lower():
            return {
                "reply": "⚠️ Gemini API quota reached. Please wait a few minutes and retry.",
                "tools_used": [],
                "thinking_steps": [],
            }
        return {"reply": f"Engine error: {err[:300]}", "tools_used": [], "thinking_steps": []}
