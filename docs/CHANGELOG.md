# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v4.2.0] - 2026-07-18
### Added
- **In-Memory Deletion:** The Delete Confirmation Modal now successfully removes chats from the active application session.
- **Smart Active State Fallback:** If the currently active chat is deleted, the application seamlessly transitions to the nearest available chat.
- **Empty State Safeguard:** If the final remaining chat is deleted, the application instantly spins up a fresh, blank chat to prevent breaking the UI layout.


## [v4.1.0] - 2026-07-18
### Added
- **Delete Confirmation Modal:** Added a dedicated confirmation dialog that intercepts the delete action, asking the user to confirm before proceeding.
- **Dynamic Context:** The modal clearly displays the specific title of the chat you are about to delete.
- **UX Enhancements:** Clicking outside the modal or pressing the Escape key safely cancels the deletion process.


## [v4.0.0] - 2026-07-18
### Added
- **Delete UI:** Added a contextual "Delete" action button (trash icon) to all sidebar chat items, right next to the Rename button.
- **Danger States:** Implemented specific danger-themed CSS hover states for the delete action to visually distinguish it from safe actions.


## [v3.3.0] - 2026-07-18
### Added
- **Form Validation:** The Rename Modal now strictly rejects empty strings, whitespace-only strings, and submissions that match the current title.
- **Inline Error UI:** Users now receive clear, inline error messages within the modal itself (e.g., "Chat name cannot be empty.") without triggering browser alerts.
- **Auto-Clearing Errors:** The error message intelligently disappears as soon as the user starts typing again.


## [v3.2.0] - 2026-07-18
### Added
- **In-Memory Renaming:** The Rename Modal now fully updates the chat session title in active memory.
- **Optimistic UI:** The sidebar instantly updates to display the new chat title upon saving.
- **Validation:** Added basic validation to prevent renaming chats to empty strings or pure whitespace.


## [v3.1.0] - 2026-07-18
### Added
- **Rename Modal:** Replaced the native browser prompt with a custom, accessible DOM modal for renaming chats.
- **UX Enhancements:** Added support for closing the Rename modal by clicking the backdrop overlay or pressing the Escape key.


## [v3.0.0] - 2026-07-18
### Added
- **Phase 3 UI:** Added a contextual "Rename" action button (pencil icon) to all sidebar chat items. The button reveals itself gracefully on hover. Currently wired to a functional placeholder prompt in preparation for persistence wiring.


## [v2.4.0] - 2026-07-18
### Changed
- **Performance Optimization:** Refactored state-mutation chains to prevent double-writes to `LocalStorage` during chat creation and initialization.
- **Performance Optimization:** Added an early return guard clause to active chat selection to prevent useless disk writes if the user clicks the currently active chat.


## [v2.3.0] - 2026-07-18
### Added
- Introduced explicit storage versioning (`STORAGE_VERSION = 1`) to prepare for future schema migrations.
### Fixed
- Improved application stability by gracefully clearing corrupted, empty, or outdated local storage payloads upon detection, automatically bootstrapping the user back into a healthy state without throwing fatal exceptions.


## [v2.2.0] - 2026-07-18
### Fixed
- Fixed an edge case where the startup initialization block would detect and repair a corrupted `currentChatId` but fail to save the repaired value back to LocalStorage.


## [v2.1.0] - 2026-07-18
### Added
- Fully automated application state restoration on startup. 
### Fixed
- Fixed an edge case where a corrupted `currentChatId` could break UI initialization. The system now validates the active chat against the loaded array and falls back to the most recent conversation if a mismatch occurs.


## [v2.0.0] - 2026-07-18
### Added
- Phase 2: LocalStorage persistence! The application now automatically saves chat sessions, titles, and active context directly in the browser. Refreshing the page will no longer clear your conversations.
- Dedicated client-side storage architecture (`loadChatSessions`, `saveChatSessions`, `clearStoredChats`).


## [v1.5.0] - 2026-07-18
### Added
- Implemented `isGenerationInProgress()` global safety lock to protect background state mutations.
### Fixed
- Fixed critical race condition where users could switch active chats mid-generation, causing the background stream to corrupt the history array of the newly selected chat. Chat switching is now safely ignored until the active generation completes or is aborted.
- Prevented double-click rapid generation bugs by strictly evaluating `hasRegeneratableResponse()` and `isGenerationInProgress()` locks.


## [v1.4.0] - 2026-07-18
### Added
- Fully functional "Regenerate" workflow allowing users to replace the last assistant response with a newly generated completion.
### Changed
- Major abstraction of the core chat loop: Extracted streaming HTTP request, chunk decoding, and DOM mutation lifecycle out of `sendMessage()` into a reusable `streamChatResponse()` function.


## [v1.3.2] - 2026-07-18
### Added
- Pure, read-only state helpers to deterministically query conversation structure (`getLastAssistantMessage`, `getLastAssistantMessageIndex`, `getLastUserMessage`, `hasRegeneratableResponse`).


