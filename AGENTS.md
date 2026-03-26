# LuxCode AI — Agent Instructions

This file defines how AI agents (Copilot, Claude, Gemini, Kilo, Cline, etc.) should understand and interact with this codebase.

## Project Overview
LuxCode AI is a VS Code extension that generates web pages, mobile apps, and desktop applications using AI. It supports 6+ AI providers including local models via Ollama and LM Studio.

## Architecture
```
src/
  extension.ts          # Entry point, command registration
  panels/
    LuxCodePanel.ts     # WebView panel & sidebar UI
  services/
    AIService.ts        # All AI provider calls (Gemini, OpenAI, Groq, Ollama, LMStudio, OpenRouter)
    FileService.ts      # Write generated files to workspace
    MCPService.ts       # MCP server integration
    AgentService.ts     # Multi-step agentic task runner
docs/
  index.html            # GitHub Pages website
.github/workflows/      # CI/CD: release, preview, pages
```

## Commands Available
- `luxcode.openPanel` — Open main panel
- `luxcode.generateWeb` — Generate web page
- `luxcode.generateMobile` — Generate mobile app
- `luxcode.generateDesktop` — Generate desktop app
- `luxcode.generateAPI` — Generate Node.js/Express API
- `luxcode.agentTask` — Run multi-step agentic task
- `luxcode.mcpConnect` — Connect MCP server
- `luxcode.editWithAI` — Edit selected code
- `luxcode.explainCode` — Explain selected code
- `luxcode.fixBug` — Fix bug in selected code

## Agent Guidelines
- Always read `src/services/AIService.ts` before modifying AI provider logic
- When adding a new provider, add it to the `callAI()` switch and to `package.json` enum
- The WebView UI is in `LuxCodePanel.getWebviewContent()` — pure HTML/CSS/JS
- File generation uses `FileService.save()` — always preserve the multi-file structure
- MCP tools follow the `@modelcontextprotocol/sdk` standard

## Style Guide
- TypeScript strict mode
- Async/await over Promises
- All user-facing strings in Spanish (ES) by default
- Error messages must include the provider name and error message
