import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

df = pd.read_csv('data/traffic_clean.csv')

X = df[['hour', 'day_enc', 'junction_enc', 'weather_enc', 'vehicles']]
y = df['high_congestion']

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

joblib.dump(model, 'traffic_model.pkl')
print("✅ Udaipur Traffic Model trained and saved as traffic_model.pkl")