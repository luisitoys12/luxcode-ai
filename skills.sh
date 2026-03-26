#!/usr/bin/env bash
# =============================================================================
# skills.sh — LuxCode AI — Setup completo de herramientas
# Instala y valida TODAS las dependencias necesarias para operar
# Uso: bash skills.sh
# Compatible: Ubuntu/Debian, macOS, GitHub Actions
# =============================================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log()  { echo -e "${GREEN}\u2705 $1${NC}"; }
warn() { echo -e "${YELLOW}\u26a0\ufe0f  $1${NC}"; }
err()  { echo -e "${RED}\u274c $1${NC}"; }
info() { echo -e "${BLUE}\u2139\ufe0f  $1${NC}"; }
title(){ echo -e "\n${PURPLE}\u26a1 $1${NC}"; }

echo ""
echo -e "${PURPLE}==================================================${NC}"
echo -e "${PURPLE}  ⚡ LuxCode AI — Skills Setup v0.3.0          ${NC}"
echo -e "${PURPLE}==================================================${NC}"
echo ""

# --------------------------------------------------
title "SKILL 1: Node.js & npm"
# --------------------------------------------------
if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  log "Node.js instalado: $NODE_VER"
else
  warn "Node.js no encontrado. Instalando via nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  log "Node.js 20 instalado"
fi

if command -v npm &>/dev/null; then
  NPM_VER=$(npm -v)
  log "npm instalado: v$NPM_VER"
else
  err "npm no encontrado"; exit 1
fi

# --------------------------------------------------
title "SKILL 2: TypeScript"
# --------------------------------------------------
if command -v tsc &>/dev/null; then
  TSC_VER=$(tsc -v)
  log "TypeScript instalado: $TSC_VER"
else
  warn "Instalando TypeScript..."
  npm install -g typescript
  log "TypeScript instalado"
fi

# --------------------------------------------------
title "SKILL 3: @vscode/vsce (VS Code Extension Publisher)"
# --------------------------------------------------
if command -v vsce &>/dev/null; then
  VSCE_VER=$(vsce --version)
  log "vsce instalado: v$VSCE_VER"
else
  warn "Instalando vsce..."
  npm install -g @vscode/vsce
  log "vsce instalado"
fi

# --------------------------------------------------
title "SKILL 4: AWS CLI"
# --------------------------------------------------
if command -v aws &>/dev/null; then
  AWS_VER=$(aws --version 2>&1 | head -1)
  log "AWS CLI instalado: $AWS_VER"
else
  warn "AWS CLI no encontrado. Instalando..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    curl -sL "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o /tmp/AWSCLIV2.pkg
    sudo installer -pkg /tmp/AWSCLIV2.pkg -target /
  else
    curl -sL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
    unzip -q /tmp/awscliv2.zip -d /tmp/aws-install
    sudo /tmp/aws-install/aws/install
  fi
  log "AWS CLI instalado"
fi

# --------------------------------------------------
title "SKILL 5: Git"
# --------------------------------------------------
if command -v git &>/dev/null; then
  GIT_VER=$(git --version)
  log "Git instalado: $GIT_VER"
else
  warn "Instalando git..."
  if [[ "$OSTYPE" == "darwin"* ]]; then brew install git
  else sudo apt-get install -y git; fi
  log "Git instalado"
fi

# --------------------------------------------------
title "SKILL 6: jq (JSON processor)"
# --------------------------------------------------
if command -v jq &>/dev/null; then
  log "jq instalado: $(jq --version)"
else
  warn "Instalando jq..."
  if [[ "$OSTYPE" == "darwin"* ]]; then brew install jq
  else sudo apt-get install -y jq; fi
  log "jq instalado"
fi

# --------------------------------------------------
title "SKILL 7: Dependencias del proyecto"
# --------------------------------------------------
if [ -f "package.json" ]; then
  info "Instalando dependencias npm..."
  npm install
  log "Dependencias instaladas"
else
  err "package.json no encontrado. Ejecuta desde la raiz del proyecto."; exit 1
fi

# --------------------------------------------------
title "SKILL 8: Compilar TypeScript"
# --------------------------------------------------
info "Compilando TypeScript..."
npm run compile
log "Compilaci\u00f3n exitosa → out/"

# --------------------------------------------------
title "SKILL 9: Empaquetar extensi\u00f3n"
# --------------------------------------------------
info "Empaquetando .vsix..."
vsce package --no-dependencies --allow-missing-publisher
VSIX_FILE=$(ls *.vsix 2>/dev/null | head -1)
if [ -n "$VSIX_FILE" ]; then
  log "Empaquetado: $VSIX_FILE ($(du -h $VSIX_FILE | cut -f1))"
else
  err "No se gener\u00f3 el .vsix"; exit 1
fi

# --------------------------------------------------
title "SKILL 10: Verificar secrets / env vars"
# --------------------------------------------------
check_secret() {
  local name=$1
  local val=${!name}
  if [ -n "$val" ]; then
    log "$name configurado (${#val} chars)"
  else
    warn "$name no configurado (opcional para deploy)"
  fi
}
check_secret "VSCE_PAT"
check_secret "AWS_ACCESS_KEY_ID"
check_secret "AWS_SECRET_ACCESS_KEY"
check_secret "AWS_S3_BUCKET"

# --------------------------------------------------
title "RESUMEN FINAL"
# --------------------------------------------------
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✅ Todos los skills verificados               ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "  Node.js:  $(node -v)"
echo -e "  npm:      v$(npm -v)"
echo -e "  tsc:      $(tsc -v)"
echo -e "  vsce:     v$(vsce --version)"
echo -e "  AWS CLI:  $(aws --version 2>&1 | head -1 | awk '{print $1}')"
echo -e "  Git:      $(git --version | awk '{print $3}')"
echo ""
echo -e "  .vsix:    ${VSIX_FILE:-no generado}"
echo ""
echo -e "${BLUE}Para publicar en Marketplace:${NC}"
echo -e "  export VSCE_PAT=tu_token"
echo -e "  vsce publish"
echo ""
echo -e "${BLUE}Para subir a AWS S3:${NC}"
echo -e "  aws s3 cp *.vsix s3://\$AWS_S3_BUCKET/releases/"
echo ""
