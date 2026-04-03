import os
import concurrent.futures

import streamlit as st
import pandas as pd
from agent import agent_executor
from datetime import datetime
import folium
from streamlit_folium import st_folium


def _agent_invoke_timeout_sec() -> int:
    """Full agent run budget (each tool round-trip hits Gemini again)."""
    try:
        return max(45, int(os.getenv("AGENT_INVOKE_TIMEOUT_SEC", "240")))
    except ValueError:
        return 240

# ==========================================
# 1. PAGE CONFIG & PREMIUM CYBERPUNK THEME
# ==========================================
st.set_page_config(page_title="Udaipur Smart City Copilot v2", page_icon="🏙️", layout="wide")

st.markdown("""
<style>
    /* Main background gradient */
    .stApp { background: linear-gradient(135deg, #05070A 0%, #0F172A 100%); color: #E2E8F0; }
    
    /* Neon Headers */
    h1, h2, h3 { color: #22D3EE !important; font-family: 'Inter', sans-serif; text-shadow: 0 0 10px rgba(34, 211, 238, 0.3); }

    /* Custom Sidebar */
    [data-testid="stSidebar"] { background-color: #0F172A !important; border-right: 1px solid #1E293B; }
    
    /* KPI Cards */
    .kpi-card {
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 15px;
        text-align: center;
        transition: transform 0.3s ease;
    }
    .kpi-card:hover { transform: translateY(-5px); border-color: #22D3EE; }
    .kpi-value { font-size: 24px; font-weight: bold; color: #22D3EE; }
    .kpi-label { font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }

    /* Chat Styling */
    .stChatInputContainer > div { border-radius: 12px !important; border: 1px solid #334155 !important; background-color: #1E293B !important; }
    .stChatMessage { border-radius: 15px !important; border-left: 4px solid #22D3EE !important; background: rgba(30, 41, 59, 0.5) !important; backdrop-filter: blur(8px); }
</style>
""", unsafe_allow_html=True)

# ==========================================
# 2. DATA LOADING & STATE
# ==========================================
def load_data(file):
    try:
        return pd.read_csv(f'data/{file}')
    except:
        return None

complaints_df = load_data('complaints_data.csv')
lakes_df = load_data('lake_levels.csv')

UDAIPUR_LOCATIONS = {
    "chetak circle": {"coords": [24.5826, 73.6934], "color": "blue"},
    "surajpole": {"coords": [24.5854, 73.7125], "color": "red"},
    "sector 14": {"coords": [24.5712, 73.7023], "color": "green"},
    "delhi gate": {"coords": [24.5880, 73.6948], "color": "purple"},
    "hiran magri": {"coords": [24.5710, 73.7170], "color": "darkgreen"},
    "fatehsagar": {"coords": [24.5937, 73.6748], "color": "orange"},
    "udaipur": {"coords": [24.5854, 73.7125], "color": "white"}
}

if "map_center" not in st.session_state:
    st.session_state.map_center = UDAIPUR_LOCATIONS["udaipur"]["coords"]
if "active_location" not in st.session_state:
    st.session_state.active_location = None
if "messages" not in st.session_state:
    st.session_state.messages = []

