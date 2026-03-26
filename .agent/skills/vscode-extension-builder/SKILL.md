---
name: vscode-extension-builder
description: >
  Este skill define las reglas, patrones y anti-patrones para construir extensiones
  de VS Code de calidad profesional. Úsalo cuando el usuario pida crear comandos,
  WebViews, TreeViews, Language Providers, CI/CD de .vsix, publicación en Marketplace,
  o cualquier tarea relacionada con la API de vscode. También actívalo al revisar
  o auditar código de extensión existente, configurar vsce, o diseñar el pipeline
  de release de una extensión. Fuente: kjgarza/marketplace-claude (adaptado).
---

# VS Code Extension Builder

Reglas opinionadas para extensiones VS Code con TypeScript, vsce y GitHub Actions.
Desviaciones requieren discusión explícita.

## Core Stack

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| API principal | `vscode` | `^1.85.0` | Engine mínimo soportado |
| Lenguaje | TypeScript | `^5.3.0` | `strict: true` siempre |
| Empaquetado | `@vscode/vsce` | `^2.22.0` | Nunca instalar global en CI; usar `npx` |
| Testing | `vitest` | `^1.6.0` | Con `@vitest/coverage-v8` ≥80% |
| Node en CI | Node.js | `20.x` | LTS — siempre pinear versión mayor |

## Estructura de archivos obligatoria

```
extension/
├── src/
│   ├── extension.ts          ← activate() / deactivate() únicamente
│   ├── commands/             ← un archivo por comando registrado
│   ├── panels/               ← WebviewPanel classes
│   ├── providers/            ← TreeView, Language, CodeLens, etc.
│   ├── services/             ← lógica de negocio, llamadas a APIs
│   ├── utils/                ← helpers puros sin dependencias de vscode
│   └── __tests__/
│       ├── setup.ts           ← vi.mock('vscode', ...)
│       ├── unit/              ← tests de services/ y utils/
│       └── integration/       ← tests de commands/ y panels/
├── .github/workflows/
│   ├── ci.yml                ← test + build en push/PR
│   ├── release.yml           ← build + GitHub Release en tag v*
│   └── marketplace-publish.yml ← publish a VS Code Marketplace
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .vscodeignore
```

## package.json — reglas críticas

```jsonc
{
  "engines": { "vscode": "^1.85.0" },  // nunca omitir
  "activationEvents": [],               // dejar vacío — vscode infiere desde contributes
  "main": "./out/extension.js",         // siempre out/, no dist/ ni src/
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest"
    // NO poner "test": "vscode-test" — usar vitest para unit/integration
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "@vitest/coverage-v8": "^1.6.0",
    "@vscode/vsce": "^2.22.0"           // devDep, nunca global
  }
}
```

## WebView — reglas de seguridad [WV]

| Regla | Obligatorio | Detalle |
|-------|------------|--------|
| `WV-01` | ✅ | Nonce de 32 chars aleatorios por cada render |
| `WV-02` | ✅ | CSP con `script-src 'nonce-${nonce}'`, sin `unsafe-inline` ni `unsafe-eval` |
| `WV-03` | ✅ | `connect-src` lista solo dominios explícitos de APIs usadas |
| `WV-04` | ✅ | `style-src 'unsafe-inline' ${webview.cspSource}` para VS Code theme vars |
| `WV-05` | ✅ | `retainContextWhenHidden: true` en paneles con estado |
| `WV-06` | ✅ | `enableScripts: true` solo si hay JS en el webview |
| `WV-07` | ⚠️ | API keys del usuario nunca viajan en el HTML renderizado — solo en `vscode.postMessage` |
| `WV-08` | ✅ | `<html lang="es">` o el idioma de la extensión |

## Accesibilidad WebView [A11Y]

- Todos los `<button>` con `aria-label` descriptivo
- Mensajes dinámicos con `role="status" aria-live="polite"` (info) o `role="alert" aria-live="assertive"` (error)
- `focus-visible` con outline visible en todos los elementos interactivos
- `@media (prefers-reduced-motion: reduce)` en animaciones
- Skeleton loaders para estados de carga
- Sin información transmitida solo por color

## CSS en WebViews [FD]

```css
/* SIEMPRE usar tokens de VS Code primero */
body { color: var(--vscode-foreground); background: var(--vscode-sideBar-background); }
input { background: var(--vscode-input-background); border-color: var(--vscode-input-border); }

/* SIEMPRE definir tokens propios para colores de marca */
:root {
  --ext-primary:  #7c3aed;   /* nunca hex hardcoded fuera de :root */
  --ext-accent:   #3b82f6;
  --radius-md:    6px;
  --transition-base: .2s;
}
```

**Anti-patrones CSS:**
- ❌ Colores hex directamente en selectores (deben estar en `:root`)
- ❌ `!important` (excepto override de VS Code)
- ❌ `position: fixed` en WebViews (el scroll se rompe)
- ❌ `eval()` ni `innerHTML` con contenido de usuario

## API de vscode — patrones correctos [API]

