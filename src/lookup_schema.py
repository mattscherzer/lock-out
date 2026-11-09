"""Check a lookup file against the locked v1 JSON Schema (issue #40, roadmap WP 1.5 and M5).

Run from the repo root: uv run python src/lookup_schema.py [file ...]
With no file, checks data/processed/lookup_schema_v1.json and frontend/public/lookup_schema_v1.json.
Exits 1 and lists the problems if a file does not match, so the refresh workflow can use it as a step.
"""
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "schemas" / "lookup_v1.schema.json"
LOOKUP = ROOT / "data" / "processed" / "lookup_schema_v1.json"
PUBLIC_COPY = ROOT / "frontend" / "public" / "lookup_schema_v1.json"


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def problems(doc):
    """Every way doc breaks the schema, as readable lines; empty if it matches."""
    validator = Draft202012Validator(load(SCHEMA))
    return [f"{'/'.join(map(str, e.absolute_path)) or '(top)'}: {e.message}" for e in sorted(validator.iter_errors(doc), key=str)]


if __name__ == "__main__":
    failed = False
    for path in sys.argv[1:] or [LOOKUP, PUBLIC_COPY]:
        found = problems(load(path))
        print(f"{'MISS' if found else 'pass'}  {path}")
        for line in found[:20]:
            print(f"      {line}")
        failed |= bool(found)
    sys.exit(1 if failed else 0)