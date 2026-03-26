# ⚡ Cómo instalar LuxCode AI

> Extensión de VS Code para generar código con IA — Gemini, Groq, Ollama, OpenAI y más.

---

## Opción 1 — Instalar desde archivo .vsix (recomendado)

### Paso 1 — Descargar el .vsix

Ve a la página de releases y descarga el archivo `.vsix` de la versión más reciente:

👉 **[https://github.com/luisitoys12/luxcode-ai/releases/latest](https://github.com/luisitoys12/luxcode-ai/releases/latest)**

| Versión | Estado | Link |
|---------|--------|------|
| v0.3.0  | ✅ Estable | [Descargar](https://github.com/luisitoys12/luxcode-ai/releases/tag/v0.3.0) |
| v0.2.0  | ✅ Estable | [Descargar](https://github.com/luisitoys12/luxcode-ai/releases/tag/v0.2.0) |
| v0.1.0-beta | 🧪 Beta | [Descargar](https://github.com/luisitoys12/luxcode-ai/releases/tag/v0.1.0-beta) |

### Paso 2 — Instalar en VS Code

**Opción A — Desde la interfaz gráfica:**
1. Abre VS Code
2. Ve a **Extensions** (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Haz clic en el menú `···` (esquina superior derecha del panel)
4. Selecciona **"Install from VSIX..."**
5. Busca y selecciona el archivo `.vsix` que descargaste
6. Haz clic en **Install** y recarga VS Code

**Opción B — Desde la terminal:**
```bash
code --install-extension luxcode-ai-0.3.0.vsix
```

---

## Opción 2 — Instalar desde el código fuente

```bash
# 1. Clonar el repositorio
git clone https://github.com/luisitoys12/luxcode-ai.git
cd luxcode-ai

# 2. Instalar dependencias
npm install

# 3. Compilar
npm run compile

# 4. Empaquetar
npm run package

# 5. Instalar el .vsix generado
code --install-extension luxcode-ai-*.vsix
```

---

## Configurar tu API Key

Una vez instalada la extensión, abre el panel ⚡ en la barra lateral y elige tu proveedor de IA:

| Proveedor | Costo | Cómo obtener la API Key |
|-----------|-------|-------------------------|
| **Google Gemini** | ✅ Gratis | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| **Groq** | ✅ Gratis | [console.groq.com](https://console.groq.com) |
| **Ollama** | ✅ Local (sin internet) | [ollama.com](https://ollama.com) |
| **OpenRouter** | ✅ Gratis con límites | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **OpenAI** | 💳 De pago | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **LM Studio** | ✅ Local | [lmstudio.ai](https://lmstudio.ai) |

### Configurar en VS Code Settings

1. Abre **Settings** (`Ctrl+,`)
2. Busca `LuxCode`
3. Ingresa tu API Key en el campo correspondiente al proveedor elegido

O directamente en `settings.json`:
```json
{
  "luxcode.apiProvider": "gemini",
  "luxcode.geminiApiKey": "TU_API_KEY_AQUÍ"
}
```

---

## Uso básico

Después de instalar y configurar tu API Key:

1. **Panel lateral** — Haz clic en el ícono ⚡ en la barra lateral de VS Code
2. **Comando** — Abre la paleta de comandos (`Ctrl+Shift+P`) y escribe `LuxCode`
3. **Menú contextual** — Selecciona código en el editor, clic derecho → opciones de LuxCode AI

### Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `LuxCode AI: Abrir Panel` | Abre el panel principal |
| `LuxCode AI: Generar Página Web` | Genera HTML+CSS+JS con IA |
| `LuxCode AI: Generar App Móvil` | React Native, Flutter, Ionic |
| `LuxCode AI: Generar App Escritorio` | Tauri, Electron |
| `LuxCode AI: Generar API REST` | Node.js/Express |
| `LuxCode AI: Modo Agente` | Tareas complejas multi-paso |
| `LuxCode AI: Conectar MCP Server` | Conectar servidor MCP |
| `LuxCode AI: Editar con IA` | Edita código seleccionado |
| `LuxCode AI: Explicar Código` | Explica código seleccionado |
| `LuxCode AI: Corregir Bug` | Corrige bugs con IA |

---

## Requisitos

- VS Code **1.85.0** o superior
- Node.js **18+** (solo si instalas desde fuente)
- Una API Key gratuita (Gemini o Groq recomendados para empezar)

---

## ¿Problemas?

Abre un issue en 👉 [github.com/luisitoys12/luxcode-ai/issues](https://github.com/luisitoys12/luxcode-ai/issues)

🌐 Sitio web: [luisitoys12.github.io/luxcode-ai](https://luisitoys12.github.io/luxcode-ai)
