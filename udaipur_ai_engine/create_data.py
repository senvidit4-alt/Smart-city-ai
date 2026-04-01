import pandas as pd
import numpy as np
import os

# Ensure we have a place to save the Udaipur data
os.makedirs('data', exist_ok=True)
np.random.seed(42)

# ==========================================
# 1. UDAIPUR TRAFFIC DATA GENERATION
# ==========================================
n_traffic = 2000
udaipur_junctions = ['Chetak Circle', 'Surajpole', 'Delhi Gate', 'Udiapole', 
                     'Fatehsagar', 'Bapu Bazaar', 'Sector 4', 'Hathi Pol']

traffic_df = pd.DataFrame({
    'junction': np.random.choice(udaipur_junctions, n_traffic),
    'hour': np.random.randint(0, 24, n_traffic),
    'day_of_week': np.random.choice(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], n_traffic),
    'weather': np.random.choice(['Clear','Foggy','Rainy','Cloudy'], n_traffic),
    'vehicles': np.random.randint(50, 300, n_traffic)
})

# Add Udaipur-specific patterns (Rush hour at Chetak Circle and Surajpole)
is_rush = traffic_df['hour'].isin([8, 9, 10, 17, 18, 19])
traffic_df.loc[is_rush, 'vehicles'] += np.random.randint(150, 400, is_rush.sum())

# Calculate Congestion Score (0-10) and High Congestion Flag
traffic_df['congestion_score'] = (traffic_df['vehicles'] / traffic_df['vehicles'].max() * 10).round(1)
traffic_df['high_congestion'] = (traffic_df['congestion_score'] > 7).astype(int)

traffic_df.to_csv('data/traffic_data.csv', index=False)
print(f"✅ Generated {len(traffic_df)} rows of Udaipur traffic data.")

# ==========================================
# 2. UDAIPUR WASTE DATA GENERATION
# ==========================================
n_waste = 500
udaipur_areas = ['Sector 14', 'Hiran Magri', 'Panchwati', 'Fatehpura', 'Shobhagpura', 'Madhuban']

waste_df = pd.DataFrame({
    'area': np.random.choice(udaipur_areas, n_waste),
    'population_density': np.random.choice(['High', 'Medium', 'Low'], n_waste),
    'last_collection_days': np.random.randint(1, 8, n_waste),
    'bin_fill_pct': np.random.randint(20, 80, n_waste)
})

# High density areas like Hiran Magri fill faster
is_high_density = waste_df['population_density'] == 'High'
waste_df.loc[is_high_density, 'bin_fill_pct'] += np.random.randint(10, 30, is_high_density.sum())

waste_df['bin_fill_pct'] = waste_df['bin_fill_pct'].clip(0, 100)
waste_df['overflow_risk'] = (waste_df['bin_fill_pct'] > 75).astype(int)

waste_df.to_csv('data/waste_data.csv', index=False)
print(f"✅ Generated {len(waste_df)} rows of Udaipur waste data.")