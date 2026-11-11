"""Clean the police CSV for the model.

Run from the repo root: uv run python -m lockout.cli.clean [path to the police CSV]
"""

import sys

from lockout import config
from lockout.cli.common import load_raw
from lockout.paths import CLEAN_CSV
from lockout.pipeline.clean import clean, street_rows


def main() -> None:
    _, raw = load_raw(sys.argv)
    street = street_rows(raw)
    cleaned = clean(raw)
    print(f"Street rows before truncation: {len(street):,}")
    print(f"Dropped by the {config.LAG_CUTOFF_DAYS}-day lag cutoff: {len(street) - len(cleaned):,}")
    print(f"Rows kept: {len(cleaned):,} | allocated total: {cleaned[list(config.TIME_BANDS)].sum().sum():,.1f}")
    cleaned.to_csv(CLEAN_CSV, index=False)
    print(f"Wrote {CLEAN_CSV}")


if __name__ == "__main__":
    main()
