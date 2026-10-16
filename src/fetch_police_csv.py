import sys
import time
import urllib.request
from pathlib import Path

# Official Polizei Berlin Open Data CSV URL
CSV_URL = "https://www.internetwache-polizei-berlin.de/vdb/Fahrraddiebstahl.csv"
RAW_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"
CSV_NAME = "fahrraddiebstahl.csv"
# Records when the CSV was last downloaded (file mtimes are reset by git checkout).
FETCHED_AT = RAW_DIR / ".fetched_at"
MAX_FALLBACK_AGE_DAYS = 21


def find_raw_csv():
    """Return the existing raw CSV whatever its letter case (macOS vs Linux), or None."""
    return next((p for p in RAW_DIR.glob("*.csv") if p.name.lower() == CSV_NAME), None)


def fetch_data():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    raw_path = find_raw_csv() or RAW_DIR / CSV_NAME
    tmp_path = raw_path.with_suffix(".tmp")
    print(f"Attempting to download latest data from {CSV_URL}...")

    try:
        req = urllib.request.Request(CSV_URL, headers={"User-Agent": "LockOut-Data-Pipeline/1.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            tmp_path.write_bytes(response.read())

        # Sanity check: Ensure the file is at least 1MB (not an HTML error page)
        if tmp_path.stat().st_size > 1_000_000:
            tmp_path.replace(raw_path)
            FETCHED_AT.write_text(str(time.time()))
            print(f"Success! Updated {raw_path} ({raw_path.stat().st_size / 1e6:.2f} MB).")
            return
        print("Warning: Downloaded file is suspiciously small. Discarding.")
    except Exception as e:
        print(f"Warning: Live download failed ({e}).")
    tmp_path.unlink(missing_ok=True)

    # Fallback: reuse the old file, but fail loudly once it is too old.
    if not raw_path.exists():
        sys.exit("CRITICAL: Live download failed and no cached CSV exists!")
    try:
        age_days = (time.time() - float(FETCHED_AT.read_text())) / 86400
    except (OSError, ValueError):
        sys.exit(f"CRITICAL: Download failed and the age of {raw_path} is unknown.")
    if age_days > MAX_FALLBACK_AGE_DAYS:
        sys.exit(f"CRITICAL: Download failed and cached CSV is {age_days:.0f} days old (max {MAX_FALLBACK_AGE_DAYS}).")
    print(f"FALLBACK ACTIVE: Using cached file {raw_path} ({age_days:.0f} days old).")


if __name__ == "__main__":
    fetch_data()
