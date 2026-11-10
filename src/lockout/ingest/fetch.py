import time
import urllib.request
from pathlib import Path

from lockout.paths import FETCHED_AT, RAW_DIR

CSV_URL = "https://www.polizei-berlin.eu/Fahrraddiebstahl/Fahrraddiebstahl.csv"
CSV_NAME = "fahrraddiebstahl.csv"
MAX_FALLBACK_AGE_DAYS = 21


class FetchError(Exception):
    pass


def find_raw_csv() -> Path | None:
    """The raw CSV whatever its letter case (macOS vs Linux), or None."""
    return next((p for p in RAW_DIR.glob("*.csv") if p.name.lower() == CSV_NAME), None)


def fetch_data() -> None:
    """Download the CSV or fall back to the cached one; FETCHED_AT records the last download because git checkout resets mtimes."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    raw_path = find_raw_csv() or RAW_DIR / CSV_NAME
    tmp_path = raw_path.with_suffix(".tmp")
    print(f"Attempting to download latest data from {CSV_URL}...")

    try:
        req = urllib.request.Request(CSV_URL, headers={"User-Agent": "LockOut-Data-Pipeline/1.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            tmp_path.write_bytes(response.read())

        if tmp_path.stat().st_size > 1_000_000:
            tmp_path.replace(raw_path)
            FETCHED_AT.write_text(str(time.time()))
            print(f"Success! Updated {raw_path} ({raw_path.stat().st_size / 1e6:.2f} MB).")
            return
        print("Warning: Downloaded file is suspiciously small. Discarding.")
    except Exception as e:
        print(f"Warning: Live download failed ({e}).")
    tmp_path.unlink(missing_ok=True)

    if not raw_path.exists():
        raise FetchError("CRITICAL: Live download failed and no cached CSV exists!")
    try:
        age_days = (time.time() - float(FETCHED_AT.read_text())) / 86400
    except (OSError, ValueError):
        raise FetchError(f"CRITICAL: Download failed and the age of {raw_path} is unknown.")
    if age_days > MAX_FALLBACK_AGE_DAYS:
        raise FetchError(f"CRITICAL: Download failed and cached CSV is {age_days:.0f} days old (max {MAX_FALLBACK_AGE_DAYS}).")
    print(f"FALLBACK ACTIVE: Using cached file {raw_path} ({age_days:.0f} days old).")
