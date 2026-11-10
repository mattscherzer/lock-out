"""Download the police CSV, or fall back to the cached one.

Run from the repo root: uv run python -m lockout.cli.fetch
"""
import sys

from lockout.ingest.fetch import FetchError, fetch_data


def main():
    try:
        fetch_data()
    except FetchError as e:
        sys.exit(str(e))


if __name__ == "__main__":
    main()
