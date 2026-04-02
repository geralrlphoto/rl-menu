import urllib.request
import urllib.error
import json

PROJECT_REF = "awwbkmprgtwmnejeuiak"
PERSONAL_ACCESS_TOKEN = "sbp_5870842eef06963e8e15438f2aff7cdb2a43f192"

MGMT_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {PERSONAL_ACCESS_TOKEN}",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Origin": "https://supabase.com",
    "Referer": "https://supabase.com/",
}

sql = """
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'crm_contacts' AND policyname = 'update_crm'
  ) THEN
    CREATE POLICY "update_crm" ON crm_contacts FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END
$$;
"""

url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
data = json.dumps({"query": sql}).encode("utf-8")
req = urllib.request.Request(url, data=data, headers=MGMT_HEADERS, method="POST")

try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        print("OK:", result)
except urllib.error.HTTPError as e:
    body = e.read().decode("utf-8")
    print(f"ERROR {e.code}: {body}")
