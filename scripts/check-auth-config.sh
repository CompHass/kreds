#!/usr/bin/env bash
# check-auth-config.sh — Diagnóstico da configuração de autenticação ZITADEL
# Valida variáveis de ambiente e testa conectividade com o issuer ZITADEL.
# Não usa set -e para que todas as verificações rodem mesmo quando uma falha.

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() {
  echo -e "  ${GREEN}[PASS]${RESET} $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo -e "  ${RED}[FAIL]${RESET} $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

warn() {
  echo -e "  ${YELLOW}[WARN]${RESET} $1"
  WARN_COUNT=$((WARN_COUNT + 1))
}

section() {
  echo ""
  echo -e "${CYAN}${BOLD}$1${RESET}"
}

echo ""
echo -e "${BOLD}================================================================${RESET}"
echo -e "${BOLD}   Kreds — Diagnóstico de Configuração de Autenticação ZITADEL${RESET}"
echo -e "${BOLD}================================================================${RESET}"

# ------------------------------------------------------------------
# [1] Verificar .env.local
# ------------------------------------------------------------------
section "[1] Arquivo .env.local"

if [ -f ".env.local" ]; then
  pass ".env.local encontrado"
  # Load env vars from .env.local (safe: ignores comments and blank lines)
  set -o allexport
  # shellcheck disable=SC1090
  source <(grep -v '^\s*#' .env.local | grep -v '^\s*$')
  set +o allexport
elif [ -f ".env" ]; then
  warn ".env encontrado, mas preferível usar .env.local para segredos locais"
  set -o allexport
  # shellcheck disable=SC1090
  source <(grep -v '^\s*#' .env | grep -v '^\s*$')
  set +o allexport
else
  warn ".env.local não encontrado — usando variáveis de ambiente do shell"
  warn "Crie .env.local a partir de .env.example para configurar segredos locais"
fi

# ------------------------------------------------------------------
# [2] AUTH_SECRET
# ------------------------------------------------------------------
section "[2] AUTH_SECRET"

if [ -z "${AUTH_SECRET:-}" ]; then
  fail "AUTH_SECRET não definido"
elif [ "$AUTH_SECRET" = "generate-a-random-secret-here" ]; then
  warn "AUTH_SECRET contém o valor placeholder do .env.example"
  warn "Gere um valor real: openssl rand -base64 33"
  FAIL_COUNT=$((FAIL_COUNT + 1))
else
  pass "AUTH_SECRET definido [SET]"
fi

# ------------------------------------------------------------------
# [3] AUTH_ZITADEL_ID
# ------------------------------------------------------------------
section "[3] AUTH_ZITADEL_ID"

if [ -z "${AUTH_ZITADEL_ID:-}" ]; then
  fail "AUTH_ZITADEL_ID não definido"
elif [ "$AUTH_ZITADEL_ID" = "your-zitadel-client-id" ]; then
  warn "AUTH_ZITADEL_ID contém o valor placeholder do .env.example"
  warn "Obtenha o Client ID no console ZITADEL: Applications → [seu app] → Client ID"
  FAIL_COUNT=$((FAIL_COUNT + 1))
else
  pass "AUTH_ZITADEL_ID definido [SET]"
fi

# ------------------------------------------------------------------
# [4] AUTH_ZITADEL_SECRET
# ------------------------------------------------------------------
section "[4] AUTH_ZITADEL_SECRET"

if [ -z "${AUTH_ZITADEL_SECRET:-}" ]; then
  fail "AUTH_ZITADEL_SECRET não definido"
elif [ "$AUTH_ZITADEL_SECRET" = "your-zitadel-client-secret" ]; then
  warn "AUTH_ZITADEL_SECRET contém o valor placeholder do .env.example"
  warn "Obtenha o Client Secret no console ZITADEL: Applications → [seu app] → Keys"
  FAIL_COUNT=$((FAIL_COUNT + 1))
else
  pass "AUTH_ZITADEL_SECRET definido [SET]"
fi

# ------------------------------------------------------------------
# [5] AUTH_ZITADEL_ISSUER
# ------------------------------------------------------------------
section "[5] AUTH_ZITADEL_ISSUER"

ISSUER="${AUTH_ZITADEL_ISSUER:-https://auth.hasslab.pro}"

if [ -z "${AUTH_ZITADEL_ISSUER:-}" ]; then
  warn "AUTH_ZITADEL_ISSUER não definido — usando default: $ISSUER"
  WARN_COUNT=$((WARN_COUNT + 1))
else
  pass "AUTH_ZITADEL_ISSUER definido: $ISSUER"
fi

# ------------------------------------------------------------------
# [6] Conectividade com ZITADEL (OIDC discovery)
# ------------------------------------------------------------------
section "[6] Conectividade ZITADEL"

DISCOVERY_URL="${ISSUER}/.well-known/openid-configuration"
echo -e "  Testando: ${DISCOVERY_URL}"

DISCOVERY_RESPONSE=$(curl -s --max-time 5 "$DISCOVERY_URL" 2>/dev/null)
CURL_EXIT=$?

if [ $CURL_EXIT -ne 0 ]; then
  fail "ZITADEL OFFLINE — curl falhou (código $CURL_EXIT). Verifique sua conexão com a internet."
elif echo "$DISCOVERY_RESPONSE" | grep -q '"issuer"'; then
  pass "ZITADEL ONLINE — documento OIDC discovery válido recebido"
else
  fail "ZITADEL retornou resposta inválida — documento OIDC discovery não contém 'issuer'"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# ------------------------------------------------------------------
# [7] Redirect URI esperado
# ------------------------------------------------------------------
section "[7] Redirect URI esperado"

REDIRECT_URI="http://localhost:3000/api/auth/callback/zitadel"
echo -e "  Redirect URI obrigatório: ${BOLD}${REDIRECT_URI}${RESET}"

if echo "$DISCOVERY_RESPONSE" | grep -q '"issuer"'; then
  warn "Confirme que '${REDIRECT_URI}' está cadastrado no ZITADEL"
  warn "Console ZITADEL → Applications → [seu app] → Redirect URIs"
  warn "Ative 'Dev Mode' no app para permitir HTTP (localhost sem HTTPS)"
else
  warn "Não foi possível verificar conectividade — configure o Redirect URI quando o ZITADEL estiver acessível"
fi

# ------------------------------------------------------------------
# [8] Sumário
# ------------------------------------------------------------------
section "[8] Sumário"

TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo ""
echo -e "  Verificações concluídas: ${BOLD}$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))${RESET}"
echo -e "  ${GREEN}Passaram:${RESET} $PASS_COUNT"
echo -e "  ${RED}Falharam:${RESET} $FAIL_COUNT"
echo -e "  ${YELLOW}Avisos:${RESET} $WARN_COUNT"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
  echo -e "${RED}${BOLD}Ação necessária:${RESET} $FAIL_COUNT verificação(ões) falharam."
  echo -e "Leia ${BOLD}docs/ZITADEL-SETUP.md${RESET} para instruções completas de configuração."
  echo ""
  exit 1
else
  echo -e "${GREEN}${BOLD}Configuração OK!${RESET} Todas as verificações obrigatórias passaram."
  if [ $WARN_COUNT -gt 0 ]; then
    echo -e "${YELLOW}Há $WARN_COUNT aviso(s) — revise as mensagens acima.${RESET}"
  fi
  echo ""
  exit 0
fi
