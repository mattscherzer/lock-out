"""Load the police CSV and stop if it is broken."""

import csv
from pathlib import Path

import pandas as pd

from lockout import config
from lockout.geo.lor import polygon_ids


class CsvError(Exception):
    pass


def detect_encoding(path: Path) -> str:
    try:
        path.read_bytes().decode("utf-8")
        return "utf-8"
    except UnicodeDecodeError:
        return "iso-8859-1"


def detect_delimiter(path: Path, encoding: str) -> str:
    sample = path.read_text(encoding=encoding)[:5000]
    try:
        return csv.Sniffer().sniff(sample, delimiters=",;").delimiter
    except csv.Error:
        raise CsvError("Could not detect the delimiter (expected , or ;)") from None


def load_police_csv(path: Path, min_rows: int = config.MIN_ROWS) -> pd.DataFrame:
    encoding = detect_encoding(path)
    delimiter = detect_delimiter(path, encoding)
    df = pd.read_csv(path, sep=delimiter, encoding=encoding, dtype={"LOR": str})
    missing = set(config.REQUIRED_COLUMNS) - set(df.columns)
    if missing:
        raise CsvError(f"Missing columns: {sorted(missing)}")
    if len(df) < min_rows:
        raise CsvError(f"Only {len(df):,} rows, expected at least {min_rows:,}")
    known = polygon_ids()
    unknown = set(df["LOR"].str.zfill(8)) - known
    if unknown:
        raise CsvError(f"Area IDs not among the {len(known)} polygons: {sorted(unknown)}")
    print(f"Encoding: {encoding}, delimiter: {delimiter!r}, rows: {len(df):,}")
    return df
