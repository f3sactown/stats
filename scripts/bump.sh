#!/usr/bin/env bash
# Bump the build number (always) and optionally the version.
#   scripts/bump.sh               -> build +1, version unchanged
#   scripts/bump.sh patch|minor|major -> build +1 and version bumped
# Updates VERSION, BUILD and the constants in index.html, and adds a
# CHANGELOG heading for the new build that you fill in.
set -euo pipefail
cd "$(dirname "$0")/.."

ver=$(tr -d '[:space:]' < VERSION)
build=$(( $(tr -d '[:space:]' < BUILD) + 1 ))
IFS=. read -r major minor patch <<< "$ver"
case "${1:-}" in
  major) major=$((major+1)); minor=0; patch=0 ;;
  minor) minor=$((minor+1)); patch=0 ;;
  patch) patch=$((patch+1)) ;;
  "") ;;
  *) echo "usage: $0 [patch|minor|major]" >&2; exit 1 ;;
esac
ver="$major.$minor.$patch"

echo "$ver" > VERSION
echo "$build" > BUILD
sed -i.bak -E "s/^const APP_VERSION = \"[^\"]*\";/const APP_VERSION = \"$ver\";/; s/^const APP_BUILD = [0-9]+;/const APP_BUILD = $build;/" index.html
rm -f index.html.bak

today=$(date +%Y-%m-%d)
tmp=$(mktemp)
awk -v h="## v$ver (build $build) - $today" 'NR==1{print; print ""; print h; print ""; print "- "; next} {print}' CHANGELOG.md > "$tmp"
mv "$tmp" CHANGELOG.md

echo "Now v$ver, build $build. Fill in the new CHANGELOG entry, then commit."
