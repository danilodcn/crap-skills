#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DETECT="${CRAP_DETECT:-python3}"
CRAP_PY_BIN="${CRAP_PY_BIN:-crap4py}"
CRAP_TS_BIN="${CRAP_TS_BIN:-crap4ts}"
OUTPUT_DIR="target/crap"
REPORT_JSON="$OUTPUT_DIR/report.json"

languages="$("$DETECT" "$SCRIPT_DIR/detect_language.py")" || exit 1
count="$(printf '%s\n' "$languages" | grep -c .)"

staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT

run_language() {
  local language="$1"
  local binary="$2"
  shift 2
  if ! command -v "$binary" >/dev/null 2>&1; then
    printf 'error: %s not found; run install.sh first\n' "$binary" >&2
    return 1
  fi
  local result=0
  "$binary" "$@" || result=$?
  if [ -f "$REPORT_JSON" ]; then
    if [ "$count" -gt 1 ]; then
      mv "$REPORT_JSON" "$staging/report.$language.json"
    else
      mv "$REPORT_JSON" "$staging/report.json"
    fi
  fi
  return "$result"
}

status=0
while read -r language; do
  [ -n "$language" ] || continue
  case "$language" in
    python) run_language python "$CRAP_PY_BIN" "$@" || status=1 ;;
    typescript) run_language typescript "$CRAP_TS_BIN" "$@" || status=1 ;;
  esac
done <<< "$languages"

if [ -n "$(ls -A "$staging" 2>/dev/null)" ]; then
  mkdir -p "$OUTPUT_DIR"
  for report in "$staging"/*.json; do
    cp "$report" "$OUTPUT_DIR/"
    printf 'JSON report written to %s/%s\n' "$OUTPUT_DIR" "$(basename "$report")" >&2
  done
fi

exit "$status"
