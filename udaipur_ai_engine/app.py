import streamlit as st
from agent import agent_executor
from datetime import datetime
import folium
from streamlit_folium import st_folium

# ==========================================
# 1. PAGE CONFIG & CUSTOM CSS (THE CYBERPUNK THEME)
# ==========================================
st.set_page_config(page_title="Udaipur Smart City Copilot", page_icon="🤖", layout="wide")
st.markdown("""
<style>
    /* Main background gradient */
    .stApp { background: linear-gradient(135deg, #0A0E17 0%, #1A2235 100%); }
    
    /* Headers */
    h1, h2, h3 { color: #00f3ff !important; font-weight: 600 !important; letter-spacing: 1px; }

    /* Chat Input Box */
    .stChatInputContainer > div { 
        border-radius: 20px !important; 
        border: 1px solid #00f3ff !important; 
        background-color: #151A26 !important; 
        box-shadow: 0 0 10px rgba(0, 243, 255, 0.1) !important; 
    }

    /* Chat Bubbles */
    .stChatMessage { 
        border-radius: 15px !important; 
        padding: 15px !important; 
        margin-bottom: 10px !important; 
        background-color: rgba(21, 26, 38, 0.7) !important; 
        border-left: 3px solid #00f3ff !important; 
        backdrop-filter: blur(5px); 
    }
</style>
""", unsafe_allow_html=True)

# ==========================================
# 2. DYNAMIC MAP STATE LOGIC
# ==========================================
# Dictionary of key Udaipur locations and their coordinates
UDAIPUR_LOCATIONS = {
    "chetak circle": {"coords": [24.5826, 73.6934], "color": "blue"},
    "surajpole": {"coords": [24.5854, 73.7125], "color": "red"},
    "sector 14": {"coords": [24.5712, 73.7023], "color": "green"},
    "mullatalai": {"coords": [24.5937, 73.6748], "color": "orange"},
    "delhi gate": {"coords": [24.5880, 73.6948], "color": "purple"},
    "hiran magri": {"coords": [24.5710, 73.7170], "color": "darkgreen"},
    "sector 11": {"coords": [24.5750, 73.7180], "color": "lightgreen"},
    "bhupalpura": {"coords": [24.5910, 73.7010], "color": "cadetblue"},
    "madhuban": {"coords": [24.5940, 73.6960], "color": "darkblue"},
    "pratap nagar": {"coords": [24.5880, 73.7250], "color": "darkred"},
    "udaipur": {"coords": [24.5854, 73.7125], "color": "white"} # Default center
}

if "map_center" not in st.session_state:
    st.session_state.map_center = UDAIPUR_LOCATIONS["udaipur"]["coords"]
if "active_location" not in st.session_state:
    st.session_state.active_location = None
if "messages" not in st.session_state:
    st.session_state.messages = []

# Function to update the map based on text parsing
def parse_and_update_map(text):
    text_lower = text.lower()
    for loc_name, data in UDAIPUR_LOCATIONS.items():
        if loc_name in text_lower and loc_name != "udaipur":
            # Only update if the location actually changed to avoid infinite reruns
            if st.session_state.active_location != loc_name:
                st.session_state.map_center = data["coords"]
                st.session_state.active_location = loc_name
                return True
    return False

# ==========================================
# 3. STREAMLIT CHAT INTERFACE
# ==========================================
st.title("🤖 Udaipur Smart City Copilot")
st.caption("Central Command Center Dashboard")

# Create a 2-column layout for Chat and Map
col1, col2 = st.columns([1, 1])

with col2:
    st.markdown("### 🗺️ Live City Map")
    # Generate the map centered entirely dynamically on the active location
    m = folium.Map(location=st.session_state.map_center, zoom_start=15 if st.session_state.active_location else 13, tiles="CartoDB dark_matter")
    
    # Always draw Chetak, Surajpole, Sector 14 as baseline markers
    folium.Marker(UDAIPUR_LOCATIONS["chetak circle"]["coords"], popup="Chetak Circle", icon=folium.Icon(color="blue", icon="info-sign")).add_to(m)
    folium.Marker(UDAIPUR_LOCATIONS["surajpole"]["coords"], popup="Surajpole", icon=folium.Icon(color="red", icon="warning-sign")).add_to(m)
    folium.Marker(UDAIPUR_LOCATIONS["sector 14"]["coords"], popup="Sector 14", icon=folium.Icon(color="green", icon="info-sign")).add_to(m)
    
    # If a custom location was detected (e.g., Mullatalai), add a special highlighted marker
    active = st.session_state.active_location
    if active and active not in ["chetak circle", "surajpole", "sector 14", "udaipur"]:
        folium.Marker(UDAIPUR_LOCATIONS[active]["coords"], popup=active.title(), icon=folium.Icon(color=UDAIPUR_LOCATIONS[active]["color"], icon="star")).add_to(m)
        
    st_folium(m, width=700, height=600, returned_objects=[])

with col1:
    # Display chat messages from history on app rerun
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # React to user input
    if prompt := st.chat_input("Ask about Udaipur traffic, waste, or weather..."):
        # Display user message in chat message container
        st.chat_message("user").markdown(prompt)
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": prompt})

        # Pre-scan the prompt for a location
        map_needs_update = parse_and_update_map(prompt)

        # Response from Agent
        with st.chat_message("assistant"):
            with st.spinner("Copilot is analyzing city data..."):
                try:
                    now = datetime.now()
                    context = f"\n\n[System note: The current date and time is {now.strftime('%Y-%m-%d %H:%M')}. The current day of the week is {now.strftime('%A')}. The current hour is {now.hour}. Use this information if the user asks for current conditions without specifying a time.]"
                    
                    response = agent_executor.invoke({"messages": [("user", prompt + context)]})
                    bot_response = response['messages'][-1].content
                    
                    st.markdown(bot_response)
                    st.session_state.messages.append({"role": "assistant", "content": bot_response})
                    
                    # Post-scan the bot's response just in case the bot inferred a location
                    if not map_needs_update:
                        map_needs_update = parse_and_update_map(bot_response)
                    
                    # Trigger a page refresh to dynamically pan the map to the new coordinate
                    if map_needs_update:
                        st.rerun()
                        
                except Exception as e:
                    st.error(f"System Error: {e}")