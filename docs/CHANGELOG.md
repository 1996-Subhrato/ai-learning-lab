# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.5.0] - 2026-07-18
### Added
- Backend streaming implementation for Gemini responses (`generateContentStream`).
- Chunked transfer encoding via Express `res.write()`.

### Changed
- Switched from buffering the full AI response in memory to immediately streaming chunks.
- Improved backend error handling for partially sent responses.
- Hardened backend streaming route with prompt validation, `Cache-Control` headers, and full stack trace logging.


## [v0.4.0] - 2026-07-18
### Added
- Modern responsive UI.
- ChatGPT/Claude-inspired layout.
- Sidebar navigation.
- Modern input box.

### Changed
- Improved spacing and typography.
- Better message styling and responsive design.

## [v0.3.0] - 2026-07-12
### Added
- Markdown rendering support.
- Syntax highlighting for code blocks.
- `marked` library integration.
- `highlight.js` integration.

### Changed
- Formatted AI text responses into readable HTML.

## [v0.2.0] - 2026-07-09
### Added
- Frontend chat page.
- Fetch API communication layer.
- Express API routes for Gemini.
- Basic conversation flow (prompt to response).

## [v0.1.0] - 2026-07-05
### Added
- Express.js project initialization.
- Environment configuration (`.env`).
- Basic folder structure (`routes`, `views`, `public`).
- Gemini API key setup and SDK integration.
- OpenAI SDK integration.
