#!/usr/bin/env bash
#
# Проводник по деплою: открывает нужные страницы дашбордов, объясняет, что
# нажимать, принимает скопированные значения и в конце проверяет результат.
#
# Всё до отметки STAGES — вспомогательные функции вывода и ввода. Сами шаги
# описаны ниже отметки, править нужно их.

set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────
# Wizard library — delightful, consistent UX. Identical across every wizard.
# ──────────────────────────────────────────────────────────────────────────

if [[ -t 1 ]] && command -v tput >/dev/null 2>&1 && [[ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]]; then
  BOLD=$(tput bold); DIM=$(tput dim); RESET=$(tput sgr0)
  BLUE=$(tput setaf 4); GREEN=$(tput setaf 2); YELLOW=$(tput setaf 3); RED=$(tput setaf 1)
else
  BOLD=""; DIM=""; RESET=""; BLUE=""; GREEN=""; YELLOW=""; RED=""
fi

# Author sets this at the top of the stages section.
TOTAL_STAGES=0

_STAGE_INDEX=0
ENV_FILE="${ENV_FILE:-.env}"
WRITTEN_ENV=()    # KEYs written to ENV_FILE this run
WRITTEN_SECRET=() # secret NAMEs set this run
SKIPPED=()        # things we couldn't do (e.g. gh missing)

# _clear — wipe the terminal so only the current step is on screen. No-op when
# output isn't a terminal, so piped logs stay readable.
_clear() {
  [[ -t 1 ]] || return 0
  if command -v tput >/dev/null 2>&1; then tput clear; else printf '\033[2J\033[3J\033[H'; fi
}

# banner "Title" — opening frame: what this wizard does.
banner() {
  _clear
  printf '\n%s%s  %s%s\n' "$BOLD" "$BLUE" "$1" "$RESET"
  printf '%s  %s stages%s\n\n' "$DIM" "$TOTAL_STAGES" "$RESET"
  printf '%s  You drive the browser; this wizard tells you exactly what to do and\n' "$DIM"
  printf '  captures the values you copy back. Stop any time with Ctrl-C and re-run\n'
  printf '  later — it remembers values already saved.%s\n' "$RESET"
  pause "Ready to start?"
}

# stage "Название" — очищает экран и объявляет шаг с прогрессом.
# Очистка нужна, чтобы на экране был виден только текущий шаг.
stage() {
  _clear
  _STAGE_INDEX=$((_STAGE_INDEX + 1))
  printf '\n%s%s▸ Stage %s/%s · %s%s\n' \
    "$BOLD" "$BLUE" "$_STAGE_INDEX" "$TOTAL_STAGES" "$1" "$RESET"
}

# say "..." — a plain instruction line.
say()  { printf '  %s\n' "$1"; }
# step "..." — a numbered-feeling action the human takes in the browser.
step() { printf '  %s•%s %s\n' "$BLUE" "$RESET" "$1"; }
note() { printf '  %s%s%s\n' "$DIM" "$1" "$RESET"; }
warn() { printf '  %s⚠ %s%s\n' "$YELLOW" "$1" "$RESET"; }

# open_url URL — open in the human's browser, cross-platform incl. WSL.
open_url() {
  local url="$1"
  printf '  %s↗ opening%s %s\n' "$GREEN" "$RESET" "$url"
  { if   command -v wslview     >/dev/null 2>&1; then wslview "$url"
    elif command -v explorer.exe >/dev/null 2>&1; then explorer.exe "$url"
    elif command -v xdg-open    >/dev/null 2>&1; then xdg-open "$url"
    elif command -v open        >/dev/null 2>&1; then open "$url"
    else warn "браузер открыть не удалось — зайди вручную: $url"; fi
  } >/dev/null 2>&1 || warn "браузер открыть не удалось — зайди вручную: $url"
}

# pause "msg" — wait for the human to confirm they've done the manual part.
pause() {
  printf '  %s%s%s ' "$DIM" "${1:-Enter — дальше}" "$RESET"
  read -r _ || true
}

