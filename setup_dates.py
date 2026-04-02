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

def run_sql(desc, sql):
    print(f"\n>> {desc}...")
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    data = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            print("   OK:", result)
    except urllib.error.HTTPError as e:
        print(f"   ERROR {e.code}:", e.read().decode("utf-8"))

# 1. Adicionar coluna status_updated_at
run_sql(
    "Adicionar status_updated_at",
    "ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS status_updated_at timestamptz DEFAULT now();"
)

# 2. Preencher status_updated_at nos registos existentes com created_at
run_sql(
    "Preencher status_updated_at existentes",
    "UPDATE crm_contacts SET status_updated_at = created_at WHERE status_updated_at IS NULL;"
)

# 3. Preencher data_entrada nos registos que nao têm com a data de created_at
run_sql(
    "Preencher data_entrada em branco com created_at",
    "UPDATE crm_contacts SET data_entrada = TO_CHAR(created_at, 'YYYY-MM-DD') WHERE data_entrada IS NULL OR data_entrada = '';"
)

print("\nConcluido!")
