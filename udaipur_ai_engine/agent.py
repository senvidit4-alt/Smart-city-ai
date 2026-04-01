import os
import joblib
import pandas as pd
import requests
from dotenv import load_dotenv, find_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

# ==========================================
# 1. SET SECURE API KEYS FROM VAULT
# ==========================================
load_dotenv(find_dotenv(), override=True)
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY", "AIzaSyCXnAPmGeDfwlxzgfUJAAZ5CPwAKhR6fdw")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

# ==========================================
# 2. LOAD UDAIPUR MODELS & DATA
# ==========================================
traffic_model = joblib.load('traffic_model.pkl')
waste_model = joblib.load('waste_model.pkl')
traffic_df = pd.read_csv('data/traffic_clean.csv')
waste_df = pd.read_csv('data/waste_clean.csv')

# ==========================================
# 3. DEFINE UDAIPUR-SPECIFIC TOOLS
# ==========================================
@tool
def check_traffic_congestion(hour: int, day_enc: int, junction_enc: int, weather_enc: int) -> str:
    """Predicts traffic for Udaipur junctions. Inputs MUST be numerical encodings."""
    avg_vehicles = traffic_df[traffic_df['junction_enc'] == junction_enc]['vehicles'].mean()
    prediction = traffic_model.predict([[hour, day_enc, junction_enc, weather_enc, avg_vehicles]])[0]
    
    if prediction == 1:
        return "CRITICAL: High congestion predicted. Recommend deploying 2 extra traffic officers."
    return "STATUS NORMAL: Traffic is expected to flow smoothly."

@tool
def check_waste_overflow(area_enc: int, density_enc: int, days_since_last: int) -> str:
    """Predicts waste bin overflow for Udaipur areas. Inputs MUST be numerical."""
    prediction = waste_model.predict([[area_enc, density_enc, days_since_last, 50]])[0]
    
    if prediction == 1:
        return "ALERT: Overflow risk is high. Recommend routing a waste collection vehicle."
    return "STATUS NORMAL: Waste levels are under control."

@tool
def get_live_weather(city: str) -> str:
    """Fetches the actual live weather conditions and temperature for a specific city using OpenWeatherMap."""
    if not OPENWEATHER_API_KEY:
        return "System Warning: Weather API Key is missing from .env vault. Assume normal clear weather."
        
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(url).json()
        
        if response.get("cod") != 200:
            return f"Could not find weather data for {city}."
            
        desc = response['weather'][0]['description'].title()
        temp = response['main']['temp']
        
        return f"The real-time weather in {city} is {desc} with a temperature of {temp}°C."
    except Exception as e:
        return f"Weather API currently unavailable: {str(e)}"

# ==========================================
# 4. INITIALIZE AGENT WITH LOCAL CONTEXT
# ==========================================
# 🚨 Swapping to Gemini 1.5 Flash for flawless tool routing and no hackathon rate limits!
# 🚨 THE FIX: Appending '-latest' forces the API to find the model, 
# OR you can use 'gemini-pro' as an ultra-stable hackathon fallback!
llm = ChatGoogleGenerativeAI(temperature=0, model="gemini-2.0-flash", max_retries=2)
tools = [check_traffic_congestion, check_waste_overflow, get_live_weather]

system_prompt = """You are the Udaipur Smart City Copilot. 
You are an expert on local areas like Chetak Circle, Surajpole, and Sector 14.
When asked about a location, always look up its numerical encoding first if needed, then use your tools to provide data-backed recommendations for city officials.
NEVER guess the weather. If the weather tool fails, say 'Weather data unavailable' instead of making up a temperature."""

agent_executor = create_react_agent(llm, tools, prompt=system_prompt)

# ==========================================
# 5. TERMINAL CHAT INTERFACE FOR TESTING
# ==========================================
if __name__ == "__main__":
    print("\n" + "="*50)
    print("🤖 UDAIPUR SMART CITY COPILOT INITIALIZED")
    print("="*50)
    print("Type 'exit' or 'quit' to close the chat.\n")
    
    while True:
        user_input = input("You: ")
        if user_input.lower() in ['exit', 'quit']:
            print("Shutting down Copilot...")
            break
            
        print("\nCopilot is thinking...")
        try:
            response = agent_executor.invoke({"messages": [("user", user_input)]})
            print(f"\n🤖 AI: {response['messages'][-1].content}\n")
            print("-" * 50)
        except Exception as e:
            print(f"\n❌ Error: {e}\n")