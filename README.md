# 🤖 SmartCity Agent (Udaipur Smart City Copilot)

A smart city management system using AI agents for traffic, waste, and emergency management in Udaipur. 

Powered by **Google Gemini 1.5 Pro**, **LangGraph**, and predictive Machine Learning models, this Copilot acts as an autonomous dispatcher that processes natural language requests and visualizes data on a live, dynamic city map.

---

## ✨ Key Features

* 🗺️ **Interactive Map Generation:** Built with Folium. The map automatically reads the context of the chat and dynamically pans to highlight specific Udaipur landmarks as they are mentioned.
* 🚗 **Traffic Prediction & Management:** Uses a trained Machine Learning model and historical data to predict rush hour congestion at specific junctions and recommend officer deployments.
* 🗑️ **Waste Collection Optimization:** Analyzes area population density and collection schedules using ML to flag high-risk bins and route collection trucks proactively.
* 🚨 **Emergency Response Coordination:** Instantly recognizes crisis keywords (e.g., "fire", "accident") and bypasses standard protocols to simulate emergency unit deployment.
* 🌤️ **Real-Time Weather Integration:** Integrated with the **OpenWeather API** to fetch live, 100% accurate weather conditions and temperatures for any location.

---

## 🧠 How It Works (The Architecture)

The system is built on a modern **Agentic AI Architecture**:
1. **The Interface (`app.py`):** A Streamlit frontend captures the user's natural language request and injects the current real-world date and time into the background context.
2. **The Brain (`agent.py`):** The request is processed by `gemini-1.5-pro`, chosen for its flawless tool-calling capabilities. 
3. **The LangGraph Router:** The agent uses a React logic loop to determine which specific municipal tools to trigger.
4. **Tool Execution:** The AI runs the appropriate Python functions—querying the ML `.pkl` models, searching local databases, or pinging the external OpenWeather API.

---

## ⚙️ Setup & Installation

**1. Clone the repository:**
```bash
git clone [https://github.com/senvidit4-alt/SmartCity-Agent.git](https://github.com/senvidit4-alt/SmartCity-Agent.git)
cd SmartCity-Agent

NOTE*- use the SmartCity_Agent HackManthan2.ipynb for testing in Jupiter Notebook

----

2. Install dependencies:

Bash
pip install -r udaipur_ai_engine/requirements.txt

----

3. Environment Variables:
Create a .env file in the root directory with your API keys:

Code snippet
GROQ_API_KEY=your_groq_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key

----


4. Run the application:

Bash
streamlit run udaipur_ai_engine/app.py