# confirm "question" — y/N gate; returns success on yes.
confirm() {
  local reply=""
  printf '  %s? %s [y/N] ' "$YELLOW" "$1"
  read -r reply || true
  [[ "$reply" =~ ^[Yy] ]]
}

# _existing KEY — current value of KEY in ENV_FILE, if any.
_existing() {
  [[ -f "$ENV_FILE" ]] || return 1
  local line; line=$(grep -E "^${1}=" "$ENV_FILE" | tail -n1) || return 1
  printf '%s' "${line#*=}"
}

# ask KEY "Prompt" — read a value into $KEY. Offers the existing .env value as
# a default on re-runs (Enter keeps it). Visible input (non-secret).
ask() {
  local key="$1" prompt="$2" current input
  current=$(_existing "$key" || true)
  if [[ -n "$current" ]]; then
    printf '  %s%s%s %s[Enter — оставить прежнее]%s ' "$BOLD" "$prompt" "$RESET" "$DIM" "$RESET"
  else
    printf '  %s%s%s ' "$BOLD" "$prompt" "$RESET"
  fi
  read -r input || true
  [[ -z "$input" && -n "$current" ]] && input="$current"
  printf -v "$key" '%s' "$input"
}

# ask_secret KEY "Prompt" — like ask, but input is hidden.
ask_secret() {
  local key="$1" prompt="$2" current input
  current=$(_existing "$key" || true)
  if [[ -n "$current" ]]; then
    printf '  %s%s%s %s[Enter — оставить прежнее]%s ' "$BOLD" "$prompt" "$RESET" "$DIM" "$RESET"
  else
    printf '  %s%s%s ' "$BOLD" "$prompt" "$RESET"
  fi
  read -rs input || true
  printf '\n'
  [[ -z "$input" && -n "$current" ]] && input="$current"
  printf -v "$key" '%s' "$input"
}

# write_env KEY VALUE — upsert KEY=VALUE into ENV_FILE (creates it; replaces
# any existing line). Idempotent.
write_env() {
  local key="$1" value="$2" tmp
  touch "$ENV_FILE"
  tmp=$(mktemp)
  grep -vE "^${key}=" "$ENV_FILE" > "$tmp" || true
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
  WRITTEN_ENV+=("$key")
  printf '  %s✓ wrote%s %s → %s\n' "$GREEN" "$RESET" "$key" "$ENV_FILE"
}

# set_secret NAME VALUE — set a GitHub Actions repo secret via gh. Falls back
# to a warning (and records it) if gh is unavailable or unauthenticated.
set_secret() {
  local name="$1" value="$2"
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    if printf '%s' "$value" | gh secret set "$name" >/dev/null 2>&1; then
      WRITTEN_SECRET+=("$name")
      printf '  %s✓ set%s GitHub secret %s\n' "$GREEN" "$RESET" "$name"
      return
    fi
  fi
  SKIPPED+=("GitHub secret $name (set it manually: gh secret set $name)")
  warn "skipped GitHub secret $name — gh not ready; set it later"
}

# set_var NAME VALUE — set a GitHub Actions repo variable (non-secret).
set_var() {
  local name="$1" value="$2"
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    if gh variable set "$name" --body "$value" >/dev/null 2>&1; then
      printf '  %s✓ set%s GitHub variable %s\n' "$GREEN" "$RESET" "$name"
      return
    fi
  fi
  SKIPPED+=("GitHub variable $name")
  warn "skipped GitHub variable $name — gh not ready; set it later"
}

