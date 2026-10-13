"""Offline arithmetic checks. Passing tests does not imply market demand."""
import importlib.util
import json
from pathlib import Path
from copy import deepcopy
import unittest

ROOT=Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location("simulation",ROOT/"simulate.py")
sim=importlib.util.module_from_spec(sp)
sp.loader.exec_module(sim)


class SimulationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc=json.loads((ROOT/"simulation"/"assumptions.example.json").read_text(encoding="utf-8"))

    def test_hypothetical_only(self):
        r=sim.run(self.doc)
        self.assertTrue(r["not_a_forecast"])
        self.assertEqual(r["observed_customer_count"],0)
        self.assertEqual(len(r["scenarios"]),3)
        self.assertEqual(len(r["sensitivity"]),27)

    def test_hand_calculated_funnel(self):
        s=deepcopy(self.doc["scenarios"][0])
        s.update(reached_households=100,cost_per_reached_household_jpy=1,
            application_rate=.5,trial_start_rate=.5,unprompted_second_use_rate=.5,
            paid_conversion_given_second_use_rate=.5,price_jpy=100,
            payment_percent_fee=.1,period_ai_cost_jpy=10,period_storage_cost_jpy=0,
            period_human_support_cost_jpy=0,trial_setup_cost_jpy=2,
            fixed_project_cost_jpy=10,horizon_periods=1,renewal_probability=0)
        r=sim.evaluate(s)
        self.assertEqual(r["expected_first_purchases"],6.25)
        self.assertEqual(r["per_period_contribution_jpy"],80)
        self.assertEqual(r["horizon_net_contribution_jpy"],340)
        self.assertEqual(r["cac_jpy"],24)

    def test_zero_purchases(self):
        s=deepcopy(self.doc["scenarios"][0])
        s["paid_conversion_given_second_use_rate"]=0
        r=sim.evaluate(s)
        self.assertIsNone(r["cac_jpy"])
        self.assertLess(r["horizon_net_contribution_jpy"],0)

    def test_one_off_and_fabricated_evidence_rejected(self):
        d=deepcopy(self.doc)
        d["scenarios"][2]["renewal_probability"]=0.5
        with self.assertRaises(ValueError): sim.validate(d)
        d=deepcopy(self.doc)
        d["observed_customers"]=4
        with self.assertRaises(ValueError): sim.validate(d)

    def test_negative_cost_nan_rate_rejected(self):
        d=deepcopy(self.doc)
        d["scenarios"][0]["period_ai_cost_jpy"]=-1
        with self.assertRaises(ValueError): sim.validate(d)
        d=deepcopy(self.doc)
        d["scenarios"][0]["application_rate"]=float("nan")
        with self.assertRaises(ValueError): sim.validate(d)

    def test_monotonic_when_positive_margin(self):
        s=deepcopy(self.doc["scenarios"][1])
        self.assertGreaterEqual(sim.evaluate(s,1.5,1.5)["horizon_net_contribution_jpy"],
                                sim.evaluate(s,.5,.5)["horizon_net_contribution_jpy"])


if __name__=="__main__":
    unittest.main()
