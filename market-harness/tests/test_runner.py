"""Offline test suite: never launches a model or accesses private customer data."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("market_runner", ROOT / "runner.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)

class ValidationHarnessTests(unittest.TestCase):
    def test_four_by_four_matrix(self):
        cfg = runner.load_config()
        rows = runner.make_matrix(cfg)
        self.assertEqual(len(rows), 16)
        self.assertEqual(len({x["cell_id"] for x in rows}), 16)
        self.assertTrue(all(x["status"] == "NOT_VALIDATED" for x in rows))
        self.assertEqual(sum(cfg["recruitment"]["groups"].values()), 10)

    def test_prompt_marks_simulations_as_unverified(self):
        c = runner.load_config()
        text = runner.prompt_for(c["icps"][0], c["offers"][0], "PUBLIC EVIDENCE")
        self.assertIn("実在する顧客を演じない", text)
        self.assertIn("PUBLIC EVIDENCE", text)
        self.assertIn("980円", text)
        self.assertIn("LINE", text)

    def test_prepare_without_dsh(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "repo"
            root.mkdir()
            (root / "AGENTS.md").write_text("local test", encoding="utf-8")
            out = Path(tmp) / "run"
            run, state = runner.prepare(root, out)
            self.assertEqual(state["phase"], "PREPARED_NO_LIVE_MODEL")
            self.assertEqual(len(list((run / "prompts").glob("*.md"))), 16)
            self.assertEqual(len((run / "matrix.csv").read_text(encoding="utf-8").splitlines()), 17)
            with self.assertRaises(FileExistsError):
                runner.prepare(root, out)
            with patch.object(runner.shutil, "which", return_value=None):
                status = runner.execute(run, runner.load_config(), 4, 1)
            self.assertEqual(status, 2)
            self.assertEqual(json.loads((run / "state.json").read_text())["phase"],
                             "BLOCKED_DSH_CLI_UNAVAILABLE")

    def test_invalid_budget_before_model(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "repo"
            root.mkdir()
            with self.assertRaises(ValueError):
                runner.audit_sources(root, {"sources": [{"path": "../escape"}]})
            run, _ = runner.prepare(root, Path(tmp) / "run")
            with self.assertRaises(ValueError):
                runner.execute(run, runner.load_config(), 16, 2)

if __name__ == "__main__":
    unittest.main()
