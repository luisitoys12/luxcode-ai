# ⚡ LuxCode AI

> El mejor generador de apps con IA para VS Code — Web, Móvil y Escritorio

![Version](https://img.shields.io/badge/version-0.2.0-7c3aed)
![License](https://img.shields.io/badge/license-MIT-3b82f6)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85%2B-0078d4)

## 🚀 ¿Qué genera LuxCode AI?

| Tipo | Opciones |
|---|---|
| 🌐 Página Web | Landing, Portfolio, Dashboard, Blog, E-commerce, Radio, PWA |
| 📱 App Móvil | React Native, Flutter, Ionic |
| 🖥 App Escritorio | Tauri, Electron, Neutralino.js |

## 🔌 Proveedores de IA soportados

| Proveedor | Modelo | Costo | Tipo |
|---|---|---|---|
| Google Gemini | gemini-2.0-flash | Gratis | ☁️ Cloud |
| Groq | llama-3.3-70b-versatile | Gratis | ☁️ Cloud |
| OpenAI | gpt-4o | De pago | ☁️ Cloud |
| OpenRouter | 100+ modelos | Gratis/Pago | ☁️ Cloud |
| **Ollama** | Llama3, Mistral, CodeLlama, DeepSeek, Phi-3... | **Gratis** | 🏠 Local |
| **LM Studio** | Cualquier modelo GGUF | **Gratis** | 🏠 Local |

## ⚙️ Instalación

```bash
git clone https://github.com/luisitoys12/luxcode-ai
cd luxcode-ai
npm install
npm run compile
npx vsce package
```

Luego en VS Code: `Extensions > ··· > Install from VSIX`

## 🦙 Usar con Ollama (gratis, sin internet)

```bash
# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelo
ollama pull llama3          # General (recomendado)
ollama pull codellama       # Especializado en código
ollama pull deepseek-coder  # Excelente para generación de apps
```

En LuxCode AI selecciona **Ollama** y elige el modelo. ¡Sin internet ni API Key!

## 🎮 Comandos

| Comando | Descripción |
|---|---|
| `LuxCode AI: Generar Página Web` | Web completa desde descripción |
| `LuxCode AI: Generar App Móvil` | React Native / Flutter / Ionic |
| `LuxCode AI: Generar App de Escritorio` | Tauri / Electron / Neutralino |
| `LuxCode AI: Editar con IA` | Mejora código seleccionado |
| `LuxCode AI: Explicar Código` | Explica el código en Markdown |
| `LuxCode AI: Corregir Bug` | Detecta y corrige errores |

## 📄 Licencia

MIT — Desarrollado con ❤️ por [@luisitoys12](https://github.com/luisitoys12) · Irapuato, México 🇲🇽
