from datetime import date

# Reporting-lag cutoff: rows reported within the last N days are dropped.
# p95 lag measured at 10 days, rounded up because late reports are missing from the distribution itself.
LAG_CUTOFF_DAYS = 14

# First offence start date in the police CSV.
DATA_WINDOW_START = date(2025, 1, 1)

# Weekday indices (Mon=0) per daytype; provisional until the EDA (roadmap D-08).
DAYTYPES = {"Mon_Thu": (0, 1, 2, 3), "Friday": (4,), "Weekend": (5, 6)}


def daytype_of(weekday_idx):
    # NaN weekday (unparseable date) matches no daytype and stays unmapped
    return next((name for name, days in DAYTYPES.items() if weekday_idx in days), None)


# The audit stops if the police CSV has fewer rows than this or lacks a column.
MIN_ROWS = 25_000
REQUIRED_COLUMNS = [
    "ANGELEGT_AM", "TATZEIT_ANFANG_DATUM", "TATZEIT_ANFANG_STUNDE",
    "TATZEIT_ENDE_DATUM", "TATZEIT_ENDE_STUNDE", "LOR", "SCHADENSHOEHE",
    "VERSUCH", "ART_DES_FAHRRADS", "DELIKT", "ERFASSUNGSGRUND",
]

# Time bands by hour of day (provisional until G1, roadmap D-08).
DAYPARTS = {
    "Morning": tuple(range(6, 11)),
    "Afternoon": tuple(range(11, 17)),
    "Evening": tuple(range(17, 22)),
    "Night": (22, 23, 0, 1, 2, 3, 4, 5),
}