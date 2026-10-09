#!/usr/bin/env python3
"""Export public dependency lock files into CI logs for connector retrieval."""
import base64
from pathlib import Path
root = Path(__file__).resolve().parents[1] / "tools" / "development"
for name in ("package-lock.json", "uv.lock"):
    encoded = base64.b64encode((root / name).read_bytes()).decode()
    chunks = [encoded[i:i+10000] for i in range(0, len(encoded), 10000)]
    for index, chunk in enumerate(chunks, 1):
        print(f"YATTEMI_LOCK|{name}|{index}/{len(chunks)}|{chunk}")
