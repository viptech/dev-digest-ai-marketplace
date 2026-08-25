#!/usr/bin/env bash
# rollback.sh — prints (and, with --execute, runs) the real command
# sequence to pin a Claude Code install to a prior, already-tagged plugin
# release.
#
# There is no `claude plugin rollback` command — none exists — so this
# script never emits one. The real mechanism is: remove the current
# marketplace source, re-add it pinned to the target tag via the
# `<owner>/<repo>@<ref>` marketplace-source shorthand, then (re)install the
# plugin from that pinned source.
#
# IMPORTANT: this repo's own .claude-plugin/marketplace.json "name" field
# is fixed ("dev-digest-ai-marketplace") regardless of which git ref is
# checked out. Adding a second marketplace source that resolves to that
# same name silently OVERWRITES the first entry instead of erroring
# (confirmed Claude Code bug, anthropics/claude-code#44042) — so `remove`
# before `add` is mandatory here, never `add` alongside the existing
# source.
#
# Usage:
#   ./scripts/rollback.sh <plugin-name> <tag> [--scope project|user|local] [--execute]
#
# Without --execute (the default), this only prints the command sequence —
# it changes nothing. With --execute, it runs the three commands in order,
# stopping immediately if any one fails, printing each command's real
# output.

set -euo pipefail

# Resolve the marketplace repo's own root from this script's location, not
# from the caller's CWD — this script is designed to be invoked from a
# *consumer* project's directory (e.g. plugin-install-target), where
# `claude plugin marketplace/install` need to run, so `git
# rev-parse --show-toplevel` (CWD-dependent) would resolve to the wrong
# repo's tags/manifest if the caller isn't sitting inside this checkout.
# Deliberately does NOT `cd` here — the claude plugin commands below must
# run in the caller's original CWD (the consumer project), not this repo.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MARKETPLACE_REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  echo "Usage: $0 <plugin-name> <tag> [--scope project|user|local] [--execute]" >&2
  exit 1
}

[[ $# -ge 2 ]] || usage

PLUGIN_NAME="$1"
TAG="$2"
shift 2

SCOPE="project"
EXECUTE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --scope)
      [[ $# -ge 2 ]] || usage
      SCOPE="$2"
      shift 2
      ;;
    --execute)
      EXECUTE=1
      shift
      ;;
    *)
      usage
      ;;
  esac
done

case "$SCOPE" in
  project|user|local) ;;
  *) echo "rollback.sh: --scope must be one of project|user|local" >&2; exit 1 ;;
esac

command -v jq >/dev/null 2>&1 || { echo "rollback.sh: jq is required but not installed" >&2; exit 1; }

# --- validate <tag> matches <plugin-name>--v<version> and actually exists --

EXPECTED_PREFIX="${PLUGIN_NAME}--v"
if [[ "$TAG" != "${EXPECTED_PREFIX}"* ]]; then
  echo "rollback.sh: tag '${TAG}' does not match the '${EXPECTED_PREFIX}<version>' convention for plugin '${PLUGIN_NAME}'." >&2
  exit 1
fi

if [[ -z "$(git -C "$MARKETPLACE_REPO_ROOT" tag -l "$TAG")" ]]; then
  echo "rollback.sh: tag '${TAG}' does not exist in ${MARKETPLACE_REPO_ROOT} (typo?). Refusing to print a command sequence for a tag that doesn't exist." >&2
  exit 1
fi

MARKETPLACE_MANIFEST="${MARKETPLACE_REPO_ROOT}/.claude-plugin/marketplace.json"
[[ -f "$MARKETPLACE_MANIFEST" ]] || { echo "rollback.sh: no manifest at ${MARKETPLACE_MANIFEST}" >&2; exit 1; }
MARKETPLACE_NAME="$(jq -r '.name' "$MARKETPLACE_MANIFEST")"

REPO_SLUG="viptech/dev-digest-ai-marketplace"

CMD_REMOVE=(claude plugin marketplace remove "$MARKETPLACE_NAME")
CMD_ADD=(claude plugin marketplace add "${REPO_SLUG}@${TAG}" --scope "$SCOPE")
CMD_INSTALL=(claude plugin install "${PLUGIN_NAME}@${MARKETPLACE_NAME}" --scope "$SCOPE")

echo "== Rollback command sequence =="
printf '%q ' "${CMD_REMOVE[@]}"; echo
printf '%q ' "${CMD_ADD[@]}"; echo
printf '%q ' "${CMD_INSTALL[@]}"; echo

if [[ "$EXECUTE" -ne 1 ]]; then
  echo
  echo "(dry-run — nothing was executed; pass --execute to run these commands)"
  exit 0
fi

echo
echo "== Executing =="

echo "+ ${CMD_REMOVE[*]}"
"${CMD_REMOVE[@]}"

echo "+ ${CMD_ADD[*]}"
"${CMD_ADD[@]}"

echo "+ ${CMD_INSTALL[*]}"
"${CMD_INSTALL[@]}"
