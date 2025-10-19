#!/usr/bin/env bash
# Prepare and preview archiving of unnecessary markdowns, tests and example files
# Usage: ./scripts/prepare-commit-archive.sh [--apply]
# Without --apply the script only prints what it would do.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DRY_RUN=true
if [ "${1:-}" = "--apply" ]; then
  DRY_RUN=false
fi

echo "Root: $ROOT_DIR"

# Patterns (relative to repo root) to move into archive when applied.
FILES=(
  "docs/dev-mode-implementation-plan.md"
  "docs/dev-mode-integration-review.md"
  "docs/dev-mode-progress.md"
  "docs/DEVELOPER-WORKFLOW-EXAMPLE.md"
  "docs/DEVMODE-STABILITY-FIXES.md"
  "docs/PHASE-1-5-IMPLEMENTATION-REPORT.md"
  "docs/RACEJS-STORAGE-SYSTEM.md"
  "docs/STORAGE-FIX-SUMMARY.md"
  "docs/websocket-api.md"
  "docs/WEBSOCKET-IMPLEMENTATION-COMPLETE.md"
  "docs/WEBSOCKET-MODULAR-INTEGRATION-COMPLETE.md"
  "docs/WEBSOCKET-REFACTOR-ANALYSIS.md"
  "docs/guides/websocket-custom-ui.md"
  "plan"
  "packages/core/src/dev/STORAGE_FIX_PLAN.md"
  # example heavy/dev-mode example files (move whole example dir if you prefer)
  "examples/08-dev-mode/DEVTOOLS-TEST-RESULTS.md"
  "examples/08-dev-mode/PHASE-1-5-COMPLETE.md"
  "examples/08-dev-mode/README-DEMO.md"
)

ARCHIVE_DIR="$ROOT_DIR/archive"

mkdir -p "$ARCHIVE_DIR/docs"
mkdir -p "$ARCHIVE_DIR/examples"
mkdir -p "$ARCHIVE_DIR/packages"

run_cmd() {
  if $DRY_RUN; then
    echo "DRY-RUN: $*"
  else
    echo "RUN: $*"
    eval "$@"
  fi
}

echo
echo "The script will move the following files into '$ARCHIVE_DIR' when run with --apply:"
for f in "${FILES[@]}"; do
  if [ -e "$ROOT_DIR/$f" ]; then
    echo "  - $f"
  else
    echo "  - $f (not found)"
  fi
done

echo
if $DRY_RUN; then
  echo "Run with --apply to actually perform changes. This will attempt to use 'git mv' when possible so history is preserved."
  exit 0
fi

echo "Applying archive moves..."
for f in "${FILES[@]}"; do
  SRC="$ROOT_DIR/$f"
  if [ ! -e "$SRC" ]; then
    echo "Skipping missing: $f"
    continue
  fi

  # destination base
  case "$f" in
    docs/*)
      DEST_DIR="$ARCHIVE_DIR/docs"
      ;;
    examples/*)
      DEST_DIR="$ARCHIVE_DIR/examples"
      ;;
    packages/*)
      DEST_DIR="$ARCHIVE_DIR/packages"
      ;;
    plan)
      DEST_DIR="$ARCHIVE_DIR/plan"
      mkdir -p "$DEST_DIR"
      ;;
    *)
      DEST_DIR="$ARCHIVE_DIR/other"
      mkdir -p "$DEST_DIR"
      ;;
  esac

  mkdir -p "$DEST_DIR"
  BASENAME="$(basename "$f")"
  DEST="$DEST_DIR/$BASENAME"

  # prefer git mv to preserve history
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
      git mv "$SRC" "$DEST"
      echo "git mv $f -> $(realpath --relative-to="$ROOT_DIR" "$DEST")"
    else
      # file not tracked, fallback to mv
      mv "$SRC" "$DEST"
      echo "mv (untracked) $f -> $(realpath --relative-to="$ROOT_DIR" "$DEST")"
    fi
  else
    mv "$SRC" "$DEST"
    echo "mv $f -> $(realpath --relative-to="$ROOT_DIR" "$DEST")"
  fi
done

echo
echo "Archive complete. Run 'git status' to review changes, then commit with a clear message describing the archived content." 
echo "Suggested commit message: 'chore(docs): archive legacy dev-mode docs and heavy examples to /archive'"
