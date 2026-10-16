import os
import sys
import urllib.request

# Official Polizei Berlin Open Data CSV URL
CSV_URL = "https://www.internetwache-polizei-berlin.de/vdb/Fahrraddiebstahl.csv"
RAW_PATH = "data/raw/fahrraddiebstahl.csv"
TMP_PATH = "data/raw/fahrraddiebstahl.tmp.csv"

def fetch_data():
    os.makedirs(os.path.dirname(RAW_PATH), exist_ok=True)
    print(f"Attempting to download latest data from {CSV_URL}...")
    
    try:
        req = urllib.request.Request(CSV_URL, headers={"User-Agent": "LockOut-Data-Pipeline/1.0"})
        with urllib.request.urlopen(req, timeout=30) as response, open(TMP_PATH, "wb") as out_file:
            out_file.write(response.read())
        
        # Sanity check: Ensure the file is at least 1MB (not an HTML error page)
        if os.path.getsize(TMP_PATH) > 1_000_000:
            os.replace(TMP_PATH, RAW_PATH)
            print(f"Success! Updated {RAW_PATH} ({os.path.getsize(RAW_PATH) / 1e6:.2f} MB).")
            return
        else:
            print("Warning: Downloaded file is suspiciously small. Discarding.")
            os.remove(TMP_PATH)
    except Exception as e:
        print(f"Warning: Live download failed ({e}).")
        if os.path.exists(TMP_PATH):
            os.remove(TMP_PATH)

    # Fallback check
    if os.path.exists(RAW_PATH):
        print(f"FALLBACK ACTIVE: Using existing cached file at {RAW_PATH}.")
    else:
        print("CRITICAL: Live download failed and no cached CSV exists!")
        sys.exit(1)

if __name__ == "__main__":
    fetch_data()