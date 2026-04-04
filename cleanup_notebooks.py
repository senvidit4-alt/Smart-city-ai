import os
import json

notebooks = [
    r"c:\Users\Vidit\OneDrive\Desktop\backup - Copy\SmartCity_Agent.ipynb",
    r"c:\Users\Vidit\OneDrive\Desktop\backup - Copy\SmartCity_Agent HackManthan.ipynb",
    r"c:\Users\Vidit\OneDrive\Desktop\backup - Copy\SmartCity_Agent HackManthan2.ipynb"
]

google_key = os.getenv("GOOGLE_API_KEY", "")
groq_key = os.getenv("GROQ_API_KEY", "")

replacements = {
    google_key: "HIDDEN",
    groq_key: "HIDDEN"
}

for nb_path in notebooks:
    if not os.path.exists(nb_path):
        print(f"Skipping {nb_path} (not found)")
        continue
    
    print(f"Processing {nb_path}...")
    with open(nb_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    modified = False
    for cell in data.get("cells", []):
        if cell.get("cell_type") == "code":
            source = cell.get("source", [])
            new_source = []
            for line in source:
                new_line = line
                if google_key in line:
                    new_line = line.replace(f'"{google_key}"', 'os.getenv("GOOGLE_API_KEY", "")')
                    new_line = new_line.replace(f"'{google_key}'", "os.getenv('GOOGLE_API_KEY', '')")
                    modified = True
                if groq_key in line:
                    new_line = new_line.replace(f'"{groq_key}"', 'os.getenv("GROQ_API_KEY", "")')
                    new_line = new_line.replace(f"'{groq_key}'", "os.getenv('GROQ_API_KEY', '')")
                    modified = True
                new_source.append(new_line)
            
            # If line was modified, also ensure 'import os' and 'load_dotenv' if not present
            # But simpler to just replace the keys for now and ensure they have a .env logic globally.
            cell["source"] = new_source
            
    if modified:
        with open(nb_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=1)
        print(f"✅ Cleaned {nb_path}")
    else:
        print(f"No keys found in {nb_path}")