```typescript
// API-01: Registro de comandos en activate(), disposables en context
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('ext.myCmd', () => myCommand(context))
  );
}

// API-02: Configuración con fallback tipado
const provider = vscode.workspace
  .getConfiguration('myExt')
  .get<string>('provider', 'gemini');  // segundo arg es el default

// API-03: Secrets API para API keys (no globalState)
await context.secrets.store('apiKey', value);       // guardar
const key = await context.secrets.get('apiKey');    // leer
await context.secrets.delete('apiKey');             // borrar

// API-04: Mostrar errores con contexto
vscode.window.showErrorMessage(`MyExt: ${err.message}`);
// NUNCA: console.error con API keys en el mensaje

// API-05: Dispose explícito de paneles
public dispose() {
  MyPanel.currentPanel = undefined;
  this._panel.dispose();
  while (this._disposables.length) {
    const d = this._disposables.pop();
    if (d) d.dispose();
  }
}
```

## Secrets — reglas de seguridad [SK]

| Regla | Descripción |
|-------|------------|
| `SK-01` | API keys en `context.secrets` (cifrado), nunca en `globalState` ni código |
| `SK-02` | Nunca `console.log` con keys, nunca en mensajes de error |
| `SK-03` | Fetch con `AbortController` + timeout de 30s en todas las llamadas |
| `SK-04` | URLs de Ollama/LM Studio validadas — solo `localhost` y `127.0.0.1` |
| `SK-05` | `JSON.parse` siempre en `try/catch` |
| `SK-06` | Gemini key en query string es aceptable solo en extensión local; migrar a `Authorization` header si se añade modo servidor |

## CI/CD — pipeline obligatorio [CI]

```
push / tag v*
  │
  ├─▶ job: test-gate ─────────── npm ci → npm test → npm run test:coverage
  │          │                   [bloquea si tests fallan o coverage < 80%]
  │          ↓
  ├─▶ job: build ──────────────── npm run compile → npx vsce package
  │          │                   upload .vsix como artifact
  │          ↓
  └─▶ job: release / publish ─── GitHub Release + vsce publish (si tag)
```

**Reglas de workflow:**
- `cache: 'npm'` en todos los `setup-node` steps
- `npm ci` (no `npm install`) en CI
- `npx @vscode/vsce` (no global install)
- Verificar `VSCE_PAT` secret antes de publicar con `exit 1` si vacío
- Validar semver con regex antes de `npm version`
- CHANGELOG dinámico: leer sección con `awk` antes de crear GitHub Release

## .vscodeignore — qué excluir del .vsix

```
.vscode/
.github/
src/
**/__tests__/
**/__fixtures__/
**/__mocks__/
*.test.ts
vitest.config.ts
tsconfig.json
CHANGELOG.md
.agent/
skills.sh
```

## Testing — patrones [BT]

```typescript
// Mock obligatorio de vscode en setup.ts
vi.mock('vscode', () => ({
  window: { showErrorMessage: vi.fn(), createWebviewPanel: vi.fn() },
  workspace: { getConfiguration: vi.fn(() => ({ get: vi.fn((k, d) => d) })) },
  commands: { registerCommand: vi.fn() },
  ViewColumn: { One: 1, Beside: 2 },
}));

// Fetch mock en cada test
(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
  ok: true, status: 200,
  json: async () => ({ ... }),
} as Response);

// Nomenclatura obligatoria
it('should [resultado] when [condición]', async () => { ... });

// beforeEach limpio
beforeEach(() => { vi.clearAllMocks(); });
```

**Coverage mínimo (`vitest.config.ts`):**
```typescript
thresholds: { statements: 80, branches: 70, functions: 80, lines: 80 }
```

## Publicación en Marketplace — checklist

- [ ] `publisher` en `package.json` coincide con cuenta de Azure DevOps
- [ ] `icon` apunta a PNG de 128×128px
- [ ] `README.md` tiene capturas de pantalla y GIF demo
- [ ] `CHANGELOG.md` actualizado con la versión
- [ ] `version` en `package.json` es semver (X.Y.Z)
- [ ] `VSCE_PAT` secret configurado en GitHub Actions
- [ ] `.vscodeignore` excluye `src/`, tests, y archivos de dev
- [ ] `vsce package --no-dependencies` — sin bundlar node_modules
- [ ] Tests pasan al 100% antes de publicar

## Anti-patrones (nunca hacer)

- ❌ `activationEvents: ["*"]` — activa en cualquier archivo, mata rendimiento
- ❌ `vsce` instalado globalmente en CI (`npm install -g`)
- ❌ API keys en `globalState`, `workspaceState`, o hardcoded
- ❌ `innerHTML` con contenido no sanitizado en WebViews
- ❌ `eval()` o `new Function()` en WebViews
- ❌ Publicar sin pasar tests
- ❌ `npm install` en CI (usar `npm ci`)
- ❌ Skip de CSP nonce en WebViews
- ❌ `console.log` con datos sensibles del usuario
- ❌ Fetch sin timeout ni AbortController

## Referencias

- [VS Code API](https://code.visualstudio.com/api/references/vscode-api)
- [WebView API](https://code.visualstudio.com/api/extension-guides/webview)
- [vsce CLI](https://github.com/microsoft/vscode-vsce)
- [Extension Marketplace Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- Fuente de estructura: [kjgarza/marketplace-claude](https://github.com/kjgarza/marketplace-claude) (rapid-mvp skill format)
