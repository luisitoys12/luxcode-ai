# Changelog

## [0.3.0] - 2026-03-26

### 🤖 Nuevo — Modo Agente
- **AgentService**: Planifica y ejecuta tareas complejas en múltiples pasos automáticamente
- Inspirado en Kilo.ai, Cline y GitHub Copilot Agent Mode
- El agente descompone cualquier objetivo en 3-6 pasos y los ejecuta secuencialmente

### 🔌 Nuevo — MCP (Model Context Protocol)
- **MCPService**: Conecta servidores MCP externos al flujo de generación
- LuxCode se expone como servidor MCP para otros agentes (Copilot, Claude, Kilo, Cline)
- 6 herramientas MCP nativas: generate_web_page, generate_mobile_app, generate_desktop_app, generate_api, edit_code, fix_bug
- Compatible con protocolo JSON-RPC 2.0 estándar

### 🔌 Nuevo — Generador de APIs
- Genera proyectos Node.js/Express completos con auth, rutas, middleware y README
- Especifica rutas custom o deja que la IA las decida

### 📄 Nuevo — AGENTS.md + llms.txt
- `AGENTS.md`: Instrucciones para agentes IA sobre la arquitectura del proyecto
- `llms.txt`: Contexto optimizado para LLMs según el estándar de Jeremy Howard

### 🦙 Nuevos modelos Ollama
- Qwen 2.5 Coder (excelente para generación de código)
- Soporte completo para 7 modelos locales

### ⚡ Mejoras
- Panel rediseñado con sección Agente y MCP
- Código refactorizado con función `runWithProgress` compartida
- Mejor manejo de errores por proveedor

## [0.2.0] - 2026-03-26
- Generador de Apps Móviles y Escritorio
- 6 proveedores de IA (Groq, OpenRouter, Ollama, LM Studio)
- Comandos: Explicar código, Corregir bug

## [0.1.0-beta] - 2026-03-26
- Primera versión: generador web, panel lateral, Gemini + OpenAI
