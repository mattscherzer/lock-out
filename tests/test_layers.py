import ast
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src"
LAYER = {"config": 0, "paths": 0, "geo": 1, "ingest": 1, "pipeline": 2, "models": 3, "lookup": 4, "cli": 5}


def imported(tree, package):
    """Absolute dotted name of every import; relative ones are resolved against the module's own package."""
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            yield from (a.name for a in node.names)
        elif isinstance(node, ast.ImportFrom):
            base = package[: len(package) - node.level + 1] if node.level else []
            module = [*base, *node.module.split(".")] if node.module else base
            if module == ["lockout"]:
                yield from (f"lockout.{a.name}" for a in node.names)
            else:
                yield ".".join(module)


def exits(node):
    return (
        (isinstance(node, ast.Name) and node.id in ("SystemExit", "__name__"))
        or (isinstance(node, ast.Attribute) and node.attr == "exit" and getattr(node.value, "id", "") == "sys")
        or (isinstance(node, ast.ImportFrom) and node.module == "sys" and any(a.name == "exit" for a in node.names))
    )


def test_layers_only_import_downwards_and_only_cli_runs_things():
    for path in (SRC / "lockout").rglob("*.py"):
        parts = path.relative_to(SRC).with_suffix("").parts
        if len(parts) < 2 or parts[-1] == "__init__":
            continue
        tree, layer = ast.parse(path.read_text()), LAYER[parts[1]]
        for name in imported(tree, list(parts[:-1])):
            if name.startswith("lockout."):
                assert LAYER[name.split(".")[1]] <= layer, f"{path} imports {name} from a higher layer"
        assert parts[1] == "cli" or not any(exits(n) for n in ast.walk(tree)), (
            f"{path} has sys.exit, SystemExit or __main__ outside lockout.cli"
        )
