#!/usr/bin/env python3
"""Apply Supabase migrations via Management API.

Reads PAT + project ref from ~/.openclaw/secrets/trackdon-supabase.env
and POSTs each migration file to
  https://api.supabase.com/v1/projects/{ref}/database/query

Usage:
  python3 supabase/apply.py [<migration.sql> ...]

If no files passed, runs all `supabase/migrations/*.sql` in name order.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

SECRETS = Path.home() / ".openclaw" / "secrets" / "trackdon-supabase.env"

def load_env() -> dict:
    out = {}
    for line in SECRETS.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out

def run(sql: str, env: dict) -> tuple[int, str]:
    ref = env["SUPABASE_PROJECT_REF"]
    pat = env["SUPABASE_PAT"]
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{ref}/database/query",
        data=json.dumps({"query": sql}).encode(),
        method="POST",
        headers={
            "Authorization": f"Bearer {pat}",
            "Content-Type": "application/json",
            "User-Agent": "trackdon-apply/0.1 (+https://github.com/jamoran1356/trackdon)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.getcode(), r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def main() -> int:
    env = load_env()
    files = [Path(p) for p in sys.argv[1:]]
    if not files:
        files = sorted((Path(__file__).parent / "migrations").glob("*.sql"))
    if not files:
        print("no migration files found", file=sys.stderr)
        return 1

    for f in files:
        sql = f.read_text()
        print(f"\n→ {f.name} ({len(sql)} chars)")
        code, body = run(sql, env)
        if code in (200, 201):
            print(f"  ✓ HTTP {code}")
        else:
            print(f"  ✗ HTTP {code}: {body[:500]}")
            return 2
    return 0

if __name__ == "__main__":
    sys.exit(main())
