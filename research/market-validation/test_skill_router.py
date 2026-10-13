"""Pinned vendor integrity and Work48 routing tests, no model API."""
import importlib.util
import json
from pathlib import Path
from copy import deepcopy
import tempfile
import unittest

DIR=Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location("skill_router",DIR/"skill_router.py")
mod=importlib.util.module_from_spec(sp)
sp.loader.exec_module(mod)


class SkillTests(unittest.TestCase):
    def test_all_vendored_skill_files_match_pinned_commit(self):
        self.assertEqual(mod.audit(),[])

    def test_every_round_routes_to_real_skills(self):
        reg=mod.load_registry()
        plan=json.loads((DIR/"work48_plan.json").read_text(encoding="utf-8"))
        names=set(reg["selected"])
        self.assertEqual(len(plan["rounds"]),48)
        self.assertEqual(len(set(r["stage"] for r in plan["rounds"])),8)
        for i in range(1,49):
            route=mod.route(i,reg,plan)
            self.assertGreater(len(route["ordered_skills"]),0)
            for path in route["ordered_skills"]:
                self.assertTrue((mod.ROOT/path).is_file())
                self.assertIn(Path(path).parent.name,names)
        covered={Path(p).parent.name for i in range(1,49) for p in mod.route(i,reg,plan)["ordered_skills"]}
        self.assertEqual(covered,names)

    def test_git_blob_hash_matches_git_format(self):
        self.assertEqual(mod.git_blob_sha(b"test content\n"),"d670460b4b4aece5915caf5c68d12f560a9fe3e4")

    def test_detects_modified_third_party_copy(self):
        reg=mod.load_registry()
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            sample=reg["pinned_files"][0]
            target=root/sample["path"]
            target.parent.mkdir(parents=True)
            target.write_text("Tampered")
            issues=mod.audit(reg,root)
            self.assertTrue(any("Source mismatch" in x for x in issues))
            self.assertTrue(any("Missing " in x for x in issues))


if __name__=="__main__":
    unittest.main()
