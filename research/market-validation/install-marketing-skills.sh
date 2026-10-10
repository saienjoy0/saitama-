#!/usr/bin/env bash
# Check and, only if absent, restore exact pinned MIT skills. No unpinned sources.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
pin="1efedbc5148b54b2f0f6c6c9fe0be62e151c7fff"
if python3 "$here/skill_router.py" audit; then
  echo "All pinned skills already installed and verified; no network needed."
  exit 0
fi
echo "Pinned source checkout is needed; existing files will NEVER be overwritten." >&2
src="$here/.cache/marketingskills"
mkdir -p "$(dirname "$src")"
if [ ! -d "$src/.git" ]; then
  git clone --filter=blob:none https://github.com/coreyhaines31/marketingskills.git "$src"
fi
git -C "$src" fetch origin "$pin"
git -C "$src" checkout --detach "$pin"
test "$(git -C "$src" rev-parse HEAD)" = "$pin"
test -f "$src/LICENSE"
for skill in customer-research competitor-profiling competitors product-marketing pricing ab-testing analytics marketing-plan onboarding churn-prevention cro offers; do
  dest="$repo/.agents/skills/$skill"
  if [ -e "$dest" ]; then
    echo "Preserving existing $dest; verify and resolve mismatches manually."
  else
    cp -R "$src/skills/$skill" "$dest"
    echo "Restored $skill"
  fi
done
python3 "$here/skill_router.py" audit
