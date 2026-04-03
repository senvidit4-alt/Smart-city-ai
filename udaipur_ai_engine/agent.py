import os
import joblib
import pandas as pd
import requests
from dotenv import load_dotenv, find_dotenv
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

# ==========================================
# 1. LOAD ENV & API KEYS
# ==========================================
load_dotenv(find_dotenv(), override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("Missing GROQ_API_KEY in .env!")

# ==========================================
# 2. BUILD GROQ MODEL (Qwen3-32B primary, Llama fallback)
# ==========================================

def _build_llm(tool_list):
    """Qwen3-32B on Groq — 14,400 RPD free tier, no daily quota issues."""
    primary = ChatGroq(
        model="qwen/qwen3-32b",
        api_key=GROQ_API_KEY,
        temperature=0,
        max_retries=3,
    ).bind_tools(tool_list)

    fallback = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=GROQ_API_KEY,
        temperature=0,
        max_retries=3,
    ).bind_tools(tool_list)

    return primary.with_fallbacks([fallback])

# ==========================================
# 3. LOAD UDAIPUR ML MODELS & DATA
# ==========================================
traffic_model = joblib.load("traffic_model.pkl")
waste_model = joblib.load("waste_model.pkl")
traffic_df = pd.read_csv("data/traffic_clean.csv")

# ==========================================
# 4. DEFINE UDAIPUR-SPECIFIC TOOLS
# ==========================================
from advanced_tools import (
    analyze_citizen_complaints,
    get_event_surge_plan,
    predict_water_supply_risk,
    generate_shift_plan,
    generate_daily_briefing,
)


@tool
def get_location_encodings() -> str:
    """Returns numerical encodings for Udaipur junctions, areas, weather, and days.
    ALWAYS call this before using traffic or waste prediction tools."""
    mappings = {
        "Junctions (for traffic)": {
            "Bapu Bazaar": 0, "Chetak Circle": 1, "Delhi Gate": 2, "Fatehsagar": 3,
            "Hathi Pol": 4, "Sector 4": 5, "Surajpole": 6, "Udiapole": 7,
        },
        "Areas (for waste)": {
            "Fatehpura": 0, "Hiran Magri": 1, "Madhuban": 2, "Panchwati": 3,
            "Sector 14": 4, "Shobhagpura": 5,
        },
        "Weather Encodings": {"Clear": 0, "Cloudy": 1, "Foggy": 2, "Rainy": 3},
        "Day Encodings": {"Fri": 0, "Mon": 1, "Sat": 2, "Sun": 3, "Thu": 4, "Tue": 5, "Wed": 6},
        "Density Encodings (waste)": {"Low": 1, "Medium": 2, "High": 3},
    }
    return f"Use these numerical values for the prediction tools:\n{mappings}"


@tool
def check_traffic_congestion(hour: int, day_enc: int, junction_enc: int, weather_enc: int) -> str:
    """Predicts traffic congestion for Udaipur junctions.
    Inputs MUST be numerical encodings — call get_location_encodings first."""
    avg_vehicles = traffic_df[traffic_df["junction_enc"] == junction_enc]["vehicles"].mean()
    if pd.isna(avg_vehicles):
        avg_vehicles = 200
    prediction = traffic_model.predict([[hour, day_enc, junction_enc, weather_enc, avg_vehicles]])[0]
    if prediction == 1:
        return "CRITICAL: High congestion predicted. Recommend deploying 2 extra traffic officers."
    return "STATUS NORMAL: Traffic is expected to flow smoothly."


@tool
def check_waste_overflow(area_enc: int, density_enc: int, days_since_last: int) -> str:
    """Predicts waste bin overflow risk for Udaipur areas.
    Inputs MUST be numerical — call get_location_encodings first."""
    prediction = waste_model.predict([[area_enc, density_enc, days_since_last, 50]])[0]
    if prediction == 1:
        return "ALERT: Overflow risk is high. Recommend routing a waste collection vehicle."
    return "STATUS NORMAL: Waste levels are under control."


@tool
def get_live_weather(city: str) -> str:
    """Fetches live weather for a city using OpenWeatherMap."""
    if not OPENWEATHER_API_KEY:
        return "Weather API key missing. Assume clear weather."
    try:
        url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
        )
        r = requests.get(url, timeout=8).json()
        if r.get("cod") != 200:
            return f"Could not find weather data for {city}."
        desc = r["weather"][0]["description"].title()
        temp = r["main"]["temp"]
        return f"Weather in {city}: {desc}, {temp}°C."
    except Exception as e:
        return f"Weather API unavailable: {e}"


# ==========================================
# 5. TOOL LIST & AGENT
# ==========================================
tools = [
    get_location_encodings,
    check_traffic_congestion,
    check_waste_overflow,
    get_live_weather,
    analyze_citizen_complaints,
    get_event_surge_plan,
    predict_water_supply_risk,
    generate_shift_plan,
    generate_daily_briefing,
]

# Cache the bound LLM so it's only built once
_llm_cache: list = []


def _get_llm(state, runtime):
    if not _llm_cache:
        _llm_cache.append(_build_llm(tools))
    return _llm_cache[0]


system_prompt = """You are the Udaipur Smart City Copilot — an AI assistant for Udaipur Municipal Corporation officials.
You provide real-time intelligence on traffic, waste, weather, events, water supply, and staff planning.

CAPABILITIES:
1. Traffic & Waste: Use check_traffic_congestion and check_waste_overflow. ALWAYS call get_location_encodings first.
2. Citizen Complaints: Use analyze_citizen_complaints for area-wise analysis.
3. Events: Use get_event_surge_plan for festival/event resource planning.
4. Water Supply: Use predict_water_supply_risk for shortage forecasting.
5. Daily Briefing: Use generate_daily_briefing for executive summaries.

EFFICIENCY RULES (strictly follow):
- For simple factual questions, answer directly WITHOUT calling any tools.
- For briefings or multi-domain queries, use at most 3 tools total.
- For urgent incidents, use at most 2 tools then give a short dispatch checklist.
- Never call get_location_encodings more than once per conversation turn.
- Combine related tool calls — don't make separate calls for data you can infer.

RESPONSE STYLE: Professional, concise, data-backed. Include ₹ cost estimates and personnel counts where relevant.
Format responses with clear headers and bullet points for readability."""

agent_executor = create_react_agent(_get_llm, tools, prompt=system_prompt)

# ==========================================
# 6. TERMINAL INTERFACE (for direct testing)
# ==========================================
if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("🤖 UDAIPUR SMART CITY COPILOT — Qwen3-32B on Groq")
    print("=" * 50)
    print("Type 'exit' to quit.\n")
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        print("\nCopilot thinking...")
        try:
            response = agent_executor.invoke({"messages": [("user", user_input)]})
            print(f"\n🤖 {response['messages'][-1].content}\n")
            print("-" * 50)
        except Exception as e:
            print(f"\n❌ Error: {e}\n")
