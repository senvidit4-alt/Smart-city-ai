# 🤖 SmartCity Agent (Udaipur Smart City Copilot)

A smart city management system using AI agents for traffic, waste, and emergency management in Udaipur. 

## How It Works

This project combines machine learning, AI agents, and real-time data to create an intelligent city management dashboard. Here's the architecture:

### Core Components

1. **AI Agent (LangGraph + Gemini)**
   - Uses Google's Gemini 2.0 Flash model for intelligent decision-making
   - Implements a ReAct agent pattern for tool-calling and reasoning
   - Specialized for Udaipur's local geography and challenges

2. **Machine Learning Models**
   - **Traffic Prediction**: Random Forest model trained on historical traffic data to predict congestion at key junctions (Chetak Circle, Surajpole, Sector 14, etc.)
   - **Waste Management**: ML model that predicts bin overflow risk based on area density and collection schedules
   - Models are trained on cleaned Udaipur-specific datasets

3. **Real-Time Data Integration**
   - **Weather API**: Fetches live weather conditions from OpenWeatherMap
   - **Dynamic Mapping**: Interactive Folium maps that update based on conversation context
   - **Location Intelligence**: Recognizes Udaipur landmarks and pans the map accordingly

4. **Streamlit Dashboard**
   - Cyberpunk-themed UI with dark gradient background
   - Real-time chat interface for city officials
   - Live map visualization with location markers
   - Session state management for persistent conversations

### Workflow

1. **User Query**: City officials ask questions like "What's the traffic situation at Chetak Circle?" or "Check waste levels in Sector 14"
2. **Context Analysis**: System parses location mentions and updates the map view
3. **AI Reasoning**: Agent uses tools to gather data (traffic prediction, waste overflow risk, weather conditions)
4. **Response Generation**: Provides actionable recommendations with data-backed insights
5. **Map Update**: Dashboard dynamically centers on mentioned locations

### Data Sources

- Historical traffic data with time, day, junction, and weather encodings
- Waste collection data with area density and overflow predictions
- Live weather data from OpenWeatherMap API
- Udaipur location coordinates for mapping

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/senvidit4-alt/Smart-city-ai.git
   cd Smart-city-ai
   ```

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

- Traffic prediction and management
- Waste collection optimization
- Emergency response coordination
- Interactive map generation
- Real-time weather integration
- Location-aware conversations

## Note

Ensure your `.env` file is not committed to version control. It is already added to `.gitignore`.