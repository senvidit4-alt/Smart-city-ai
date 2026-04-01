import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

df = pd.read_csv('data/waste_clean.csv')

X = df[['area_enc', 'density_enc', 'last_collection_days', 'bin_fill_pct']]
y = df['overflow_risk']

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

joblib.dump(model, 'waste_model.pkl')
print("✅ Udaipur Waste Model trained and saved as waste_model.pkl")