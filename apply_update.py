#!/usr/bin/env python3
"""Apply reviewed source changes only. Never copy, delete or migrate database files."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import time
from patches import EXPECTED, transform

PACKAGE = Path(__file__).resolve().parent

def blob_sha(data: bytes) -> str:
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def plan_update(root: Path):
    if not (root / 'package.json').is_file():
        raise ValueError('Select the NimbusMart repository folder containing package.json, src and server.')
    plan = {}
    for name, expected in EXPECTED.items():
        path = root / name
        if not path.resolve().is_relative_to(root):
            raise ValueError(f'Source path escapes the project folder: {name}')
        if path.is_symlink() or not path.is_file():
            raise ValueError(f'Missing source file or symbolic link not permitted: {name}')
        raw = path.read_bytes()
        normalized = raw.replace(b'\r\n', b'\n')
        if blob_sha(normalized) != expected and blob_sha(raw) != expected:
            raise ValueError(f'{name} differs from the reviewed source. No files were written. Merge this file manually; the updater will not overwrite newer work.')
        replacement = PACKAGE / 'files' / name
        output = replacement.read_bytes() if replacement.is_file() else transform(name, normalized.decode('utf-8')).encode('utf-8')
        plan[name] = (raw, output)
    for path in sorted((PACKAGE / 'files').rglob('*')):
        if not path.is_file():
            continue
        name = path.relative_to(PACKAGE / 'files').as_posix()
        if name in plan:
            continue
        target = root / name
        if not target.resolve().is_relative_to(root):
            raise ValueError(f'Destination path escapes the project folder: {name}')
        if target.exists() or target.is_symlink():
            raise ValueError(f'New-file conflict: {name}. No files were written.')
        plan[name] = (None, path.read_bytes())
    return plan

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('project', type=Path, help='Existing NimbusMart repository folder')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--apply', action='store_true', help='Back up source files and apply the update')
    mode.add_argument('--check', action='store_true', help='Check compatibility only (the default)')
    args = parser.parse_args()
    root = args.project.expanduser().resolve()
    try:
        marker = root / '.nimbus-india-update.json'
        if marker.exists():
            raise ValueError('This folder already has an update receipt. Do not apply the patch twice.')
        plan = plan_update(root)
        print(f'Preflight passed: {len(plan)} source files. Database files are excluded.')
        if not args.apply:
            print('No changes made. Run again with --apply to write the reviewed changes.')
            return 0
        backup = root / '.nimbus-update-backups' / time.strftime('%Y%m%d-%H%M%S')
        backup.mkdir(parents=True, exist_ok=False)
        for name, (before, _) in plan.items():
            if before is not None:
                destination = backup / name
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(before)
        written = []
        try:
            for name, (_, output) in plan.items():
                destination = root / name
                destination.parent.mkdir(parents=True, exist_ok=True)
                temporary = destination.with_name(destination.name + '.nimbus-tmp')
                temporary.write_bytes(output)
                os.replace(temporary, destination)
                written.append(name)
            receipt = {'version': 'india-localisation-review-1', 'baseCommit': 'feaa8bee544ec952849cccbacda19f0c85669f8f',
                       'backup': str(backup), 'createdFiles': [n for n, (b, _) in plan.items() if b is None],
                       'writtenSha256': {n: sha256(out) for n, (_, out) in plan.items()}}
            marker.write_text(json.dumps(receipt, indent=2), encoding='utf-8')
            (backup / 'receipt.json').write_text(json.dumps(receipt, indent=2), encoding='utf-8')
        except Exception:
            for name in reversed(written):
                destination = root / name
                before = plan[name][0]
                if before is None:
                    destination.unlink(missing_ok=True)
                else:
                    destination.write_bytes(before)
            marker.unlink(missing_ok=True)
            raise
        print(f'Applied source update. Backup: {backup}')
        print('Use a NEW INR database. Do not point DB_PATH at an existing USD database.')
        print('No push, deployment, database migration or paid service activation was performed.')
        return 0
    except (OSError, ValueError, UnicodeError) as error:
        print(f'Update stopped: {error}', file=sys.stderr)
        return 1

if __name__ == '__main__':
    raise SystemExit(main())
