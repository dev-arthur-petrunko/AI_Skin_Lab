#!/usr/bin/env bash
# Scope guard for the isolated /perfume feature.
set -euo pipefail
ALLOWED='^(frontend/src/app/perfume/|frontend/src/components/perfume/|frontend/src/lib/perfume/|backend/app/perfumes/|backend/tests/test_perfume|scripts/(perfume_|check_scope_perfume)|data/perfume_(photos_)?report\.csv$|data/perfume_images/)'
EDITABLE='^(backend/app/main\.py|frontend/src/components/Header\.tsx|frontend/src/messages/uk\.json|\.gitignore)$'
cd "$(dirname "$0")/.."
# WSL git vs Windows git: normalize so CRLF on disk doesn't create phantom diffs
gitc() { git -c core.autocrlf=true "$@"; }
git rev-parse --git-dir >/dev/null 2>&1 || { echo "not a git repo"; exit 2; }
changed=$( (gitc diff --name-only HEAD 2>/dev/null; gitc ls-files --others --exclude-standard 2>/dev/null) | sort -u )
bad=$(echo "$changed" | grep -Ev "$ALLOWED|$EDITABLE" || true)
if [ -n "$bad" ]; then echo "ВНЕ ОБЛАСТИ ЗАДАНИЯ:"; echo "$bad"; exit 1; fi
echo "OK: все новые/изменённые файлы в разрешённой области."
echo "Правки в редактируемых файлах (только additions проверить глазами):"
gitc diff -U0 HEAD -- $(echo "$changed" | grep -E "$EDITABLE" | tr '\n' ' ') 2>/dev/null || true
