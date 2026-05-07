#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# Generate .prompt-gate-baseline.txt from current repo state
# ─────────────────────────────────────────────────────────────────────
# Run once during Bundle 0 install. Scans all prompt-*.js files in
# the repo (tracked or untracked) and writes singular-canonical
# patterns to .prompt-gate-baseline.txt.
#
# Usage: from repo root, ./scripts/generate-prompt-baseline.sh
# ─────────────────────────────────────────────────────────────────────

set -uo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  echo "Not in a git repo. Aborting." >&2
  exit 1
fi

cd "$REPO_ROOT"

DISEASE_REGEX='RIGHT[[:space:]]*(summary|opening|opening:|\(|:)|Example[[:space:]]+shape:|Right[[:space:]]+way:|GOOD[[:space:]]+opening|GOOD[[:space:]]*\('
ANTICOPY_REGEX='do NOT copy|study these but|use as inspiration|illustrative only|non-canonical|anti-copy|do not template'
PROXIMITY_LINES=25

HASH_CMD=""
if command -v shasum >/dev/null 2>&1; then HASH_CMD="shasum -a 256"
elif command -v sha256sum >/dev/null 2>&1; then HASH_CMD="sha256sum"
else echo "No sha256 utility found. Aborting." >&2; exit 1
fi

classify() {
  local line="$1"
  if echo "$line" | grep -qiE 'Example[[:space:]]+shape'; then echo "example_shape"
  elif echo "$line" | grep -qiE 'RIGHT'; then echo "right"
  elif echo "$line" | grep -qiE 'GOOD'; then echo "good"
  else echo "other"
  fi
}

category_pattern() {
  case "$1" in
    right) echo 'RIGHT[[:space:]]*(summary|opening|opening:|\(|:)|Right[[:space:]]+way:' ;;
    good)  echo 'GOOD[[:space:]]+opening|GOOD[[:space:]]*\(' ;;
    example_shape) echo 'Example[[:space:]]+shape:' ;;
    *) echo '' ;;
  esac
}

# Find all prompt-*.js files (and prompt.js) tracked by git
PROMPT_FILES=$(git ls-files | grep -E '(^|/)prompt(-[a-z0-9]+)?\.js$' || true)

if [ -z "$PROMPT_FILES" ]; then
  echo "No prompt-*.js files found in git index. Make sure you're in the repo root." >&2
  exit 1
fi

OUTPUT_FILE="$REPO_ROOT/.prompt-gate-baseline.txt"

{
cat << 'HEADER_EOF'
# ─────────────────────────────────────────────────────────────────────
# Prompt-gate baseline — grandfathered singular-canonical patterns
# ─────────────────────────────────────────────────────────────────────
# Generated: Bundle 0 install
# Reference: execution-plan-v5.1.md, NarrativeContract V8-LOCKED §3.X
#
# Each entry identifies a singular-canonical example pattern present
# in the codebase at install time. The pre-commit gate treats these
# as WARN-on-existing — does not block them, tracks as known disease.
#
# Format: file|sig12|description
#
# Lifecycle:
#   - Entries are grandfathered until removed.
#   - When a bundle ships a cure (e.g., Bundle 6 fixing F17), remove
#     the corresponding entry as part of the cure commit.
#   - To grandfather a new pattern manually (rare), copy the file|sig|
#     desc line from the hook's BLOCK output and append below.
# ─────────────────────────────────────────────────────────────────────

HEADER_EOF

while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ ! -f "$f" ] && continue
  
  content=$(cat "$f")
  labels=$(echo "$content" | grep -nE "$DISEASE_REGEX" 2>/dev/null || true)
  [ -z "$labels" ] && continue
  
  while IFS= read -r entry; do
    [ -z "$entry" ] && continue
    lineno="${entry%%:*}"
    labelline="${entry#*:}"
    
    cat=$(classify "$labelline")
    [ "$cat" = "other" ] && continue
    
    block_start=$((lineno > PROXIMITY_LINES ? lineno - PROXIMITY_LINES : 1))
    block_end=$((lineno + PROXIMITY_LINES))
    block_content=$(echo "$content" | sed -n "${block_start},${block_end}p")
    
    cat_pattern=$(category_pattern "$cat")
    local_count=$(echo "$block_content" | grep -cE "$cat_pattern" 2>/dev/null || echo 0)
    
    if [ "$local_count" -ge 3 ]; then
      continue
    fi
    
    ac_start=$((lineno > 15 ? lineno - 15 : 1))
    ac_end=$((lineno + 15))
    ac_context=$(echo "$content" | sed -n "${ac_start},${ac_end}p")
    
    if echo "$ac_context" | grep -qiE "$ANTICOPY_REGEX"; then
      continue
    fi
    
    norm=$(echo "$labelline" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -s ' ')
    sig=$(echo -n "${f}|${norm}" | $HASH_CMD | awk '{print $1}' | cut -c1-12)
    echo "${f}|${sig}|line ${lineno}: $(echo "$norm" | cut -c1-100)"
  done <<< "$labels"
done <<< "$PROMPT_FILES"

} > "$OUTPUT_FILE"

ENTRY_COUNT=$(grep -cE '^[^#]' "$OUTPUT_FILE" 2>/dev/null || echo 0)
echo "Wrote $OUTPUT_FILE with $ENTRY_COUNT grandfathered pattern(s)."
echo ""
echo "Review the file. Expected entries (per V4S29 audit):"
echo "  - F17 RIGHT summary opening in prompt-stage2c.js"
echo "  - GOOD provisional teaching in prompt-stage1.js (review whether to keep)"
echo ""
echo "If the list looks right, commit it as part of Bundle 0."
