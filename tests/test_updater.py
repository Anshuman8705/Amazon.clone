import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import apply_update as updater
from patches import one, between

class UpdaterTests(unittest.TestCase):
    def fixture(self, base):
        root = base / 'project'
        root.mkdir()
        (root / 'package.json').write_text('{}')
        (root / 'test.js').write_bytes(b'const value = 1;\n')
        package = base / 'update'
        (package / 'files').mkdir(parents=True)
        (package / 'files' / 'test.js').write_bytes(b'const value = 2;\n')
        return root, package

    def test_missing_anchor_refuses(self):
        with self.assertRaises(ValueError): one('abc', 'missing', 'new')

    def test_ambiguous_anchor_refuses(self):
        with self.assertRaises(ValueError): one('x x', 'x', 'new')

    def test_unique_anchor_changes_once(self):
        self.assertEqual(one('before old after', 'old', 'new'), 'before new after')

    def test_section_keeps_boundary_and_tail(self):
        self.assertEqual(between('start OLD stop tail', 'start', 'stop', 'new '), 'new stop tail')

    def test_conflicting_source_leaves_disk_unchanged(self):
        with tempfile.TemporaryDirectory() as directory:
            root, package = self.fixture(Path(directory))
            before = (root / 'test.js').read_bytes()
            with patch.object(updater, 'EXPECTED', {'test.js': '0'*40}), patch.object(updater, 'PACKAGE', package):
                with self.assertRaises(ValueError): updater.plan_update(root)
            self.assertEqual((root / 'test.js').read_bytes(), before)

    def test_plan_only_never_writes(self):
        with tempfile.TemporaryDirectory() as directory:
            root, package = self.fixture(Path(directory))
            before = (root / 'test.js').read_bytes()
            with patch.object(updater, 'EXPECTED', {'test.js': updater.blob_sha(before)}), patch.object(updater, 'PACKAGE', package):
                result = updater.plan_update(root)
            self.assertEqual(result['test.js'][1], b'const value = 2;\n')
            self.assertEqual((root / 'test.js').read_bytes(), before)

    def test_windows_line_endings_match_git_source(self):
        with tempfile.TemporaryDirectory() as directory:
            root, package = self.fixture(Path(directory))
            expected = updater.blob_sha((root / 'test.js').read_bytes())
            (root / 'test.js').write_bytes(b'const value = 1;\r\n')
            with patch.object(updater, 'EXPECTED', {'test.js': expected}), patch.object(updater, 'PACKAGE', package):
                result = updater.plan_update(root)
            self.assertEqual(result['test.js'][0], b'const value = 1;\r\n')

    def test_new_file_collision_refuses(self):
        with tempfile.TemporaryDirectory() as directory:
            root, package = self.fixture(Path(directory))
            expected = updater.blob_sha((root / 'test.js').read_bytes())
            (package / 'files' / 'new.js').write_text('new')
            (root / 'new.js').write_text('user work')
            with patch.object(updater, 'EXPECTED', {'test.js': expected}), patch.object(updater, 'PACKAGE', package):
                with self.assertRaises(ValueError): updater.plan_update(root)
            self.assertEqual((root / 'new.js').read_text(), 'user work')

if __name__ == '__main__': unittest.main()
