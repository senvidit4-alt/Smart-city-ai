import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

# Ensure we have a place to save the Udaipur data
os.makedirs('data', exist_ok=True)
np.random.seed(42)

udaipur_areas = ['Sector 14', 'Hiran Magri', 'Panchwati', 'Fatehpura', 'Shobhagpura', 'Madhuban']

# ==========================================
# 1. CITIZEN COMPLAINTS DATA
# ==========================================
n_complaints = 500
categories = ['Pothole', 'Garbage Overflow', 'Water Leakage', 'Stray Animal', 'Street Light']
status_options = ['Pending', 'Resolved', 'In Progress']

complaints_df = pd.DataFrame({
    'id': range(1001, 1001 + n_complaints),
    'category': np.random.choice(categories, n_complaints),
    'area': np.random.choice(udaipur_areas, n_complaints),
    'date': [(datetime.now() - timedelta(days=np.random.randint(0, 30))).strftime('%Y-%m-%d') for _ in range(n_complaints)],
    'status': np.random.choice(status_options, n_complaints, p=[0.4, 0.4, 0.2]),
    'lat': [24.5854 + np.random.uniform(-0.02, 0.02) for _ in range(n_complaints)],
    'lon': [73.7125 + np.random.uniform(-0.02, 0.02) for _ in range(n_complaints)]
})

# Make Hiran Magri have more Garbage complaints
hiran_magri_mask = complaints_df['area'] == 'Hiran Magri'
complaints_df.loc[hiran_magri_mask, 'category'] = np.random.choice(['Garbage Overflow', 'Pothole'], hiran_magri_mask.sum(), p=[0.7, 0.3])

complaints_df.to_csv('data/complaints_data.csv', index=False)
print(f"✅ Generated {len(complaints_df)} citizen complaints.")

# ==========================================
# 2. EVENT CALENDAR DATA
# ==========================================
events = [
    {'event_name': 'Mewar Festival', 'area': 'Gangaur Ghat', 'crowd': 50000, 'impact_traffic': 'High', 'impact_waste': 'High', 'date': '2026-04-10'},
    {'event_name': 'Royal Wedding - City Palace', 'area': 'Old City', 'crowd': 2000, 'impact_traffic': 'Medium', 'impact_waste': 'Low', 'date': '2026-04-15'},
    {'event_name': 'Holi Procession', 'area': 'Jagdish Chowk', 'crowd': 15000, 'impact_traffic': 'High', 'impact_waste': 'Medium', 'date': '2026-03-25'},
    {'event_name': 'Lake Carnival', 'area': 'Fatehsagar', 'crowd': 10000, 'impact_traffic': 'High', 'impact_waste': 'High', 'date': '2026-05-05'}
]
events_df = pd.DataFrame(events)
events_df.to_csv('data/events_data.csv', index=False)
print(f"✅ Registered {len(events_df)} major city events.")

# ==========================================
# 3. LAKE LEVELS (WATER SUPPLY DATA)
# ==========================================
dates = [(datetime.now() - timedelta(days=x)).strftime('%Y-%m-%d') for x in range(60)]
lake_data = []
for d in dates:
    lake_data.append({'date': d, 'lake_name': 'Fateh Sagar', 'level_ft': 12.5 + np.random.normal(0, 0.1)})
    lake_data.append({'date': d, 'lake_name': 'Pichola', 'level_ft': 10.8 + np.random.normal(0, 0.1)})

lakes_df = pd.DataFrame(lake_data)
lakes_df.to_csv('data/lake_levels.csv', index=False)
print(f"✅ Generated {len(lakes_df)} days of lake level history.")

# ==========================================
# 4. FIELD STAFF DATA
# ==========================================
staff_types = ['Traffic Controller', 'Waste Collector', 'Water Technician']
staff_data = []
for area in udaipur_areas:
    for s_type in staff_types:
        staff_data.append({
            'area': area,
            'staff_type': s_type,
            'count': np.random.randint(5, 15),
            'on_duty': np.random.randint(2, 5)
        })

staff_df = pd.DataFrame(staff_data)
staff_df.to_csv('data/staff_data.csv', index=False)
print(f"✅ Created duty rosters for {len(staff_df)} staff-area clusters.")
