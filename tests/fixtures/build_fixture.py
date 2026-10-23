"""Rebuild fahrraddiebstahl_sample.csv from data/raw (run: uv run python tests/fixtures/build_fixture.py)."""
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))
from config import LAG_CUTOFF_DAYS
from fetch_police_csv import find_raw_csv

OUT = Path(__file__).with_name("fahrraddiebstahl_sample.csv")
SEED = 42

df = pd.read_csv(find_raw_csv(), encoding="iso-8859-1", dtype=str)
reported = pd.to_datetime(df["ANGELEGT_AM"], dayfirst=True)
recent = df[reported > reported.max() - pd.Timedelta(days=LAG_CUTOFF_DAYS)]
cellar = df[df["ERFASSUNGSGRUND"].str.contains("Keller", case=False, na=False)]

parts = [
    df.sample(2800, random_state=SEED),
    cellar.sample(100, random_state=SEED),
    recent.sample(100, random_state=SEED),  # newer than the lag cutoff
]
missing_time = df.sample(10, random_state=SEED + 1).assign(TATZEIT_ANFANG_STUNDE="", TATZEIT_ENDE_STUNDE="")
unknown_lor = df.sample(10, random_state=SEED + 2).assign(LOR="99999999")
out = pd.concat(parts + [missing_time, unknown_lor]).drop_duplicates()
out.to_csv(OUT, index=False, encoding="iso-8859-1", lineterminator="\n")
print(f"Wrote {len(out)} rows to {OUT}")
