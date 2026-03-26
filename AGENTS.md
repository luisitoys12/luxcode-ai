# LuxCode AI — Agent Instructions

> Este archivo sigue el estándar de Vercel Agent Readability Spec y es leído automáticamente
> por Copilot, Claude Code, Cursor, Cline, Kilo.ai, Gemini CLI, OpenCode y Windsurf.

## Proyecto

**LuxCode AI** es una extensión de VS Code open source que genera proyectos completos
(web, mobile, desktop, APIs) desde lenguaje natural usando 6+ proveedores de IA.

- **Repo:** https://github.com/luisitoys12/luxcode-ai
- **Web:** https://luisitoys12.github.io/luxcode-ai
- **Versión actual:** 0.3.0
- **Licencia:** MIT

---

## Arquitectura

```
luxcode-ai/
├── src/
│   ├── extension.ts              # Entry point, registro de comandos
│   ├── panels/
│   │   └── LuxCodePanel.ts       # WebView sidebar + panel principal
│   └── services/
│       ├── AIService.ts          # Llamadas a todos los proveedores IA
│       ├── FileService.ts        # Escritura de archivos generados
│       ├── MCPService.ts         # Model Context Protocol integration
│       └── AgentService.ts       # Runner de tareas multi-paso
├── docs/
│   └── index.html                # Sitio GitHub Pages
├── .github/workflows/
│   ├── auto-release-all.yml      # Publica v0.1.0-beta, v0.2.0, v0.3.0
│   ├── marketplace-publish.yml   # Publica en VS Code Marketplace
│   ├── aws-deploy.yml            # Deploy S3 + CloudFront
│   ├── ci.yml                    # Build & test en cada push
│   └── preview.yml               # Preview en PRs
├── skills.sh                     # Setup de todas las dependencias
├── SKILL.md                      # Vercel agent skill definition
├── AGENTS.md                     # Este archivo
├── llms.txt                      # Contexto para LLMs
├── package.json
└── tsconfig.json
```

---

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `luxcode.generateWeb` | Generar página web completa (HTML+CSS+JS) |
| `luxcode.generateMobile` | Generar app móvil (React Native / Flutter / Ionic) |
| `luxcode.generateDesktop` | Generar app escritorio (Tauri / Electron) |
| `luxcode.generateAPI` | Generar API REST Node.js/Express |
| `luxcode.agentTask` | Modo agente: tarea compleja multi-paso |
| `luxcode.mcpConnect` | Conectar servidor MCP externo |
| `luxcode.editWithAI` | Editar código seleccionado con IA |
| `luxcode.explainCode` | Explicar código en Markdown |
| `luxcode.fixBug` | Corregir bug con mensaje de error |

---

## Proveedores de IA

| Provider | Modelo | Costo | Config key |
|---|---|---|---|
| Google Gemini | gemini-2.0-flash | Gratis | `luxcode.geminiApiKey` |
| Groq | llama-3.3-70b-versatile | Gratis | `luxcode.groqApiKey` |
| Ollama | llama3 / codellama / mistral... | Local | `luxcode.ollamaUrl` |
| LM Studio | cualquier GGUF | Local | `luxcode.lmstudioUrl` |
| OpenRouter | deepseek/deepseek-coder | Free/Paid | `luxcode.openrouterApiKey` |
| OpenAI | gpt-4o | Pago | `luxcode.openaiApiKey` |

---

## Guías para agentes al modificar el código

### AIService.ts
- Siempre leer antes de agregar un proveedor
- Agregar al `switch` en `callAI()` y al enum en `package.json`
- Todos los métodos deben ser `private async` y retornar `Promise<string>`
- Manejar errores con `throw new Error('Proveedor: mensaje')`

### FileService.ts
- Recibe `Record<string, string>` (filename → content)
- Crea una carpeta con timestamp en el workspace
- Luego abre la carpeta en VS Code automáticamente

### LuxCodePanel.ts
- UI pura en HTML/CSS/JS vanilla dentro del WebView
- Usa variables CSS de VS Code (`--vscode-foreground`, etc.)
- Comunicación con `vscode.postMessage()` y `onDidReceiveMessage()`

### AgentService.ts
- Planifica tareas en JSON con `planTask(goal)`
- Ejecuta steps secuencialmente con delay de 400ms entre cada uno
- Si el JSON falla, hace fallback a un solo step genérico

### MCPService.ts
- Protocolo JSON-RPC 2.0 estándar
- `connectServer(name, url)` descubre tools via `tools/list`
- LuxCode se expone como servidor MCP con 6 herramientas nativas

---

## Skills instalados en este proyecto

| Skill | Fuente | Comando |
|---|---|---|
| Web Interface Guidelines | vercel-labs/web-interface-guidelines | `/web-interface-guidelines` |

Ver `SKILL.md` para instrucciones completas de uso.

---

## Estilo de código

- TypeScript con `strict: false`, `skipLibCheck: true`
- `async/await` sobre Promises
- Strings de UI en español (ES-MX)
- Mensajes de error: `'Proveedor: descripción del error'`
- Sin dependencias de producción (solo `devDependencies`)

---

## Secrets requeridos (GitHub Actions)

| Secret | Uso |
|---|---|
| `VSCE_PAT` | Publicar en VS Code Marketplace |
| `AWS_ACCESS_KEY_ID` | Deploy a S3 |
| `AWS_SECRET_ACCESS_KEY` | Deploy a S3 |
| `AWS_S3_BUCKET` | Nombre del bucket |
| `AWS_CLOUDFRONT_ID` | Invalidar caché CDN |

Guía completa en `SECRETS.md`.