def _content_to_text(content) -> str:
    """Normalize LangChain/Gemini message content into plain text for UI + map parsing."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    # Gemini responses may come back as a list of "parts", e.g. [{"type":"text","text":"..."}]
    if isinstance(content, (list, tuple)):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict):
                if isinstance(part.get("text"), str):
                    parts.append(part["text"])
        if parts:
            return "\n".join(parts)
        return str(content)
    if isinstance(content, dict):
        if isinstance(content.get("text"), str):
            return content["text"]
        return str(content)
    return str(content)

def parse_and_update_map(text):
    text_lower = _content_to_text(text).lower()
    for loc_name, data in UDAIPUR_LOCATIONS.items():
        if loc_name in text_lower and loc_name != "udaipur":
            if st.session_state.active_location != loc_name:
                st.session_state.map_center = data["coords"]
                st.session_state.active_location = loc_name
                return True
    return False

# ==========================================
# 3. SIDEBAR: KPIS & QUICK ACTIONS
# ==========================================
with st.sidebar:
    st.image("https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Udaipur_Municipal_Corporation_Logo.png/200px-Udaipur_Municipal_Corporation_Logo.png", width=80)
    st.title("Admin Panel")
    st.markdown("---")
    
    # Real-time KPIs
    kpi1, kpi2 = st.columns(2)
    with kpi1:
        val = len(complaints_df[complaints_df['status'] == 'Pending']) if complaints_df is not None else "N/A"
        st.markdown(f'<div class="kpi-card"><div class="kpi-value">{val}</div><div class="kpi-label">Pending Issues</div></div>', unsafe_allow_html=True)
    with kpi2:
        val = f"{lakes_df[lakes_df['lake_name'] == 'Fateh Sagar']['level_ft'].iloc[0]:.1f}ft" if lakes_df is not None else "N/A"
        st.markdown(f'<div class="kpi-card"><div class="kpi-value">{val}</div><div class="kpi-label">Lake Level</div></div>', unsafe_allow_html=True)
    
    st.markdown("### ⚡ Quick Insights")
    if st.button("Generate Daily Briefing"):
        st.session_state.messages.append({"role": "user", "content": "Generate a daily briefing for the city."})
    if st.button("Check Water Crisis Risk"):
        st.session_state.messages.append({"role": "user", "content": "What is the water supply risk for Sector 14?"})
    if st.button("View Festival Surge Plan"):
        st.session_state.messages.append({"role": "user", "content": "Show me the deployment plan for Mewar Festival."})
    
    st.markdown("---")
    st.caption("Udaipur Smart City Intelligence Platform v2.0")

# ==========================================
# 4. MAIN DASHBOARD: CHAT & MAP
# ==========================================
st.markdown("# 🏙️ Udaipur Smart City Copilot")

col1, col2 = st.columns([1, 1.2])

with col2:
    st.markdown("### 🗺️ Geospatial Intelligence Map")
    m = folium.Map(location=st.session_state.map_center, zoom_start=14, tiles="CartoDB dark_matter")
    
    # Static Markers
    for loc, data in UDAIPUR_LOCATIONS.items():
        if loc != "udaipur":
            folium.Marker(data["coords"], popup=loc.title(), icon=folium.Icon(color=data["color"], icon="info-sign")).add_to(m)
    
    # Complaint Hotspots
    if complaints_df is not None:
        for idx, row in complaints_df.sample(20).iterrows(): # Show a sample for clarity
            color = 'red' if row['status'] == 'Pending' else 'green'
            folium.CircleMarker(
                location=[row['lat'], row['lon']],
                radius=5,
                popup=f"{row['category']} - {row['status']}",
                color=color,
                fill=True,
                fill_color=color
            ).add_to(m)
            
    st_folium(m, width=800, height=600, returned_objects=[])

with col1:
    chat_container = st.container(height=520)
    with chat_container:
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])

    if prompt := st.chat_input("Command the city's intelligence..."):
        st.chat_message("user").markdown(prompt)
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        map_needs_update = parse_and_update_map(prompt)

        with st.chat_message("assistant"):
            with st.spinner("Analyzing multi-domain data..."):
                try:
                    now = datetime.now()
                    context = f"\n\n[Context: Date: {now.strftime('%Y-%m-%d')}, Time: {now.strftime('%H:%M')}, Day: {now.strftime('%A')}]"
                    st.caption(
                        "Typical wait **30s–3min** (each tool ⇒ extra Gemini call). "
                        f"Max **{_agent_invoke_timeout_sec()}s** — adjust `AGENT_INVOKE_TIMEOUT_SEC` in `.env`."
                    )
                    payload = {"messages": [("user", prompt + context)]}
                    _timeout = _agent_invoke_timeout_sec()
                    response = None
                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                        fut = pool.submit(agent_executor.invoke, payload)
                        try:
                            response = fut.result(timeout=_timeout)
                        except concurrent.futures.TimeoutError:
                            st.error(
                                f"Timed out after {_timeout}s while waiting for the agent (API slowness or many tool steps). "
                                "Try a shorter question, or raise `AGENT_INVOKE_TIMEOUT_SEC` / reduce tools in the prompt."
                            )
                    if response is not None:
                        bot_response = _content_to_text(response['messages'][-1].content)
                        st.markdown(bot_response)
                        st.session_state.messages.append({"role": "assistant", "content": bot_response})
                        if not map_needs_update:
                            map_needs_update = parse_and_update_map(bot_response)
                        if map_needs_update:
                            st.rerun()
                except Exception as e:
                    err = str(e)
                    if "RESOURCE_EXHAUSTED" in err or "429" in err or (
                        "quota" in err.lower()
                    ):
                        st.error(
                            "Gemini quota or rate limit hit (often **20 requests/day per model** on the "
                            "free tier for some flash models). This app now **falls back across several model "
                            "IDs**; if every model is exhausted, enable **billing** in Google AI Studio, wait for "
                            "the daily reset, or set `GOOGLE_GEMINI_MODELS` in `.env` to other models. "
                            f"Details: {err[:500]}"
                        )
                    else:
                        st.error(f"Engine Error: {e}")