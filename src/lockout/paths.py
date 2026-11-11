from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

RAW_DIR = ROOT / "data" / "raw"
FETCHED_AT = RAW_DIR / ".fetched_at"
POLYGONS = RAW_DIR / "lor_planungsraeume_2021.geojson"
OSM_DIR = RAW_DIR / "osm"
OSM_FEATURES = OSM_DIR / "osm_features.csv"
GAZETTEER_SRC = RAW_DIR / "gazetteer"

PROCESSED_DIR = ROOT / "data" / "processed"
CLEAN_CSV = PROCESSED_DIR / "street_thefts_clean.csv"
LOOKUP = PROCESSED_DIR / "lookup_schema_v1.json"

SCHEMA = ROOT / "schemas" / "lookup_v1.schema.json"

DOCS_DIR = ROOT / "docs"

PUBLIC_DIR = ROOT / "frontend" / "public"
PUBLIC_LOOKUP = PUBLIC_DIR / "lookup_schema_v1.json"
PUBLIC_AREAS = PUBLIC_DIR / "areas.geojson"
GAZETTEER = PUBLIC_DIR / "gazetteer.json"