# finish — clear, then a closing summary of everything configured.
finish() {
  _clear
  printf '\n%s%s  ✓ Setup complete%s\n' "$BOLD" "$GREEN" "$RESET"
  (( ${#WRITTEN_ENV[@]} ))    && note "wrote ${#WRITTEN_ENV[@]} value(s) to $ENV_FILE: ${WRITTEN_ENV[*]}"
  (( ${#WRITTEN_SECRET[@]} )) && note "set ${#WRITTEN_SECRET[@]} GitHub secret(s): ${WRITTEN_SECRET[*]}"
  if (( ${#SKIPPED[@]} )); then
    printf '\n'; warn "still to do by hand:"
    for s in "${SKIPPED[@]}"; do note "  - $s"; done
  fi
  printf '\n'
}

# ──────────────────────────────────────────────────────────────────────────
# STAGES — author this section. One stage() per step the human takes.
# Replace the example below. Set TOTAL_STAGES to match the stages you write.
# ──────────────────────────────────────────────────────────────────────────


TOTAL_STAGES=6

# Значения деплоя пишутся отдельно от .env: там лежит адрес локальной базы
# для разработки, и затирать его боевыми доступами нельзя. Шаблон
# .env.*.local уже перечислен в .gitignore.
ENV_FILE=".env.deploy.local"

if [[ ! -f package.json || ! -f vercel.json ]]; then
  printf '%s  Запускать из корня репозитория: там лежат package.json и vercel.json.%s\n' "$RED" "$RESET"
  exit 1
fi

banner "Деплой визитки — Neon + Vercel"

# ── 1 ─────────────────────────────────────────────────────────────────────
stage "Neon — проект и база"
say "Заводим Postgres. Бесплатного тарифа Neon для визитки хватает с запасом."
open_url "https://console.neon.tech/app/projects"
step "Войди через GitHub, если ещё не вошёл."
step "Нажми «New Project»."
step "Имя проекта — любое, например business-card."
step "Регион выбери ближе к Европе, например AWS eu-central-1."
step "Postgres версию оставь предложенную по умолчанию."
step "Нажми «Create project»."
note "После создания откроется страница проекта с блоком «Connection string»."
pause "Проект создан? Enter — дальше."

# ── 2 ─────────────────────────────────────────────────────────────────────
stage "Neon — строка через пул (DATABASE_URL)"
say "Это адрес, по которому приложение ходит в базу в рантайме."
step "В блоке «Connection string» найди переключатель «Pooled connection»."
step "Включи его — в адресе появится «-pooler» перед именем региона."
step "Скопируй строку целиком, она начинается с postgresql://"
ask DATABASE_URL "Вставь строку через пул:"

if [[ "$DATABASE_URL" != *"-pooler"* ]]; then
  warn "В строке нет «-pooler» — похоже, пул выключен и это прямое подключение."
  warn "Прямая строка понадобится на следующем шаге, а здесь нужна именно с пулом."
fi

# Prisma обязана знать, что перед ней pgbouncer: иначе она готовит запросы
# на стороне сервера, а транзакционный пул их не переживает.
if [[ "$DATABASE_URL" != *"pgbouncer=true"* ]]; then
  if [[ "$DATABASE_URL" == *"?"* ]]; then
    DATABASE_URL="${DATABASE_URL}&pgbouncer=true"
  else
    DATABASE_URL="${DATABASE_URL}?pgbouncer=true"
  fi
  note "Дописал ?pgbouncer=true — без этого Prisma ломается на пуле."
fi

write_env DATABASE_URL "$DATABASE_URL"

# ── 3 ─────────────────────────────────────────────────────────────────────
stage "Neon — прямая строка (DIRECT_URL)"
say "По ней на сборке пойдут миграции и сид: пул их не выдерживает."
step "В том же блоке выключи «Pooled connection»."
step "Адрес станет без «-pooler». Скопируй его целиком."
ask DIRECT_URL "Вставь прямую строку:"

if [[ "$DIRECT_URL" == *"-pooler"* ]]; then
  warn "В строке есть «-pooler» — это адрес пула, а нужен прямой."
  warn "Выключи переключатель «Pooled connection» и скопируй заново."
fi

write_env DIRECT_URL "$DIRECT_URL"
note "Обе строки сохранены локально в $ENV_FILE — пригодятся при повторном запуске."

# ── 4 ─────────────────────────────────────────────────────────────────────
stage "Vercel — импорт репозитория"
say "Импортируем проект, но пока НЕ деплоим: сначала переменные."
open_url "https://vercel.com/new"
step "Войди через GitHub."
step "Найди репозиторий business-card-website- и нажми «Import»."
step "Framework Preset — «Other». Root Directory оставь как есть, корень."
step "Build и Output настройки не трогай: их задаёт vercel.json."
warn "Кнопку «Deploy» пока не нажимай — на следующем шаге добавим переменные."
note "Если ты уже успел нажать Deploy и сборка упала — это ожидаемо, переменных"
note "ещё нет. Добавим их и запустим пересборку."
pause "Экран импорта открыт? Enter — дальше."

# ── 5 ─────────────────────────────────────────────────────────────────────
stage "Vercel — переменные и сборка"
say "Обе строки нужны и на сборке, и в рантайме: миграции с сидом выполняются"
say "во время сборки, командой vercel-build."
step "Разверни секцию «Environment Variables»."
step "Добавь DATABASE_URL со значением из $ENV_FILE (строка через пул)."
step "Добавь DIRECT_URL со значением оттуда же (прямая строка)."
step "У обеих отметь все три среды: Production, Preview, Development."
say ""
step "Теперь нажми «Deploy» и дождись окончания сборки."
note "В логах сборки должно пройти: prisma generate → migrate deploy → сид → nest build."
note "Строка «Сид выполнен: профиль «mark»…» означает, что база заполнена."
say ""
note "Если проект уже был импортирован раньше: Settings → Environment Variables,"
note "добавь переменные там, затем Deployments → ⋯ → Redeploy."
pause "Сборка завершилась успешно? Enter — дальше."

# ── 6 ─────────────────────────────────────────────────────────────────────
stage "Проверка развёрнутого API"
say "Проверим то же, что проверяет ТЗ: живую базу и запрос из задания."
step "Скопируй адрес деплоя со страницы проекта, вида https://имя.vercel.app"
ask DEPLOY_URL "Вставь адрес деплоя:"
DEPLOY_URL="${DEPLOY_URL%/}"
write_env DEPLOY_URL "$DEPLOY_URL"

say ""
say "Проверяю /health…"
health=$(curl -fsS --max-time 30 "$DEPLOY_URL/health" 2>/dev/null || true)

if [[ "$health" == *'"status":"ok"'* ]]; then
  printf '  %s✓%s /health отвечает ok, база на связи\n' "$GREEN" "$RESET"
else
  warn "/health не ответил или база недоступна."
  note "Ответ: ${health:-пусто}"
  SKIPPED+=("проверить /health вручную: $DEPLOY_URL/health")
fi

say ""
say "Проверяю запрос из ТЗ…"
tz_query='{"query":"{ profile { name description links { label url } skills(category: FRONTEND) { name category } experience { company position startDate endDate isCurrent durationMonths achievements { text } } projects { name repoUrl liveUrl description } } }"}'
answer=$(curl -fsS --max-time 45 -X POST "$DEPLOY_URL/graphql" \
  -H 'Content-Type: application/json' -d "$tz_query" 2>/dev/null || true)

if [[ "$answer" == *'"errors"'* ]]; then
  warn "GraphQL вернул ошибку."
  note "Ответ: ${answer:0:400}"
  SKIPPED+=("разобрать ошибку GraphQL на $DEPLOY_URL/graphql")
elif [[ "$answer" == *'"profile"'* ]]; then
  printf '  %s✓%s запрос из ТЗ отдаёт профиль с вложенными данными\n' "$GREEN" "$RESET"
else
  warn "Неожиданный ответ от /graphql."
  note "Ответ: ${answer:0:400}"
  SKIPPED+=("проверить $DEPLOY_URL/graphql вручную")
fi

say ""
say "Открываю Apollo Sandbox — там уже подставлен запрос из ТЗ."
open_url "$DEPLOY_URL/graphql"
step "Нажми ▶ и убедись, что справа приходят данные."
pause "Готово? Enter — к итогам."

finish
