# SmartCity Agent

A smart city management system using AI agents for traffic, waste, and emergency management in Udaipur.

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/senvidit4-alt/SmartCity-Agent.git
   cd SmartCity-Agent
   ```

2. Install dependencies:
   ```
   pip install -r udaipur_ai_engine/requirements.txt
   ```

3. Create a `.env` file in the root directory with your API keys:
   ```
   GROQ_API_KEY=your_groq_api_key
   OPENWEATHER_API_KEY=your_openweather_api_key
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_API_KEY=your_google_api_key
   ```

4. Run the application:
   ```
   python udaipur_ai_engine/app.py
   ```

## Features

- Traffic prediction and management
- Waste collection optimization
- Emergency response coordination
- Interactive map generation

## Note

Ensure your `.env` file is not committed to version control. It is already added to `.gitignore`.