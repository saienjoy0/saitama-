"""API-free structural checks for the Work-native marketing research harness."""
import importlib.util
import io
import pathlib
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("market_validation_harness", ROOT / "harness.py")
h = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(h)


def cells():
    return [
        {
            "profile_id": p["id"], "message_id": s["id"],
            "buyer": "親か祖父母（要証明）",
            "trigger": "直近の家庭での未解決の出来事",
            "closest_substitute": "口頭相談",
            "likely_objection": "無料の方法で十分では？",
            "retention_test": "子の自発的な2回目",
            "evidence_level": "SYNTHETIC",
        }
        for p in h.config()["household_profiles"]
        for s in h.config()["sales_messages"]
    ]


def payload():
    return {
        "round": 1, "status": "NEEDS_REAL_CUSTOMERS",
        "evidence_delta": [], "sources": [],
        "cells": cells(), "critical_objections": [],
        "recommendation": "10家庭で検証",
        "real_customer_tests": [], "stop_reason": "No observed purchase behavior",
    }


class WorkHarnessTests(unittest.TestCase):
    def test_no_api_or_deepseek_model_dependency(self):
        config = h.config()
        self.assertEqual(config["harness"]["execution_surface"], "ChatGPT Work")
        self.assertFalse(config["harness"]["model_api_required"])
        self.assertFalse(config["harness"]["deepseek_model_used"])
        self.assertFalse(config["harness"]["deepseek_harness_runtime_executed"])
        with redirect_stdout(io.StringIO()) as out:
            self.assertEqual(h.doctor(), 0)
        self.assertTrue(h.config()["guardrails"]["no_model_api"])
        self.assertNotIn("DEEPSEEK_API_KEY", out.getvalue())
        self.assertNotIn("npx", out.getvalue())

    def test_exactly_16_cells(self):
        self.assertEqual(len(h.expected_pairs()), 16)
        self.assertIn(("P2", "S2"), h.expected_pairs())
        self.assertIn(("P4", "S4"), h.expected_pairs())

    def test_valid_needs_real_customers(self):
        self.assertEqual(h.verify_result(payload(), 1), [])

    def test_missing_or_duplicate_cell_fails(self):
        body = payload()
        body["cells"][1] = body["cells"][0]
        self.assertTrue(h.verify_result(body, 1))

    def test_unobserved_completed_sales_fails(self):
        body = payload()
        body["status"] = "COMPLETE"
        body["evidence_delta"] = ["unverified synthetic persona"];
        self.assertTrue(h.verify_result(body, 1))

    def test_observed_sales_not_invented(self):
        body = payload()
        body["observed_paid_conversions"] = 5
        self.assertTrue(h.verify_result(body, 1))

    def test_work_prompt_is_explicit(self):
        prompt = h.build_prompt(1)
        for text in ("ChatGPT Work", "16条件", "R/O/F/B", "P4×S4", "RESULT.json"):
            self.assertIn(text, prompt)
        self.assertNotIn("DEEPSEEK_API_KEY", prompt)
        self.assertNotIn("npx", prompt)

    def test_work_prepares_without_model_call(self):
        with tempfile.TemporaryDirectory() as d:
            folder = pathlib.Path(d)
            with patch.object(h, "STATE", folder / "state.json"), patch.object(h, "ROUNDS", folder / "rounds"):
                h.save(h.STATE, h.default_state())
                with redirect_stdout(io.StringIO()):
                    self.assertEqual(h.prepare(), 0)
                self.assertTrue((h.ROUNDS / "round-001" / "REQUEST.md").exists())
                self.assertEqual(h.state()["phase"], "HANDOFF_READY")
                with redirect_stdout(io.StringIO()):
                    self.assertEqual(h.verify(), 2)  # Work has not written RESULT yet.

    def test_api_runner_commands_absent(self):
        source = (ROOT / "harness.py").read_text(encoding="utf-8")
        self.assertNotIn("subprocess.run", source)
        self.assertNotIn("DEEPSEEK_API_KEY", source)
        self.assertIn('("doctor", "status", "prepare", "verify")', source)


if __name__ == "__main__":
    unittest.main()
