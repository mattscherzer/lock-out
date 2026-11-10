"""Check a lookup file against the locked v1 JSON Schema (issue #40, roadmap WP 1.5 and M5)."""
import json
from pathlib import Path

from jsonschema import Draft202012Validator

from lockout.paths import SCHEMA


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def problems(doc):
    """Every way doc breaks the schema, as readable lines; empty if it matches."""
    validator = Draft202012Validator(load(SCHEMA))
    return [f"{'/'.join(map(str, e.absolute_path)) or '(top)'}: {e.message}" for e in sorted(validator.iter_errors(doc), key=str)]
