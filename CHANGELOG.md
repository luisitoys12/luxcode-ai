# Changelog

Todos los cambios notables de LuxCode AI siguen [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

## [0.4.0] - 2026-03-26

### 🔐 Seguridad
- **[SK-01]** API keys migradas a `context.secrets` (cifrado nativo VS Code) — ya no se guardan en `settings.json` en texto plano
- Auto-migración: limpia keys antiguas de `workspaceState` al guardar
- Mensaje de confirmación indica almacenamiento seguro 🔐

### ✨ Features
- Panel WebView con accesibilidad completa (`aria-label`, `aria-live`, `focus-visible`, `prefers-reduced-motion`)
- 6 Agent Skills activos: `web-interface-guidelines`, `security-best-practices`, `react-nextjs`, `frontend-design`, `backend-testing`, `vscode-extension-builder`
- Skill `vscode-extension-builder` instalado desde kjgarza/marketplace-claude format

### 🌐 Web
- Landing page v0.4.0 operativa en [luisitoys12.github.io/luxcode-ai](https://luisitoys12.github.io/luxcode-ai)
- Hero con demo window interactiva, stats, features grid, providers, skills, install steps
- GitHub Pages auto-deploy con inyección de versión desde `package.json`

### ⚙️ CI/CD
- **[CI-01]** Job `test-gate` bloquea build y release si tests fallan
- **[CI-02]** Cache npm en todos los jobs — builds ~3x más rápidos
- **[CI-03]** `vsce` como `devDependency` via `npx` — sin global install en CI
- **[RL-01]** Tests obligatorios antes de release y publish
- **[RL-03]** CHANGELOG dinámico en GitHub Release via `awk`
- **[MP-01]** Test gate en marketplace-publish.yml
- **[MP-02]** Verificación de `VSCE_PAT` con mensaje de error claro
- **[MP-03]** Validación semver con regex antes de `npm version`

### 📦 Dependencies
- Agregado `vitest@^1.6.0` a `devDependencies`
- Agregado `@vitest/coverage-v8@^1.6.0` a `devDependencies`
- Scripts: `test`, `test:coverage`, `test:watch`

### 📋 Checklist de publicación
- [x] 17 tests pasando
- [x] Coverage ≥80%
- [x] CHANGELOG actualizado
- [x] Landing web operativa
- [x] API keys cifradas con Secrets API
- [x] CI/CD auditado y fixeado

## [0.3.0] - 2026-03-01

### ✨ Features
- Modo Agente con planificación multi-paso
- Soporte MCP Servers
- Editor IA: editar, explicar y corregir bugs
- Proveedor OpenRouter (100+ modelos)

## [0.2.0] - 2026-02-01

### ✨ Features
- Generador de APIs REST (Node.js + Express)
- Soporte LM Studio local
- Generación de apps Desktop (Tauri, Electron)

## [0.1.0] - 2026-01-15

### ✨ Features
- Primera versión pública
- Generación de proyectos Web, Móvil
- Soporte Gemini, Groq, Ollama, OpenAI
- Panel WebView en sidebar
