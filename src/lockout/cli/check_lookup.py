"""Check a lookup file against the locked v1 JSON Schema (issue #40, roadmap WP 1.5 and M5).

Run from the repo root: uv run python -m lockout.cli.check_lookup [file ...]
With no file, checks data/processed/lookup_schema_v1.json and frontend/public/lookup_schema_v1.json.
Exits 1 and lists the problems if a file does not match, so the refresh workflow can use it as a step.
"""
import sys

from lockout.lookup.schema import load, problems
from lockout.paths import LOOKUP, PUBLIC_LOOKUP


def main():
    failed = False
    for path in sys.argv[1:] or [LOOKUP, PUBLIC_LOOKUP]:
        found = problems(load(path))
        print(f"{'MISS' if found else 'pass'}  {path}")
        for line in found[:20]:
            print(f"      {line}")
        failed |= bool(found)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
