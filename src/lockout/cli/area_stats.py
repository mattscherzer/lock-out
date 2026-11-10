"""Print how many areas get their own median stolen value, the citywide facts and the confidence counts (issue #57).

Run from the repo root: uv run python -m lockout.cli.area_stats [path to the police CSV]
"""
import sys

from lockout.cli.common import load_cleaned
from lockout.lookup.generate import generator_window
from lockout.models.area_stats import area_stats, citywide_facts
from lockout.pipeline.clean import stolen_value


def main():
    _, cleaned, areas, _, cutoff = load_cleaned(sys.argv)
    window, start = generator_window(cleaned, cutoff)
    table = area_stats(window, areas)
    facts = citywide_facts(window)
    print(f"Window: {start:%d %b %Y} to {cutoff:%d %b %Y}, {len(window):,} street thefts, {stolen_value(window).isna().sum():,} without a usable value (blank or 0)")
    print(f"Areas with their own median stolen value: {(table['median_source'] == 'area').sum()} of {len(table)}")
    print(f"Citywide: median stolen value EUR {facts['median_stolen_value_eur']:,}, lock-defeated share {facts['lock_defeated_share']:.0%}")
    print("Confidence:", ", ".join(f"{k} {v}" for k, v in table["confidence"].value_counts().reindex(["LOW", "MEDIUM", "HIGH"], fill_value=0).items()))


if __name__ == "__main__":
    main()
