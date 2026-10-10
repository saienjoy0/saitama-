"""Pure offline regression tests. No model call, network, customer information or paid action."""
import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("market_validation_harness", ROOT / "harness.py")
h = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(h)


class HarnessTests(unittest.TestCase):
    def test_16_combinations(self):
        pairs = h.expected_pairs()
        self.assertEqual(len(pairs), 16)
        self.assertIn(("P2", "S2"), pairs)
        self.assertIn(("P4", "S4"), pairs)

    def test_unverified_missing_result_does_not_pass(self):
        errors = h.verify_result({"round": 1, "status": "COMPLETE", "cells": []}, 1)
        self.assertTrue(errors)
        self.assertTrue(any("16" in issue for issue in errors))

    def test_valid_structure_and_missing_evidence_blocked(self):
        c = h.config()
        cells = [
            dict(profile_id=p["id"], message_id=s["id"], buyer="親",
                 trigger="未検証", closest_substitute="口頭相談",
                 likely_objection="必要性不明", retention_test="自発的な2回目",
                 evidence_level="SYNTHETIC")
            for p in c["household_profiles"]
            for s in c["sales_messages"]
        ]
        payload = dict(round=1, status="NEEDS_REAL_CUSTOMERS", evidence_delta=[],
                       sources=[], cells=cells, critical_objections=[],
                       recommendation="面談が必要", real_customer_tests=[],
                       stop_reason="new first-party data required")
        self.assertEqual(h.verify_result(payload, 1), [])
        payload["status"] = "COMPLETE"
        self.assertTrue(h.verify_result(payload, 1))

    def test_missing_profile_or_duplicate_pair_rejected(self):
        c = h.config()
        cells = [
            dict(profile_id=p["id"], message_id=s["id"], buyer="親",
                 trigger="x", closest_substitute="口頭相談", likely_objection="x",
                 retention_test="x", evidence_level="SYNTHETIC")
            for p in c["household_profiles"]
            for s in c["sales_messages"]
        ]
        cells[1] = cells[0]
        payload = dict(round=1, status="NEEDS_REAL_CUSTOMERS", evidence_delta=[],
                       sources=[], cells=cells, critical_objections=[],
                       recommendation="test", real_customer_tests=[], stop_reason="test")
        self.assertTrue(h.verify_result(payload, 1))

    def test_prompt_includes_source_anchors_and_write_contract(self):
        prompt = h.build_prompt(1)
        self.assertIn("20261009", prompt)
        self.assertIn("R/O/F/B", prompt)
        self.assertIn("RESULT.json", prompt)
        self.assertIn("P4×S4", prompt)

    def test_pinned_pre_release_is_explicit(self):
        c = h.config()
        self.assertEqual(h.DSH, "@deepseek-ai/dsh@" + c["harness"]["version"])
        self.assertEqual(c["guardrails"]["max_rounds"], 3)


if __name__ == "__main__":
    unittest.main()
