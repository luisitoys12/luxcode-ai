# ⚡ LuxCode AI

> Crea páginas web completas con IA directamente desde VS Code

![Version](https://img.shields.io/badge/version-0.1.0--beta-7c3aed)
![License](https://img.shields.io/badge/license-MIT-3b82f6)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85%2B-0078d4)

## 🚀 ¿Qué hace LuxCode AI?

LuxCode AI es una extensión de VS Code que utiliza inteligencia artificial (Google Gemini o OpenAI GPT-4o) para **generar páginas web completas** desde una descripción de texto, y también para **mejorar código existente** con instrucciones en lenguaje natural.

## ✨ Funciones

- 🌐 **Generar páginas web** — Describe tu idea, la IA genera HTML + CSS + JS completo
- ✏️ **Editar con IA** — Selecciona cualquier fragmento de código y pídele mejoras
- 🔑 **Tu propia API Key** — Usa tu cuenta de Gemini (gratis) u OpenAI
- 🎨 **Panel integrado** — Sidebar con interfaz visual dentro de VS Code
- 📁 **Organización automática** — Los archivos se guardan en carpetas con timestamp

## 📦 Instalación

### Opción 1: VS Code Marketplace
> Próximamente...

### Opción 2: Manual (VSIX)
```bash
git clone https://github.com/luisitoys12/luxcode-ai
cd luxcode-ai
npm install
npm run compile
npx vsce package
# Instala el .vsix desde VS Code: Extensions > Install from VSIX
```

## ⚙️ Configuración

1. Abre VS Code → `Cmd/Ctrl + ,` (Settings)
2. Busca **LuxCode AI**
3. Ingresa tu API Key:
   - **Gemini**: [Obtén tu key gratis aquí](https://aistudio.google.com/app/apikey)
   - **OpenAI**: [Obtén tu key aquí](https://platform.openai.com/api-keys)

O usa el **panel lateral** de LuxCode AI para guardar tu key directamente.

## 🎮 Uso

### Generar una página
1. Abre el panel de LuxCode AI (icono ⚡ en la barra lateral)
2. Escribe la descripción de tu página
3. Clic en **🚀 Generar con IA**
4. Los archivos se crean automáticamente en tu workspace

### Editar código con IA
1. Selecciona cualquier código en el editor
2. Clic derecho → **LuxCode AI: Editar con IA**
3. Escribe la instrucción (ej: "hazlo responsive")
4. El código se reemplaza automáticamente

### Comandos disponibles
| Comando | Descripción |
|---|---|
| `LuxCode AI: Abrir Panel` | Abre el panel principal |
| `LuxCode AI: Generar Página Web` | Genera desde descripción |
| `LuxCode AI: Editar con IA` | Mejora código seleccionado |

## 🔑 APIs Soportadas

| Proveedor | Modelo | Costo |
|---|---|---|
| Google Gemini | gemini-2.0-flash | Gratis (con límites) |
| OpenAI | gpt-4o | De pago |

## 🛣️ Roadmap

- [ ] Vista previa en vivo dentro de VS Code
- [ ] Soporte para React/Vue/Svelte components
- [ ] Historial de generaciones
- [ ] Exportar como ZIP
- [ ] Publicación en VS Code Marketplace

## 📄 Licencia

MIT — Desarrollado con ❤️ por [@luisitoys12](https://github.com/luisitoys12)
