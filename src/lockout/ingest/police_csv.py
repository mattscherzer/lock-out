"""Checks that stop the audit when the police CSV is broken."""
import csv
from pathlib import Path

import pandas as pd

from lockout import config
from lockout.geo.lor import polygon_ids


class AuditError(Exception):
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
        raise AuditError("Could not detect the delimiter (expected , or ;)")


def check_csv(path: Path, min_rows: int = config.MIN_ROWS) -> pd.DataFrame:
    encoding = detect_encoding(path)
    delimiter = detect_delimiter(path, encoding)
    df = pd.read_csv(path, sep=delimiter, encoding=encoding, dtype={"LOR": str})
    missing = set(config.REQUIRED_COLUMNS) - set(df.columns)
    if missing:
        raise AuditError(f"Missing columns: {sorted(missing)}")
    if len(df) < min_rows:
        raise AuditError(f"Only {len(df):,} rows, expected at least {min_rows:,}")
    unknown = set(df["LOR"].str.zfill(8)) - polygon_ids()
    if unknown:
        raise AuditError(f"Area IDs not among the 542 polygons: {sorted(unknown)}")
    if not isinstance(config.LAG_CUTOFF_DAYS, int) or config.LAG_CUTOFF_DAYS <= 0:
        raise AuditError("Lag cutoff is not set in config.py")
    print(f"Encoding: {encoding}, delimiter: {delimiter!r}, rows: {len(df):,}")
    return df
