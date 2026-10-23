`fahrraddiebstahl_sample.csv`: seed-42 random sample of the live police CSV (2,800 rows) plus 100 cellar break-ins, 100 rows newer than the lag cutoff, 10 rows with missing hours and 10 with unknown LOR `99999999`. Rebuild with `uv run python tests/fixtures/build_fixture.py`.

Missing-hour and unknown-LOR rows are injected (the live CSV has neither): the missing-hour rows blank both start and end hour. The committed CSV is the source of truth; a rebuild samples whatever the live CSV holds that day.
