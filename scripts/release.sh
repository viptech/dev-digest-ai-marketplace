#!/usr/bin/env bash
# release.sh — tag-and-push wrapper for one plugin release in this
# marketplace repo, enforcing the dependency-order invariant before it ever
# touches git.
#
# Usage:
#   ./scripts/release.sh <plugin-name>
#
# The plugin's version is NOT a script argument — it is read from that
# plugin's own plugins/<name>/.claude-plugin/plugin.json, matching how
# `claude plugin tag` itself derives the <plugin>--v<version> tag name.
#
# Behavior (architecture.md:401-408, 541-545):
#   1. Resolve plugins/<name>/.claude-plugin/plugin.json; read its version
#      and dependencies array.
#   2. For each declared dependency, verify an existing "<dep>--v*" git tag
#      satisfies the dependency's declared semver range (e.g. "^1.0.0") —
#      a real range check, not a presence-only check. Refuses to tag a
#      consumer before its dependencies (dependencies release first,
#      consumer last, always).
#   3. Print the target plugin's CHANGELOG.md latest entry for human
#      pre-tag review.
#   4. Print `git status --short` and the current HEAD SHA.
#   5. Run `claude plugin tag --dry-run` and print its output.
#   6. Prompt for explicit interactive confirmation before running
#      `claude plugin tag --push`. Never pushes non-interactively.
#
# This script never passes --force to `claude plugin tag`. That flag exists
# for a human to invoke directly when they explicitly intend to override the
# dirty-tree/tag-exists checks — it is never a default here. Tags are
# immutable once pushed (architecture.md:546-548): if a tag for this
# plugin's target version already exists, `claude plugin tag` itself is
# expected to refuse, and this script does not work around that.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

usage() {
  echo "Usage: $0 <plugin-name>" >&2
  exit 1
}

[[ $# -eq 1 ]] || usage
PLUGIN_NAME="$1"

command -v jq >/dev/null 2>&1 || { echo "release.sh: jq is required but not installed" >&2; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "release.sh: claude CLI is required but not installed" >&2; exit 1; }

PLUGIN_DIR="plugins/${PLUGIN_NAME}"
MANIFEST="${PLUGIN_DIR}/.claude-plugin/plugin.json"

[[ -f "$MANIFEST" ]] || { echo "release.sh: no manifest at ${MANIFEST}" >&2; exit 1; }

VERSION="$(jq -r '.version' "$MANIFEST")"
[[ -n "$VERSION" && "$VERSION" != "null" ]] || {
  echo "release.sh: ${MANIFEST} has no .version" >&2
  exit 1
}

TARGET_TAG="${PLUGIN_NAME}--v${VERSION}"

# --- semver-range check (only supports the "^x.y.z" caret range this repo's
# own plugin.json files use; extend here if a different range operator is
# ever declared) -------------------------------------------------------------

version_satisfies_caret() {
  # $1 = candidate version (x.y.z), $2 = declared range (^x.y.z)
  local candidate="$1" range="$2"
  local floor="${range#^}"

  [[ "$floor" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]] || {
    echo "release.sh: unsupported dependency range '${range}' (only ^x.y.z is supported)" >&2
    return 1
  }
  local floor_major="${BASH_REMATCH[1]}" floor_minor="${BASH_REMATCH[2]}" floor_patch="${BASH_REMATCH[3]}"

  [[ "$candidate" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]] || return 1
  local c_major="${BASH_REMATCH[1]}" c_minor="${BASH_REMATCH[2]}" c_patch="${BASH_REMATCH[3]}"

  # Caret range: same major, and candidate >= floor.
  [[ "$c_major" -eq "$floor_major" ]] || return 1

  if [[ "$c_minor" -gt "$floor_minor" ]]; then
    return 0
  elif [[ "$c_minor" -eq "$floor_minor" ]]; then
    [[ "$c_patch" -ge "$floor_patch" ]] && return 0 || return 1
  else
    return 1
  fi
}

echo "== Step 1/6: dependency-order guard =="
DEP_COUNT="$(jq -r '(.dependencies // []) | length' "$MANIFEST")"

if [[ "$DEP_COUNT" -eq 0 ]]; then
  echo "  ${PLUGIN_NAME} declares no dependencies."
else
  for i in $(seq 0 $((DEP_COUNT - 1))); do
    DEP_NAME="$(jq -r ".dependencies[$i].name" "$MANIFEST")"
    DEP_RANGE="$(jq -r ".dependencies[$i].version" "$MANIFEST")"

    # Portable to bash 3.2 (macOS's default /bin/bash has no `mapfile`
    # builtin — that's bash-4+ only) — read into an array line by line
    # instead.
    DEP_TAGS=()
    while IFS= read -r line; do
      [[ -n "$line" ]] && DEP_TAGS+=("$line")
    done < <(git tag -l "${DEP_NAME}--v*")

    if [[ "${#DEP_TAGS[@]}" -eq 0 ]]; then
      echo "release.sh: dependency '${DEP_NAME}' (needs ${DEP_RANGE}) has no tags yet — tag it first." >&2
      exit 1
    fi

    SATISFIED=0
    for tag in "${DEP_TAGS[@]}"; do
      dep_version="${tag#${DEP_NAME}--v}"
      if version_satisfies_caret "$dep_version" "$DEP_RANGE"; then
        SATISFIED=1
        echo "  OK: ${DEP_NAME}@${dep_version} satisfies ${DEP_RANGE} (tag ${tag})"
        break
      fi
    done

    if [[ "$SATISFIED" -ne 1 ]]; then
      echo "release.sh: no existing '${DEP_NAME}--v*' tag satisfies declared range '${DEP_RANGE}' — refusing to tag ${PLUGIN_NAME} before its dependency." >&2
      exit 1
    fi
  done
fi

echo
echo "== Step 2/6: CHANGELOG.md — latest entry for review =="
CHANGELOG="${PLUGIN_DIR}/CHANGELOG.md"
if [[ -f "$CHANGELOG" ]]; then
  awk '/^## /{n++} n==1{print} n==2{exit}' "$CHANGELOG"
else
  echo "  (no CHANGELOG.md found at ${CHANGELOG})"
fi

echo
echo "== Step 3/6: working tree + HEAD =="
git status --short
echo "HEAD: $(git rev-parse HEAD)"

echo
echo "== Step 4/6: claude plugin tag --dry-run =="
claude plugin tag --dry-run "./${PLUGIN_DIR}"

echo
echo "== Step 5/6: confirm =="
read -r -p "Push tag ${TARGET_TAG}? [y/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[yY]([eE][sS])?$ ]]; then
  echo "Aborted — no tag pushed."
  exit 1
fi

echo
echo "== Step 6/6: claude plugin tag --push =="
claude plugin tag --push "./${PLUGIN_DIR}"
