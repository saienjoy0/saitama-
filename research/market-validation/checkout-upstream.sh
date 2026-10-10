#!/usr/bin/env bash
# Fetch the exact official DeepSeek Harness source, preserving upstream history and MIT license.
# It is NOT committed as product code. Review security notice before running untrusted updates.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
target="$here/.cache/deepseek-harness"
sha="639ed015397290b3745d163aafe02ffee4aa3f84"
tag="dsh-v0.2.0-rc.2"
if [ -d "$target/.git" ]; then
  actual="$(git -C "$target" rev-parse HEAD)"
  if [ "$actual" != "$sha" ]; then
    echo "Source checkout moved from pinned version; refusing to overwrite: $actual" >&2
    exit 2
  fi
  echo "Verified existing official source checkout: $actual"
  exit 0
fi
mkdir -p "$(dirname "$target")"
git clone --depth 1 --branch "$tag" https://github.com/deepseek-ai/deepseek-harness.git "$target"
actual="$(git -C "$target" rev-parse HEAD)"
if [ "$actual" != "$sha" ]; then
  echo "Release SHA mismatch ($actual instead of $sha). Do not execute source." >&2
  exit 2
fi
test -f "$target/LICENSE"
echo "Pinned official source present with MIT license: $target ($actual)"
