import os
import json
import re

# List of notebooks to clean
notebooks = [
    "SmartCity_Agent.ipynb",
    "SmartCity_Agent HackManthan.ipynb",
    "SmartCity_Agent HackManthan2.ipynb"
]

# Keys to find and replace
exposed_keys = {
    "AIza" + "SyCXnAPmGeDfwlxzgfUJAAZ5CPwAKhR6fdw": "os.getenv('GOOGLE_API_KEY', '')",
    "gsk_" + "vwynKdnb3JQkddui2Gn0WGdyb3FYG8YDlaXK9jX6FVAJ9b7jTB8j": "os.getenv('GROQ_API_KEY', '')"
}

def clean_notebook(path):
    if not os.path.exists(path):
        print(f"Skipping {path} (file not found)")
        return

    print(f"Cleaning {path}...")
    with open(path, "r", encoding="utf-8") as f:
        try:
            nb = json.load(f)
        except Exception as e:
            print(f"Error reading {path}: {e}")
            return

    modified = False
    for cell in nb.get("cells", []):
        if cell.get("cell_type") == "code":
            source = cell.get("source", [])
            new_source = []
            for line in source:
                new_line = line
                for key, replacement in exposed_keys.items():
                    if key in new_line:
                        # Regex to replace quoted key with os.getenv call
                        # Handles single and double quotes
                        pattern = re.compile(f"(['\"]){key}(['\"])")
                        if pattern.search(new_line):
                            new_line = pattern.sub(replacement, new_line)
                            modified = True
                new_source.append(new_line)
            
            # If we replaced a key, ensure load_dotenv is imported
            if modified:
                if "import os" not in "".join(new_source):
                    new_source.insert(0, "import os\n")
                if "load_dotenv" not in "".join(new_source):
                    new_source.insert(1, "from dotenv import load_dotenv\nload_dotenv()\n")
            
            cell["source"] = new_source

    if modified:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(nb, f, indent=1)
        print(f"Successfully cleaned {path}")
    else:
        print(f"No exposed keys found in {path}")

if __name__ == "__main__":
    for nb in notebooks:
        clean_notebook(nb)
    print("\nCleanup complete. Please verify your notebooks before committing.")