## [v1.3.1] - 2026-07-18
### Changed
- Extracted inline API payload generation out of `sendMessage()` into a dedicated, reusable pure function: `buildConversationPayload()`.
- Standardized payload filtering rules (excluding aborted or incomplete nodes) into a central business logic helper to prepare for upcoming Regenerate feature integrations.


## [v1.3.0] - 2026-07-18
### Added
- "Regenerate" UI button injected exclusively beneath the most recent completed AI response.
- `message-actions` flex container wrapper in the DOM to seamlessly group Copy and Regenerate tools side-by-side.
- Conditional rendering logic to dynamically calculate the `isLastAssistantMessage` node during historical session loads.


## [v1.2.0] - 2026-07-18
### Added
- "Copy AI Response" button natively integrated into completed assistant messages.
- Accessible, transient button states ("Copy" -> "Copied" -> "Copy") providing immediate user feedback.
- Strict clipboard logic utilizing `navigator.clipboard.writeText()` to ensure pristine Markdown formatting is retained without bleeding DOM artifacts.


## [v1.1.1] - 2026-07-18
### Changed
- Abstracted the chat title prompt into a dedicated module (`prompts/generateChatTitlePrompt.js`).
- Refactored `/google/title` to communicate with the Gemini API using the standardized `contents` array structure.
- Implemented strict output sanitization (`utils/sanitizeChatTitle.js`) to strip erratic formatting from LLM responses before returning them to the client.


## [v1.1.0] - 2026-07-18
### Added
- Contextual, AI-generated sidebar chat titles replacing "New Chat".
- Dedicated `POST /google/title` backend route specifically prompted to return 3-5 word summaries.
- Asynchronous, non-blocking title generation architecture triggered exclusively after the first successful stream completes.


## [v1.0.1] - 2026-07-18
### Changed
- Centralized UI synchronization via `refreshUI()`.
- Extracted Markdown rendering into the reusable `renderMarkdown()` helper, eliminating duplication between the streaming logic and historical conversation loads.
- Replaced inline JavaScript DOM styling with strict CSS `.active` class application for sidebar highlights.
- De-structured `renderSidebar()` into atomic helpers (`createSidebarItem`, `updateActiveChatUI`).


## [v1.0.0] - 2026-07-18
### Added
- Fully functional chat sidebar driven dynamically by the `chatSessions` state array.
- Ability to create multiple concurrent "New Chat" threads and swap between them seamlessly without losing history.
- Pure DOM rendering orchestrators (`renderSidebar`, `renderCurrentConversation`, `renderMessage`, `createUserMessage`) establishing a unidirectional UI flow.


## [v0.9.1] - 2026-07-18
### Changed
- Replaced insecure `Date.now()` chat ID generation with standard `crypto.randomUUID()`.
- Eliminated all direct state mutations from business logic by introducing the `rollbackLastMessage()` helper.
- Decoupled session initialization into `createChatObject()` and `initializeChatSession()` for strict separation of concerns.


## [v0.9.0] - 2026-07-18
### Added
- In-memory `chatSessions` architecture utilizing encapsulated helper methods (`addMessage`, `createChat`, `setCurrentChat`).

### Changed
- Replaced the global `conversationHistory` array with a dynamic session-based data model.
- Application automatically provisions a default "New Chat" session on startup.


## [v0.8.2] - 2026-07-18
### Changed
- Refactored the loading ("Thinking...") UI into a reusable `createLoadingMessage()` helper using pure DOM APIs.
- Introduced `complete` metadata to assistant messages in the conversation history.
- Pre-filtered `fetch` payloads to exclude `complete: false` assistant messages, preventing interrupted, partial text from confusing the AI's context on future turns.


## [v0.8.1] - 2026-07-18
### Changed
- Preserved user messages in `conversationHistory` upon stream cancellation.
- Refactored `createAiMessage()` to strictly use pure DOM Node creation APIs, eliminating `innerHTML` and `querySelector` overhead.
- Centralized the Stop button creation into a reusable element.
- Removed original request object mutation in backend payload validation.


## [v0.8.0] - 2026-07-18
### Added
- "Stop Generating" feature utilizing the browser's native `AbortController`.
- Dynamic Stop button that replaces the Send button during streaming.
- Backend detection of client disconnects (`req.on('close')`) to halt Gemini stream consumption.

### Changed
- `fetch` requests now accept an `AbortSignal`.
- Partially aborted AI responses are now intentionally omitted from `conversationHistory` to prevent context corruption.


## [v0.7.0] - 2026-07-18
### Added
- In-memory conversation history (`conversationHistory` array) on the frontend.
- Multi-turn context support for the Gemini API backend route.

### Changed
- Switched the `/chat` route payload from a single `prompt` string to a `messages` array.
- The Gemini SDK now receives full conversation context via the `contents` property instead of a single prompt string.


## [v0.6.0] - 2026-07-18
### Added
- Native frontend stream consumption using Fetch API's `ReadableStream`.
- Real-time UI updates, appending text chunks to the chat bubble as they arrive.
- Real-time Markdown rendering and syntax highlighting during the stream.

### Changed
- Replaced synchronous `response.json()` consumption with `response.body.getReader()`.
- The loading spinner is now removed immediately upon receiving the first byte of data.


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
