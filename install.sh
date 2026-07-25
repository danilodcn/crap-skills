#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREFIX="${CRAP_PREFIX:-$HOME/.local/bin}"
VENV_DIR="$REPO_ROOT/.crap-venv"
PYTHON_BIN="${PYTHON:-python3}"

install_cli=true
install_skills=true
force=false

CLAUDE_SKILLS="$HOME/.claude/skills"
CODEX_SKILLS="$HOME/.codex/skills"
OPENCODE_SKILLS="${OPENCODE_SKILL_DIR:-$HOME/.config/opencode/skill}"

SKILL_NAMES=(crap4py crap4ts crap-report)

usage() {
  cat <<'USAGE'
Usage: ./install.sh [options]

Installs the CRAP command line tools and, when an agent is detected, registers
the skills for it.

Options:
  --cli-only        Install the commands only, skip every agent skill.
  --skills-only     Register the skills only, skip the commands.
  --prefix DIR      Where to put the commands. Default: ~/.local/bin
  --force           Replace existing files and directories that are in the way.
  -h, --help        Print this message and exit.

Environment:
  PYTHON            Python interpreter used to create the tool virtualenv.
  OPENCODE_SKILL_DIR  Override the opencode skill directory.

The commands point back at this repository, so a git pull updates them in
place. Do not move or delete this directory after installing.
USAGE
}

info() { printf '  %s\n' "$1"; }
step() { printf '\n%s\n' "$1"; }
warn() { printf '  warning: %s\n' "$1" >&2; }
die() { printf 'error: %s\n' "$1" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --cli-only) install_skills=false ;;
    --skills-only) install_cli=false ;;
    --prefix) shift; [ $# -gt 0 ] || die "--prefix requires a directory"; PREFIX="$1" ;;
    --force) force=true ;;
    -h|--help) usage; exit 0 ;;
    *) printf 'error: unknown option: %s\n\n' "$1" >&2; usage >&2; exit 1 ;;
  esac
  shift
done

require_python() {
  command -v "$PYTHON_BIN" >/dev/null 2>&1 || die "$PYTHON_BIN not found; set PYTHON to a Python 3.11+ interpreter"
  "$PYTHON_BIN" - <<'PY' || die "Python 3.11 or newer is required"
import sys
sys.exit(0 if sys.version_info >= (3, 11) else 1)
PY
}

create_python_env() {
  step "Python tool environment"
  require_python
  if [ ! -x "$VENV_DIR/bin/python" ]; then
    "$PYTHON_BIN" -m venv "$VENV_DIR"
    info "created $VENV_DIR"
  else
    info "reusing $VENV_DIR"
  fi
  "$VENV_DIR/bin/python" -m pip install --quiet --upgrade pip
  "$VENV_DIR/bin/python" -m pip install --quiet "radon>=6.0" "coverage>=7.15"
  info "radon and coverage ready"
}

create_node_env() {
  step "TypeScript tool environment"
  if ! command -v node >/dev/null 2>&1; then
    warn "node not found; crap4ts will not run until Node 20+ is installed"
    return
  fi
  if ! command -v npm >/dev/null 2>&1; then
    warn "npm not found; skipping the crap4ts dependency install"
    return
  fi
  if [ -d "$REPO_ROOT/crap4ts/node_modules/typescript" ]; then
    info "typescript already installed"
    return
  fi
  (cd "$REPO_ROOT/crap4ts" && npm install --silent)
  info "typescript installed"
}

write_command() {
  local name="$1"
  local body="$2"
  local target="$PREFIX/$name"
  if [ -e "$target" ] && [ ! -L "$target" ] && [ "$force" = false ]; then
    warn "$target exists and is not a symlink; skipped (use --force)"
    return
  fi
  printf '%s\n' "$body" > "$target"
  chmod +x "$target"
  info "$target"
}

install_commands() {
  step "Commands in $PREFIX"
  mkdir -p "$PREFIX"

  write_command crap4py "#!/usr/bin/env bash
set -euo pipefail
CRAP_HOME=\"$REPO_ROOT\"
VENV=\"$VENV_DIR\"
export PYTHONPATH=\"\$CRAP_HOME/crap4py/scripts\${PYTHONPATH:+:\$PYTHONPATH}\"
export PATH=\"\$PATH:\$VENV/bin\"
exec \"\$VENV/bin/python\" \"\$CRAP_HOME/crap4py/scripts/crap_py.py\" \"\$@\""

  write_command crap4ts "#!/usr/bin/env bash
set -euo pipefail
CRAP_HOME=\"$REPO_ROOT\"
exec node \"\$CRAP_HOME/crap4ts/scripts/crap_ts.mjs\" \"\$@\""

  write_command crap-report "#!/usr/bin/env bash
set -euo pipefail
CRAP_HOME=\"$REPO_ROOT\"
export CRAP_PY_BIN=\"$PREFIX/crap4py\"
export CRAP_TS_BIN=\"$PREFIX/crap4ts\"
export CRAP_DETECT=\"$VENV_DIR/bin/python\"
exec bash \"\$CRAP_HOME/crap-report/scripts/crap_report.sh\" \"\$@\""

  case ":$PATH:" in
    *":$PREFIX:"*) ;;
    *) warn "$PREFIX is not in your PATH; add it to your shell profile" ;;
  esac
}

link_skill() {
  local dir="$1"
  local name="$2"
  local target="$dir/$name"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    if [ "$force" = false ]; then
      warn "$target exists and is not a symlink; skipped (use --force)"
      return
    fi
    rm -rf "$target"
  fi
  ln -sfn "$REPO_ROOT/$name" "$target"
}

install_agent_skills() {
  local label="$1"
  local dir="$2"
  local parent
  parent="$(dirname "$dir")"
  if [ ! -d "$parent" ]; then
    info "$label not detected, skipped"
    return
  fi
  mkdir -p "$dir"
  local name
  for name in "${SKILL_NAMES[@]}"; do
    link_skill "$dir" "$name"
  done
  info "$label -> $dir"
}

install_skills_everywhere() {
  step "Agent skills"
  install_agent_skills "claude" "$CLAUDE_SKILLS"
  install_agent_skills "codex" "$CODEX_SKILLS"
  install_agent_skills "opencode" "$OPENCODE_SKILLS"
}

verify() {
  step "Verification"
  local failed=false
  if [ "$install_cli" = true ]; then
    if "$PREFIX/crap4py" --help >/dev/null 2>&1; then
      info "crap4py responds to --help"
    else
      warn "crap4py did not run"; failed=true
    fi
    if command -v node >/dev/null 2>&1; then
      if "$PREFIX/crap4ts" --help >/dev/null 2>&1; then
        info "crap4ts responds to --help"
      else
        warn "crap4ts did not run"; failed=true
      fi
    fi
  fi
  [ "$failed" = false ] || die "installation finished with problems"
}

printf 'Installing CRAP tools from %s\n' "$REPO_ROOT"

if [ "$install_cli" = true ]; then
  create_python_env
  create_node_env
  install_commands
fi

if [ "$install_skills" = true ]; then
  install_skills_everywhere
fi

verify

step "Done"
info "run 'crap4py' inside a Python project, or 'crap-report' to detect the language"
