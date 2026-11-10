from collections.abc import Iterable, Sequence
from pathlib import Path
from typing import NamedTuple

import pandas as pd

from lockout import config
from lockout.geo.lor import polygon_ids
from lockout.ingest.fetch import find_raw_csv
from lockout.ingest.police_csv import check_csv
from lockout.models.backtest import FOLDS
from lockout.pipeline.clean import clean


class Cleaned(NamedTuple):
    path: Path
    df: pd.DataFrame
    areas: list[str]
    reports_up_to: pd.Timestamp
    cutoff: pd.Timestamp


def load_cleaned(argv: Sequence[str]) -> Cleaned:
    """Check and clean the police CSV named in argv[1] (default: the raw file in data/raw)."""
    path = Path(argv[1]) if len(argv) > 1 else find_raw_csv()
    df = clean(check_csv(path))
    df["LOR"] = df["LOR"].str.zfill(8)
    reports_up_to = df["ANGELEGT_AM"].max()
    return Cleaned(path, df, sorted(polygon_ids()), reports_up_to, reports_up_to - pd.Timedelta(days=config.LAG_CUTOFF_DAYS))


def require_folds_complete(cutoff: pd.Timestamp) -> None:
    if pd.Timestamp(FOLDS[-1][1]) > cutoff:
        raise SystemExit(f"The file is only complete up to {cutoff:%d %b %Y}, before the last fold ends; use a newer file.")


def table(header: Sequence[str], rows: Iterable[Sequence]) -> str:
    lines = ["| " + " | ".join(header) + " |", "| " + " | ".join("---" for _ in header) + " |"]
    return "\n".join(lines + ["| " + " | ".join(str(v) for v in row) + " |" for row in rows])
