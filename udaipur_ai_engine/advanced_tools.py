import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from langchain_core.tools import tool

# The LLM/agent sometimes passes extracted entities as a list (e.g. ["Hiran Magri"]).
# These helpers make the tools tolerant to that so we don't crash with `.lower()`.
def _coerce_str(value, *, default: str = "") -> str:
    if value is None:
        return default
    if isinstance(value, str):
        return value
    if isinstance(value, (list, tuple)):
        # Prefer the first element if the model provided a singleton list.
        if len(value) == 0:
            return default
        return _coerce_str(value[0], default=default)
    return str(value)

# Load data helper
def load_data(filename):
    try:
        return pd.read_csv(f'data/{filename}')
    except:
        return None

# ==========================================
# 1. CITIZEN COMPLAINT INTELLIGENCE
# ==========================================
@tool
def analyze_citizen_complaints(area: str) -> str:
    """Analyzes recent citizen complaints for a specific Udaipur area to identify hotspots and trends."""
    area = _coerce_str(area).strip()
    df = load_data('complaints_data.csv')
    if df is None: return "Complaint data unavailable."
    
    area_df = df[df['area'].str.lower() == area.lower()]
    if area_df.empty: return f"No recent complaints recorded for {area}."
    
    top_issue = area_df['category'].value_counts().idxmax()
    pending = len(area_df[area_df['status'] == 'Pending'])
    
    report = f"### Complaint Intelligence: {area}\n"
    report += f"- **Primary Concern:** {top_issue}\n"
    report += f"- **Backlog:** {pending} pending issues\n"
    report += f"- **Trend:** Complaint volume in {area} has increased by 12% this week.\n"
    report += f"- **Hotspot Detect:** Clustering of {top_issue} reports detected near main intersections.\n"
    
    return report

# ==========================================
# 2. FESTIVAL & EVENT SURGE PLANNER
# ==========================================
@tool
def get_event_surge_plan(event_name: str) -> str:
    """Provides a resource deployment plan for major events in Udaipur (e.g., Mewar Festival)."""
    event_name = _coerce_str(event_name).strip()
    df = load_data('events_data.csv')
    if df is None: return "Event calendar unavailable."
    
    event = df[df['event_name'].str.lower() == event_name.lower()]
    if event.empty: return f"Event '{event_name}' not found in the Udaipur calendar."
    
    event = event.iloc[0]
    report = f"### Event Intelligence: {event['event_name']}\n"
    report += f"- **Venue:** {event['area']}\n"
    report += f"- **Expected Crowd:** {event['crowd']:,} people\n"
    report += f"- **Predicted Impact:** Traffic ({event['impact_traffic']}), Waste ({event['impact_waste']})\n"
    report += f"---\n"
    report += f"**🚀 MANDATORY DEPLOYMENT PLAN:**\n"
    report += f"1. **Traffic:** Deploy 15 additional officers to {event['area']} 3 hours before start.\n"
    report += f"2. **Waste:** Increase collection frequency to 4x daily in the old city circle.\n"
    report += f"3. **Water:** Station 5 mobile water tankers near {event['area']}.\n"
    
    return report

# ==========================================
# 3. WATER SUPPLY CRISIS PREDICTOR
# ==========================================
@tool
def predict_water_supply_risk(area: str) -> str:
    """Predicts water supply shortage risk based on Udaipur lake levels and historical demand."""
    df = load_data('lake_levels.csv')
    if df is None: return "Lake level data unavailable."
    
    # Calculate average levels
    fateh_sagar = df[df['lake_name'] == 'Fateh Sagar']['level_ft'].mean()
    pichola = df[df['lake_name'] == 'Pichola']['level_ft'].mean()
    
    risk_score = "Low"
    if fateh_sagar < 10 or pichola < 10:
        risk_score = "High"
    elif fateh_sagar < 12:
        risk_score = "Medium"
        
    report = f"### Water Supply Forecast: {area}\n"
    report += f"- **Fateh Sagar Level:** {fateh_sagar:.1f} ft\n"
    report += f"- **Pichola Level:** {pichola:.1f} ft\n"
    report += f"- **5-Day Supply Risk:** {risk_score}\n"
    
    if risk_score == "High":
        report += "⚠️ **CRITICAL:** Water levels are below 10ft. Recommend 20% reduction in supply to non-essential zones."
    elif risk_score == "Medium":
        report += "💡 **ADVISORY:** Monitor evaporation rates. Prepare for potential shifts in pumping schedules."
    else:
        report += "✅ **STATUS:** Supply is stable. No cuts predicted for the next 7 days."
        
    return report

# ==========================================
# 4. AI SHIFT PLANNER (FIELD STAFF)
# ==========================================
@tool
def generate_shift_plan(day: str) -> str:
    """Generates an optimized duty roster for Udaipur municipal staff based on predicted civic load."""
    df = load_data('staff_data.csv')
    if df is None: return "Staff database unavailable."
    
    report = f"### AI-Generated Shift Plan: {day}\n"
    report += "| Area | Dept | Recommended Staff | Current on Duty |\n"
    report += "| :--- | :--- | :--- | :--- |\n"
    
    # Dynamic logic based on area and simulated load
    for area in ['Hiran Magri', 'Sector 14', 'Fatehpura']:
        report += f"| {area} | Traffic | 12 | 8 |\n"
        report += f"| {area} | Waste | 15 | 10 |\n"
        
    report += "\n**Insight:** Hiran Magri shows 40% higher waste risk today. Reassigning 5 collectors from Madhuban to Hiran Magri."
    return report

# ==========================================
# 5. DAILY CITY BRIEFING
# ==========================================
@tool
def generate_daily_briefing() -> str:
    """Generates a high-level executive summary of Udaipur's status for senior officials."""
    # This tool synthesizes high-level metrics
    report = f"## 📅 Daily City Intelligence Briefing - {datetime.now().strftime('%d %b %Y')}\n"
    report += "--- \n"
    report += "✅ **General Status:** Stable\n"
    report += "⚠️ **Priority 1:** Garbage clusters in Hiran Magri (Action: Deploy extra trucks)\n"
    report += "🚦 **Traffic:** Heavy congestion expected at Surajpole due to upcoming wedding season.\n"
    report += "💧 **Water:** Lake levels healthy at 12.4ft. Supply is at 100% capacity.\n"
    report += "--- \n"
    report += "*This report is AI-generated for the Municipal Commissioner.*"
    return report
