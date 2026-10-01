"""Test stale navigation, authority boundaries and source failures on temp copies."""
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from check_design_handoff import check
from render_current import INPUTS, ROOT, render


class NavigationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "repo"
        shutil.copytree(ROOT, self.root, ignore=shutil.ignore_patterns(".git", "__pycache__"))

    def edit_json(self, path, edit):
        target = self.root / path
        value = json.loads(target.read_text())
        edit(value)
        target.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")

    def test_render_is_deterministic_and_does_not_write_gate_or_task_sources(self):
        before = {path: (self.root / path).read_bytes() for path in INPUTS}
        self.assertEqual(render(self.root), render(self.root))
        self.assertEqual(before, {path: (self.root / path).read_bytes() for path in INPUTS})
        self.assertEqual([], check(self.root))

    def test_task_change_invalidates_current_until_regenerated(self):
        def finish_lp(value):
            next(t for t in value["tasks"] if t["id"] == "D66-LP")["status"] = "done"
        self.edit_json("current/TASKS.json", finish_lp)
        self.assertTrue(any("CURRENT.md differs" in error for error in check(self.root)))
        (self.root / "CURRENT.md").write_text(render(self.root))
        self.assertEqual([], check(self.root))
        gate = json.loads((self.root / "current/PROJECT_STATE.json").read_text())
        self.assertFalse(gate["implementation_allowed"])
        self.assertEqual("D90", gate["next_task_id"])

    def test_review_approval_cannot_be_opened_by_navigation(self):
        self.edit_json("current/PROJECT_STATE.json", lambda v: v.update(implementation_allowed=True))
        (self.root / "CURRENT.md").write_text(render(self.root))
        errors = check(self.root)
        self.assertIn("Implementation permitted too early", errors)
        self.assertIn("Missing approval flags", errors)
        self.assertIn("Missing approval evidence", errors)

    def test_unverified_project_authority_is_rejected(self):
        self.edit_json("current/WORKSTREAMS.json", lambda v: v.update(authority_mode="projects"))
        with self.assertRaisesRegex(ValueError, "Unsupported authority"):
            render(self.root)

    def test_unknown_task_and_missing_source_fail(self):
        self.edit_json("current/WORKSTREAMS.json", lambda v: v["workstreams"][0]["task_ids"].append("UNKNOWN"))
        with self.assertRaises(KeyError):
            render(self.root)
        (self.root / "current/WORKSTREAMS.json").write_bytes((ROOT / "current/WORKSTREAMS.json").read_bytes())
        self.edit_json("current/WORKSTREAMS.json", lambda v: v["workstreams"][0]["sources"].append("absent.md"))
        with self.assertRaisesRegex(ValueError, "Missing workstream source"):
            render(self.root)


if __name__ == "__main__":
    unittest.main()
