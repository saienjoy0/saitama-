#!/usr/bin/env python3
"""Install/check development tools only; never scaffold the product."""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEV = ROOT / "tools" / "development"

def run(*args):
    subprocess.run(args, cwd=ROOT, check=True)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frozen", action="store_true")
    parser.add_argument("--with-browser", action="store_true")
    parser.add_argument("--with-db", action="store_true")
    args = parser.parse_args()
    if sys.version_info[:2] != (3, 12):
        raise SystemExit("Use Python 3.12 before setup")
    for command in ("git", "node", "npm"):
        if shutil.which(command) is None:
            raise SystemExit(f"Missing development tool: {command}")
    node = subprocess.check_output(["node", "--version"], text=True).strip()
    if int(node.lstrip("v").split(".")[0]) != 24:
        raise SystemExit("Use Node 24 before setup")
    if shutil.which("uv") is None:
        raise SystemExit("Install uv from https://docs.astral.sh/uv/getting-started/installation/ then rerun")
    if args.frozen and not all((DEV / path).is_file() for path in ("package-lock.json", "uv.lock")):
        raise SystemExit("Frozen setup requires both committed lock files")
    run("npm", "--prefix", str(DEV), "ci" if args.frozen else "install")
    run("uv", "sync", "--project", str(DEV), *(["--frozen"] if args.frozen else []))
    run("npm", "--prefix", str(DEV), "run", "check")
    run("uv", "run", "--project", str(DEV), "--frozen", "python", str(DEV / "check-runtime.py"))
    if args.with_browser:
        run("npm", "--prefix", str(DEV), "exec", "--", "playwright", "install", "--with-deps", "chromium")
        run("npm", "--prefix", str(DEV), "run", "browser")
    if args.with_db:
        run("docker", "compose", "-f", str(DEV / "compose.yaml"), "up", "-d", "--wait")
        print("Postgres ready on 127.0.0.1:54329. Use documented development connection for check-db.py.")
    print("Development tools checked. Product implementation was not started.")

if __name__ == "__main__":
    main()
