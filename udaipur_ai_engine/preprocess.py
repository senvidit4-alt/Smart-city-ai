import pandas as pd
from sklearn.preprocessing import LabelEncoder
import os

le = LabelEncoder()

# --- TRAFFIC DATA CLEANING ---
if os.path.exists('data/traffic_data.csv'):
    df = pd.read_csv('data/traffic_data.csv')
    df['junction_enc'] = le.fit_transform(df['junction'])
    df['weather_enc'] = le.fit_transform(df['weather'])
    df['day_enc'] = le.fit_transform(df['day_of_week'])
    df.to_csv('data/traffic_clean.csv', index=False)
    print("✅ Traffic data cleaned and encoded for Udaipur.")

# --- WASTE DATA CLEANING ---
if os.path.exists('data/waste_data.csv'):
    df2 = pd.read_csv('data/waste_data.csv')
    density_map = {'Low': 1, 'Medium': 2, 'High': 3}
    df2['density_enc'] = df2['population_density'].map(density_map)
    df2['area_enc'] = le.fit_transform(df2['area'])
    df2.to_csv('data/waste_clean.csv', index=False)
    print("✅ Waste data cleaned and encoded for Udaipur.")