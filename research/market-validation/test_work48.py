"""Tests the 48-ROUND checkpoint engine only. No actual Work model is run.

Synthetic local JSON proves the controller can resume and account for 48 files.
It does NOT demonstrate that ChatGPT Work will execute 48 real research rounds.
"""
from __future__ import annotations
import importlib.util
import json
import pathlib
import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("work48", ROOT / "work48.py")
w = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(w)


def fixture_round(number, status="REVIEWED"):
    task = w.packet(number)
    return dict(
        round=number,
        stage=task["stage"],
        title=task["title"],
        status=status,
        model="ChatGPT Work",
        is_real_customer_experiment=False,
        finding="Test fixture only: this is not new market evidence.",
        contrary_view="Existing conversations and free financial education may be enough.",
        decision_update="Leave the business hypothesis unconfirmed; require real customer tests.",
        next_real_world_test="Observe a parent trying the service and compare to a paper form.",
        remaining_uncertainty="No real paid renewals or self-initiated child second session.",
        sources=[{"reference":"research/GAKUSTA_初期ターゲット_家庭ルールと対話可能性_行動ベース定義_20261009.md",
                  "claim":"Repository contains the Oct 9 provisional ICP"}] if status == "REVIEWED" else [],
        evidence_status="REPOSITORY_DESIGN" if status == "REVIEWED" else "UNVERIFIED",
        new_customer_evidence=False,
    )


class Work48Tests(unittest.TestCase):
    def test_48_plan_is_distinct_with_eight_stages(self):
        p = w.plan()
        self.assertEqual(len(p["rounds"]), 48)
        self.assertEqual({x["stage"] for x in p["rounds"]},
                         {"SOURCE_AUDIT","CUSTOMER_JOBS","FREE_SUBSTITUTES",
                          "MESSAGING_CHANNELS","FIRST_USE","RETENTION",
                          "MONEY_AND_RISK","DECISION_AND_HANDOFF"})
        self.assertEqual([x["round"] for x in p["rounds"]], list(range(1,49)))

    def test_work_not_invoked_or_model_api_required(self):
        src = (ROOT / "work48.py").read_text(encoding="utf-8")
        self.assertNotIn("subprocess.run", src)
        self.assertNotIn("DEEPSEEK_API_KEY", src)
        self.assertNotIn("OPENAI_API_KEY", src)
        self.assertIn("ChatGPT Work", src)

    def test_rejects_fake_sales_and_fake_work(self):
        x = fixture_round(1)
        self.assertEqual(w.validate_result(x, 1), [])
        x["claimed_purchase_rate"] = 25
        self.assertTrue(w.validate_result(x, 1))
        x.pop("claimed_purchase_rate")
        x["model"] = "DeepSeek"
        self.assertTrue(w.validate_result(x, 1))
        x["model"] = "ChatGPT Work"
        x["sources"] = []
        self.assertTrue(w.validate_result(x, 1))

    def test_48_rounds_can_advance_with_synthetic_local_files(self):
        with tempfile.TemporaryDirectory() as d:
            p = pathlib.Path(d)
            with patch.object(w, "STATE_FILE", p/"state.json"), patch.object(w, "RESULTS", p/"results"):
                w.atomic_write(w.STATE_FILE, w.initial_state())
                for i in range(1, 49):
                    self.assertEqual(w.state()["next_round"], i)
                    with redirect_stdout(StringIO()):
                        self.assertEqual(w.next_round(), 0)
                    w.atomic_write(w.RESULTS/f"round-{i:03d}.json", fixture_round(i))
                    with redirect_stdout(StringIO()):
                        self.assertEqual(w.advance(), 0)
                s = w.state()
                self.assertEqual(s["next_round"], 49)
                self.assertEqual(s["reviewed"], list(range(1,49)))
                self.assertEqual(s["blocked"], [])
                self.assertTrue(s["halted"])
                self.assertIn("NOT proof", s["halt_reason"])
                self.assertEqual(len(list(w.RESULTS.glob("round-*.json"))),48)

    def test_missing_round_prevents_fake_increment(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d)
            with patch.object(w, "STATE_FILE",p/"state.json"),patch.object(w,"RESULTS",p/"results"):
                w.atomic_write(w.STATE_FILE,w.initial_state())
                with redirect_stdout(StringIO()):
                    self.assertEqual(w.advance(),2)
                self.assertEqual(w.state()["next_round"],1)

    def test_six_unverified_rounds_stop_model_spin(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d)
            with patch.object(w,"STATE_FILE",p/"state.json"),patch.object(w,"RESULTS",p/"results"):
                w.atomic_write(w.STATE_FILE,w.initial_state())
                for i in range(1,7):
                    w.atomic_write(w.RESULTS/f"round-{i:03d}.json",fixture_round(i,"BLOCKED_NO_SOURCE"))
                    with redirect_stdout(StringIO()):
                        self.assertEqual(w.advance(),0)
                s=w.state()
                self.assertTrue(s["halted"])
                self.assertEqual(s["blocked"],[1,2,3,4,5,6])
                self.assertEqual(s["next_round"],7)
                with redirect_stdout(StringIO()):
                    self.assertEqual(w.next_round(),3)

if __name__=="__main__":
    unittest.main()
