# Security Instructions: Finalizing Your GitHub Push

The repository has been partially secured by updating `.gitignore` and providing templates. However, due to environment restrictions, you need to perform the following final steps manually to ensure no secrets are exposed.

## 1. Clean Jupyter Notebooks
I have created a script called `secure_jupyter_notebooks.py` in the root directory. To remove all hardcoded API keys from your notebooks, run:

```bash
python secure_jupyter_notebooks.py
```

## 2. Rotate Exposed Keys (CRITICAL)
The following keys were found hardcoded in your notebooks and have likely been committed to your git history:
- **Google Gemini Key**: `AIzaSyCXnAPmGeDfwlxzgfUJAAZ5CPwAKhR6fdw`
- **Groq Key**: `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`

**You MUST:**
1.  Go to [Google AI Studio](https://aistudio.google.com/) -> Settings -> API Keys and **DELETE** this key.
2.  Go to [Groq Console](https://console.groq.com/keys) and **DELETE** this key.
3.  Generate new keys and add them to your `.env` file.

## 3. Purge Git History (Optional but Recommended)
To completely remove all traces of these keys from your history, run:

```bash
# Using git-filter-repo (Recommended)
git filter-repo --replace-text <(echo "AIzaSyCXnAPmGeDfwlxzgfUJAAZ5CPwAKhR6fdw==>HIDDEN_KEY")
git filter-repo --replace-text <(echo "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==>HIDDEN_KEY")
```

Alternatively, if you don't mind starting fresh:
```bash
rm -rf .git
git init
git add .
git commit -m "Initial secure commit"
```
