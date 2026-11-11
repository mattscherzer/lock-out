import sys
from collections.abc import Iterable, Sequence
from pathlib import Path
from typing import NamedTuple

import numpy as np
import pandas as pd

from lockout.geo.lor import polygon_ids
from lockout.ingest.fetch import find_raw_csv
from lockout.ingest.police_csv import CsvError, load_police_csv
from lockout.models.backtest import FOLDS
from lockout.paths import RAW_DIR
from lockout.pipeline.clean import clean, cutoff

MODEL_LABELS = {
    "citywide": "Citywide share",
    "raw": "Raw area history",
    "eb": "EB v0",
    "glm": "GLM on OSM counts",
    "eb_glm": "EB toward the GLM",
}


class Cleaned(NamedTuple):
    path: Path
    df: pd.DataFrame
    areas: list[str]
    reports_up_to: pd.Timestamp
    cutoff: pd.Timestamp


def load_raw(argv: Sequence[str]) -> tuple[Path, pd.DataFrame]:
    """Load and check the police CSV named in argv[1] (default: the raw file in data/raw); exit with a message if that fails."""
    path = Path(argv[1]) if len(argv) > 1 else find_raw_csv()
    if path is None or not path.is_file():
        sys.exit(f"No police CSV at {path or RAW_DIR}; run `python -m lockout.cli.fetch` first.")
    try:
        return path, load_police_csv(path)
    except CsvError as e:
        sys.exit(f"CSV CHECK FAILED: {e}")


def load_cleaned(argv: Sequence[str]) -> Cleaned:
    """Check and clean the police CSV named in argv[1] (default: the raw file in data/raw)."""
    path, raw = load_raw(argv)
    df = clean(raw)
    return Cleaned(path, df, sorted(polygon_ids()), df["ANGELEGT_AM"].max(), cutoff(df))


def require_folds_complete(cutoff: pd.Timestamp) -> None:
    if pd.Timestamp(FOLDS[-1][1]) > cutoff:
        raise SystemExit(
            f"The file is only complete up to {cutoff:%d %b %Y}, before the last fold ends; use a newer file."
        )


def fmt(v: float, pattern: str) -> str:
    return "n/a" if np.isnan(v) else format(v, pattern)


def table(header: Sequence[str], rows: Iterable[Sequence]) -> str:
    lines = ["| " + " | ".join(header) + " |", "| " + " | ".join("---" for _ in header) + " |"]
    return "\n".join(lines + ["| " + " | ".join(str(v) for v in row) + " |" for row in rows])
