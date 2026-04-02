import urllib.request, json

PROJECT_REF = "awwbkmprgtwmnejeuiak"
PERSONAL_ACCESS_TOKEN = "sbp_5870842eef06963e8e15438f2aff7cdb2a43f192"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {PERSONAL_ACCESS_TOKEN}",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Origin": "https://supabase.com",
    "Referer": "https://supabase.com/",
}

sql = "ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS notas text;"

url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
data = json.dumps({"query": sql}).encode("utf-8")
req = urllib.request.Request(url, data=data, headers=HEADERS, method="POST")

try:
    with urllib.request.urlopen(req) as resp:
        print("OK:", json.loads(resp.read().decode("utf-8")))
except urllib.error.HTTPError as e:
    print(f"ERROR {e.code}:", e.read().decode("utf-8"))
