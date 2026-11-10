"""Clean the police CSV for the model.

Run from the repo root: uv run python -m lockout.cli.clean [path to the police CSV]
"""
import sys
from pathlib import Path

from lockout import config
from lockout.ingest.fetch import find_raw_csv
from lockout.ingest.police_csv import check_csv
from lockout.paths import CLEAN_CSV
from lockout.pipeline.clean import clean, street_rows


def main():
    raw = check_csv(Path(sys.argv[1]) if len(sys.argv) > 1 else find_raw_csv())
    street = street_rows(raw)
    cleaned = clean(raw)
    print(f"Street rows before truncation: {len(street):,}")
    print(f"Dropped by the {config.LAG_CUTOFF_DAYS}-day lag cutoff: {len(street) - len(cleaned):,}")
    print(f"Rows kept: {len(cleaned):,} | allocated total: {cleaned[list(config.DAYPARTS)].sum().sum():,.1f}")
    cleaned.to_csv(CLEAN_CSV, index=False)
    print(f"Wrote {CLEAN_CSV}")


if __name__ == "__main__":
    main()
