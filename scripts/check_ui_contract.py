#!/usr/bin/env python3
"""Check the shared design contract, not rendered product accessibility."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def luminance(hex_value):
    channels = [int(hex_value[i:i+2], 16) / 255 for i in (1, 3, 5)]
    channels = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels]
    return sum(c * weight for c, weight in zip(channels, (.2126, .7152, .0722)))
def contrast(a, b):
    high, low = sorted((luminance(a), luminance(b)), reverse=True)
    return (high + .05) / (low + .05)
def check():
    ui = json.loads((ROOT / "docs/design/ui-system.json").read_text())
    assert ui["primaryActionsPerView"] == 1
    assert ui["roles"]["child"]["bodyMinPx"] >= 16
    assert ui["roles"]["parent"]["bodyMinPx"] >= 16
    assert ui["roles"]["grandparent"]["bodyMinPx"] >= 20
    assert all(role["touchMinPx"] >= 48 for role in ui["roles"].values())
    assert ui["roles"]["grandparent"]["primaryTouchMinPx"] >= 56
    assert ui["motion"]["reduceWhen"] == "os_reduced_motion OR profile_reduced_motion"
    assert ui["motion"]["successRequires"] == "server_ack"
    assert len(set(ui["units"].values())) == 3
    assert 320 in ui["viewportsPx"] and 200 in ui["textScalePercent"]
    assert "saved" in ui["states"]["record"] and "published" in ui["states"]["share"]
    states = [state for values in ui["states"].values() for state in values]
    assert len(states) == len(set(states)) and all(state in ui["labels"] for state in states)
    for foreground, background in (("text","canvas"),("text","surface"),("onPrimary","primary"),("warning","canvas"),("danger","canvas")):
        value = contrast(ui["colors"][foreground], ui["colors"][background])
        assert value >= ui["contrast"]["normalTextMin"], (foreground, background, value)
    print("PASS: UI design values, role sizes, independent statuses, units and five text contrast pairs")
    print("NOT VERIFIED: product rendering, screen reader, real devices, user understanding")
if __name__ == "__main__":
    check()
