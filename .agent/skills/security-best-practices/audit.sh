#!/usr/bin/env bash
# =============================================================================
# security-best-practices/audit.sh
# Auditoría automática de seguridad para LuxCode AI
# Uso: bash .agent/skills/security-best-practices/audit.sh
# =============================================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
PASS=0; WARN=0; FAIL=0

log_pass() { echo -e "${GREEN}✅ PASS${NC} $1"; ((PASS++)); }
log_warn() { echo -e "${YELLOW}⚠️  WARN${NC} $1"; ((WARN++)); }
log_fail() { echo -e "${RED}❌ FAIL${NC} $1"; ((FAIL++)); }

echo ""
echo -e "${BLUE}🛡️  Security Audit — LuxCode AI${NC}"
echo "================================================"
echo ""

# --- SK-01: No hay API keys logueadas ---
echo -e "${BLUE}[SK-01]${NC} Verificando que no se loguean API keys..."
if grep -r "console.log" src/ 2>/dev/null | grep -qi "key\|token\|secret\|password"; then
  log_fail "SK-01: console.log con posible API key en src/"
else
  log_pass "SK-01: No se encontraron API keys en console.log"
fi

# --- SK-05: package-lock.json existe ---
echo -e "${BLUE}[SK-05]${NC} Verificando package-lock.json..."
if [ -f "package-lock.json" ]; then
  log_pass "SK-05: package-lock.json existe"
else
  log_fail "SK-05: package-lock.json no encontrado — riesgo de supply chain"
fi

# --- WV-01: CSP en WebView ---
echo -e "${BLUE}[WV-01]${NC} Verificando Content-Security-Policy en WebViews..."
if grep -r "Content-Security-Policy" src/ 2>/dev/null | grep -q "meta"; then
  log_pass "WV-01: CSP encontrado en WebView HTML"
else
  log_warn "WV-01: No se encontró CSP meta tag en WebViews — agregar para producción"
fi

# --- WV-02: No innerHTML con datos externos ---
echo -e "${BLUE}[WV-02]${NC} Verificando uso de innerHTML..."
if grep -r "innerHTML" src/ 2>/dev/null | grep -v "//" | grep -q "innerHTML"; then
  log_warn "WV-02: Uso de innerHTML detectado — verificar que no use datos del usuario"
else
  log_pass "WV-02: No se encontró innerHTML con datos del usuario"
fi

# --- WV-04: No eval() ---
echo -e "${BLUE}[WV-04]${NC} Verificando ausencia de eval()..."
if grep -r "eval(" src/ 2>/dev/null | grep -v "//" | grep -q "eval("; then
  log_fail "WV-04: eval() encontrado en src/ — riesgo crítico de XSS"
else
  log_pass "WV-04: No se encontró eval()"
fi

# --- FE-01: fetch con res.ok ---
echo -e "${BLUE}[FE-01]${NC} Verificando manejo de errores en fetch..."
FETCH_COUNT=$(grep -r "await fetch(" src/ 2>/dev/null | wc -l || echo 0)
OK_COUNT=$(grep -r "res\.ok" src/ 2>/dev/null | wc -l || echo 0)
if [ "$FETCH_COUNT" -gt 0 ] && [ "$OK_COUNT" -ge "$FETCH_COUNT" ]; then
  log_pass "FE-01: Todos los fetch verifican res.ok ($FETCH_COUNT fetch, $OK_COUNT checks)"
elif [ "$FETCH_COUNT" -gt 0 ]; then
  log_warn "FE-01: $FETCH_COUNT fetch encontrados, solo $OK_COUNT verifican res.ok"
else
  log_pass "FE-01: No se encontraron fetch sin manejo de errores"
fi

# --- FE-02: API keys en headers, no en URL ---
echo -e "${BLUE}[FE-02]${NC} Verificando que API keys no estén en URLs..."
if grep -r "fetch(\`" src/ 2>/dev/null | grep -q "key=\${"; then
  log_warn "FE-02: API key detectada en URL de fetch — considerar moverla a header Authorization"
else
  log_pass "FE-02: API keys no encontradas en URLs de fetch"
fi

# --- GA-01: Secrets en workflows ---
echo -e "${BLUE}[GA-01]${NC} Verificando secrets en GitHub Actions..."
if grep -r "secrets\." .github/workflows/ 2>/dev/null | grep -q "secrets\."; then
  log_pass "GA-01: Secrets usan \${{ secrets.X }} correctamente"
fi
if grep -r "VSCE_PAT\|AWS_ACCESS" .github/workflows/ 2>/dev/null | grep -v "secrets\." | grep -v "^#" | grep -q "VSCE_PAT\|AWS_ACCESS"; then
  log_fail "GA-01: Secret hardcodeado encontrado en workflow"
fi

# --- GA-04: Versiones exactas de actions ---
echo -e "${BLUE}[GA-04]${NC} Verificando versiones de actions..."
if grep -r "uses:" .github/workflows/ 2>/dev/null | grep -q "@latest"; then
  log_warn "GA-04: Uso de @latest en actions — usar versión exacta (@v4)"
else
  log_pass "GA-04: Todas las actions usan versiones exactas"
fi

# --- FS-02: Path traversal ---
echo -e "${BLUE}[FS-02]${NC} Verificando path traversal en FileService..."
if grep -r "\.\." src/services/FileService.ts 2>/dev/null | grep -v "//" | grep -q "\.\."; then
  log_warn "FS-02: Posible uso de '..' en rutas de FileService — verificar manualmente"
else
  log_pass "FS-02: No se detectó path traversal en FileService"
fi

# --- RESUMEN ---
echo ""
echo "================================================"
echo -e "  ✅ PASS: ${GREEN}$PASS${NC}  ⚠️  WARN: ${YELLOW}$WARN${NC}  ❌ FAIL: ${RED}$FAIL${NC}"
echo "================================================"
echo ""
if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}🛡️  Auditoría fallida — $FAIL problema(s) crítico(s) encontrado(s)${NC}"
  exit 1
else
  echo -e "${GREEN}🛡️  Auditoría pasada${NC} — $WARN advertencia(s) para revisar"
fi
