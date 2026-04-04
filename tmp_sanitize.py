import os
import re
import json

def sanitize_notebook(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            nb = json.load(f)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return

    modified = False
    # Patterns to match
    # 1. os.environ["GOOGLE_API_KEY"] = "AIza..."
    # 2. os.environ["GROQ_API_KEY"] = "gsk_..."
    # 3. os.getenv("...", "AIza...")
    
    google_key_pattern = r'AIzaSy[A-Za-z0-9_-]{33}'
    groq_key_pattern = r'gsk_[A-Za-z0-9]{48}'

    for cell in nb.get('cells', []):
        if cell.get('cell_type') == 'code':
            source = cell.get('source', [])
            new_source = []
            for line in source:
                original_line = line
                # Replace direct assignments
                line = re.sub(r'os\.environ\[["\']GOOGLE_API_KEY["\']\]\s*=\s*["\']' + google_key_pattern + r'["\']', 
                              'os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY", "")', line)
                line = re.sub(r'os\.environ\[["\']GROQ_API_KEY["\']\]\s*=\s*["\']' + groq_key_pattern + r'["\']', 
                              'os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY", "")', line)
                
                # Replace getenv fallbacks
                line = re.sub(r'os\.getenv\((["\']GOOGLE_API_KEY["\']),\s*["\']' + google_key_pattern + r'["\']\)', 
                              r'os.getenv(\1, "")', line)
                line = re.sub(r'os\.getenv\((["\']GROQ_API_KEY["\']),\s*["\']' + groq_key_pattern + r'["\']\)', 
                              r'os.getenv(\1, "")', line)
                
                # General replacement for any remaining strings (safety net)
                line = re.sub(google_key_pattern, 'YOUR_GOOGLE_API_KEY', line)
                line = re.sub(groq_key_pattern, 'YOUR_GROQ_API_KEY', line)

                if line != original_line:
                    modified = True
                new_source.append(line)
            cell['source'] = new_source

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(nb, f, indent=1)
        print(f"Sanitized: {file_path}")
    else:
        print(f"No changes needed for: {file_path}")

def sanitize_py_file(file_path):
    if not os.path.exists(file_path):
        return
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    google_key_pattern = r'AIzaSy[A-Za-z0-9_-]{33}'
    groq_key_pattern = r'gsk_[A-Za-z0-9]{48}'
    
    new_content = re.sub(google_key_pattern, 'YOUR_GOOGLE_API_KEY', content)
    new_content = re.sub(groq_key_pattern, 'YOUR_GROQ_API_KEY', new_content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Sanitized: {file_path}")

if __name__ == "__main__":
    notebooks = [
        "SmartCity_Agent.ipynb",
        "SmartCity_Agent HackManthan.ipynb",
        "SmartCity_Agent HackManthan2.ipynb"
    ]
    py_files = [
        "secure_jupyter_notebooks.py",
        "cleanup_notebooks.py"
    ]
    
    for nb in notebooks:
        sanitize_notebook(nb)
    for py in py_files:
        sanitize_py_file(py)
