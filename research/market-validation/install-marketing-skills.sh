#!/usr/bin/env bash
# Stage and install selected MIT marketing skills, with all their reference files.
# Only from the pinned source revision, never overwriting an existing skill.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
src="$here/.cache/marketingskills"
sha="1efedbc5148b54b2f0f6c6c9fe0be62e151c7fff"
mkdir -p "$(dirname "$src")"
if [ ! -d "$src/.git" ]; then
  git clone --depth 1 https://github.com/coreyhaines31/marketingskills.git "$src"
fi
if [ "$(git -C "$src" rev-parse HEAD)" != "$sha" ]; then
  git -C "$src" fetch --depth 1 origin "$sha"
  git -C "$src" checkout --detach "$sha"
fi
test "$(git -C "$src" rev-parse HEAD)" = "$sha"
test -f "$src/LICENSE"
for skill in customer-research product-marketing ab-testing marketing-plan; do
  target="$repo/.agents/skills/$skill"
  if [ -e "$target" ]; then
    echo "Existing $target; review before updating; no overwrite"
  else
    mkdir -p "$repo/.agents/skills"
    cp -R "$src/skills/$skill" "$target"
    echo "Installed pinned MIT marketing skill: $skill"
  fi
done
echo "Review skill instructions and references before letting any model execute them."
