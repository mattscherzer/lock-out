import pandas as pd
import numpy as np
import json

from config import daytype_of
from fetch_police_csv import RAW_DIR, find_raw_csv

# 1. Load Police CSV (handle daten.berlin.de delimiter and encoding quirks)
csv_path = find_raw_csv()
if csv_path is None:
    raise SystemExit(f"No police CSV found in {RAW_DIR}; run fetch_police_csv.py first.")
try:
    df = pd.read_csv(csv_path, sep=None, engine="python", encoding="utf-8")
except UnicodeDecodeError:
    df = pd.read_csv(csv_path, sep=None, engine="python", encoding="iso-8859-1")

print(f"=== 1. RAW DATASET OVERVIEW ===")
print(f"Total Rows: {len(df):,}")
print(f"Columns: {list(df.columns)}\n")

# 2. Inspect Indoor/Basement vs. Outdoor Street Thefts
print(f"=== 2. INDOOR VS. OUTDOOR FILTERING (DELIKT & ERFASSUNGSGRUND) ===")
if "DELIKT" in df.columns:
    print("DELIKT breakdown:")
    print(df["DELIKT"].value_counts(dropna=False), "\n")
if "ERFASSUNGSGRUND" in df.columns:
    print("ERFASSUNGSGRUND breakdown:")
    print(df["ERFASSUNGSGRUND"].value_counts(dropna=False), "\n")

# Filter out basement break-ins (Keller- und Bodeneinbruch) for outdoor analysis
outdoor_mask = ~df.apply(lambda r: r.astype(str).str.contains("Keller|Boden", case=False).any(), axis=1)
df_outdoor = df[outdoor_mask].copy()
print(f"Outdoor rows retained: {len(df_outdoor):,} ({len(df_outdoor)/len(df):.1%} of total)\n")

# 3. Verify 8-Digit LOR Hierarchy & GeoJSON Match
print(f"=== 3. LOR HIERARCHY & GEOJSON ALIGNMENT ===")
lor_col = [c for c in df_outdoor.columns if "lor" in c.lower() or "plr" in c.lower()][0]
df_outdoor[lor_col] = df_outdoor[lor_col].astype(str).str.zfill(8)

print(f"Unique Bezirke (digits 1-2):        {df_outdoor[lor_col].str[:2].nunique()} (Expected: 12)")
print(f"Unique Prognoseräume (digits 1-4):  {df_outdoor[lor_col].str[:4].nunique()} (Expected: 58)")
print(f"Unique Bezirksregionen (digits 1-6):{df_outdoor[lor_col].str[:6].nunique()} (Expected: 143)")
print(f"Unique Planungsräume (digits 1-8):  {df_outdoor[lor_col].nunique()} (Expected: 542)")

# Optional GeoJSON diff check if file is present
try:
    with open(RAW_DIR / "lor_planungsraeume_2021.geojson", "r", encoding="utf-8") as f:
        geo = json.load(f)
    # Adjust property key below based on exact Berlin Open Data GeoJSON schema (usually 'PLR_ID')
    sample_props = geo["features"][0]["properties"]
    geo_key = [k for k in sample_props.keys() if "plr" in k.lower() or "id" in k.lower()][0]
    geo_lors = {str(feat["properties"][geo_key]).zfill(8) for feat in geo["features"]}
    police_lors = set(df_outdoor[lor_col].unique())
    print(f"In Police CSV but missing from GeoJSON: {police_lors - geo_lors}")
    print(f"In GeoJSON but 0 thefts in Police CSV:  {len(geo_lors - police_lors)} areas\n")
except FileNotFoundError:
    print("Note: 'lor_planungsraeume_2021.geojson' not found in data/raw; skipping polygon diff.\n")

# 4. Quantify Reporting Lag (ANGELEGT_AM - TATZEIT_ENDE_DATUM)
print(f"=== 4. REPORTING LAG DISTRIBUTION (HOLDOUT TRUNCATION CUTOFF) ===")
angelegt = pd.to_datetime(df_outdoor["ANGELEGT_AM"], dayfirst=True, errors="coerce")
ende_datum = pd.to_datetime(df_outdoor["TATZEIT_ENDE_DATUM"], dayfirst=True, errors="coerce")
lag_days = (angelegt - ende_datum).dt.days.dropna()
lag_days = lag_days[lag_days >= 0]

print(f"50th percentile (Median) lag: {np.percentile(lag_days, 50):.0f} days")
print(f"90th percentile lag:          {np.percentile(lag_days, 90):.0f} days")
print(f"95th percentile lag (Cutoff): {np.percentile(lag_days, 95):.0f} days\n")

# 5. Offense Window Duration Breakdown
print(f"=== 5. OFFENSE WINDOW DURATION ===")
time_start = pd.to_datetime(
    df_outdoor["TATZEIT_ANFANG_DATUM"].astype(str) + " " + df_outdoor["TATZEIT_ANFANG_STUNDE"].astype(str) + ":00",
    dayfirst=True, errors="coerce"
)
time_end = pd.to_datetime(
    df_outdoor["TATZEIT_ENDE_DATUM"].astype(str) + " " + df_outdoor["TATZEIT_ENDE_STUNDE"].astype(str) + ":00",
    dayfirst=True, errors="coerce"
)
duration_hours = (time_end - time_start).dt.total_seconds() / 3600.0
valid_dur = duration_hours[(duration_hours >= 0) & (duration_hours <= 72)]

print(f"Windows <= 1h:  {(valid_dur <= 1).mean():.1%}")
print(f"Windows <= 4h:  {(valid_dur <= 4).mean():.1%}")
print(f"Windows <= 6h:  {(valid_dur <= 6).mean():.1%}")
print(f"Windows <= 24h: {(valid_dur <= 24).mean():.1%}\n")

# 6. Sparsity Check: 28 Cells (7 Days x 4 Blocks) vs. 12 Cells (3 Day-Types x 4 Blocks)
print(f"=== 6. SPARSITY CHECK: 28 CELLS VS. 12 CELLS PER AREA ===")
def map_daypart(h):
    if 6 <= h < 11: return "Morning"
    elif 11 <= h < 17: return "Afternoon"
    elif 17 <= h < 22: return "Evening"
    else: return "Night"

def map_daytype(weekday_idx):
    return daytype_of(weekday_idx)

df_outdoor["daypart"] = df_outdoor["TATZEIT_ANFANG_STUNDE"].apply(map_daypart)
df_outdoor["weekday"] = time_start.dt.day_name()
df_outdoor["daytype"] = time_start.dt.weekday.apply(map_daytype)

n_lors = 542
total_outdoor = len(df_outdoor)
print(f"28-Cell Grid (542 x 7 x 4 = 15,176 cells) -> Mean total thefts/cell: {total_outdoor / (n_lors * 28):.2f}")
print(f"12-Cell Grid (542 x 3 x 4 = 6,504 cells)  -> Mean total thefts/cell: {total_outdoor / (n_lors * 12):.2f}")