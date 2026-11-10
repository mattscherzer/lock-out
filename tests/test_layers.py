import ast
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src"
LAYER = {"config": 0, "paths": 0, "geo": 1, "ingest": 1, "pipeline": 2, "models": 3, "lookup": 4, "cli": 5}


def imported(tree):
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            yield from (a.name for a in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module == "lockout":
            yield from (f"lockout.{a.name}" for a in node.names)
        elif isinstance(node, ast.ImportFrom):
            yield node.module or ""


def test_layers_only_import_downwards_and_only_cli_runs_things():
    for path in (SRC / "lockout").rglob("*.py"):
        parts = path.relative_to(SRC).with_suffix("").parts
        if len(parts) < 2 or parts[-1] == "__init__":
            continue
        tree, layer = ast.parse(path.read_text()), LAYER[parts[1]]
        for name in imported(tree):
            if name.startswith("lockout."):
                assert LAYER[name.split(".")[1]] <= layer, f"{path} imports {name} from a higher layer"
        runs = any(isinstance(n, ast.Attribute) and n.attr == "exit" and getattr(n.value, "id", "") == "sys" for n in ast.walk(tree))
        runs |= any(isinstance(n, ast.Name) and n.id == "__name__" for n in ast.walk(tree))
        assert not runs or parts[1] == "cli", f"{path} has sys.exit or __main__ outside lockout.cli"
