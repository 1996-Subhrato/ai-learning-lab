# Learnings

This file documents concepts learned while implementing features for this project.

## v1.2.0: Copy AI Response
Learned:
* **Closure Data Binding:** When attaching event listeners to dynamically generated UI elements (like a Copy button), passing the raw state string directly into the callback closure is significantly cleaner and more secure than reading `innerText` back out of the DOM tree.
* **Transient UI States:** Providing immediate visual feedback (e.g., swapping an icon to a checkmark for 2 seconds) is a hallmark of premium UX design, transforming an invisible clipboard API call into a tangible user action.

## v1.1.1: AI Title Generation Backend Refactor
Learned:
* **LLM Output Sanitization:** You can never implicitly trust the output of an LLM, even when explicitly instructed (e.g., "no quotes"). Building a deterministic, regex-based sanitation utility is mandatory to prevent UI bugs caused by rogue formatting.
* **Prompt Modularity:** Hardcoding multi-line prompts inside router files creates unreadable code. Abstracting them into a `prompts/` directory adheres to the Single Responsibility Principle and creates a highly scalable structure for future AI agents.

## v1.1.0: AI Generated Chat Titles (Chat Sessions Step 3)
Learned:
* **Detached Promises:** Executing a network request `.then()` without `await`ing it inside an async function is a powerful pattern for non-blocking background tasks (like analytics or metadata fetching) that shouldn't hold up the main UI thread.
* **Resilient UX:** By designing non-critical features (like auto-titling) to fail silently, you protect the core user experience (chatting) from unnecessary disruption.

## v1.0.1: Functional Sidebar Architecture Refactor
Learned:
* **Separation of Presentation and Logic:** Inline styling applied via JS (`item.style.backgroundColor`) is an anti-pattern that couples logic and design. Native CSS class toggling (`classList.add("active")`) respects this boundary and relies on the stylesheet for rendering intent.
* **Unified UI Refreshing:** Having a single entry point (`refreshUI`) to synchronize the screen with memory arrays eliminates out-of-sync visual bugs.

## v1.0.0: Functional Sidebar (Chat Sessions Step 2)
Learned:
* **State-Driven UI:** Decoupling the DOM from the application state is critical for scaling interactive apps. By ensuring that the DOM is merely a *reflection* of `chatSessions`—rather than the *storage* of it—swapping between active chats becomes a trivial `wipe and re-render` loop instead of complex node caching.

## v0.9.1: Chat Sessions Architecture Refactor
Learned:
* **UUIDs:** `crypto.randomUUID()` is a globally available Web API in modern browsers (and Node.js). It is vastly superior to `Date.now()` or `Math.random()` for generating unique, collision-proof database keys for objects.
* **Strict State Management:** Banning native array methods (`.push`, `.pop`) inside business logic in favor of domain-specific helpers (`addMessage`, `rollbackLastMessage`) guarantees that crucial side-effects (like bumping `updatedAt` timestamps or syncing to a DB) are never accidentally bypassed.

## v0.9.0: Chat Sessions Architecture (Step 1)
Learned:
* **State Encapsulation:** Replacing global arrays with getter/setter helpers (`getCurrentMessages`, `addMessage`) enforces a strict API contract across the frontend. This makes future integrations (like syncing state to MongoDB or LocalStorage) vastly simpler, as there is only one "choke point" where data is mutated.

## v0.8.2: Loading UI & Conversation Architecture
Learned:
* **Visual vs. Contextual History:** The conversation history displayed to a user does not have to perfectly mirror the payload sent to an AI. Interrupted, partial assistant responses should remain visible on screen for UX purposes, but must be explicitly excluded from future LLM payloads to prevent contextual drift and hallucination caused by trailing, incomplete sentences.

## v0.8.1: Stop Generating Refactor
Learned:
* State mutations (`msg.content = msg.content.trim()`) on raw request objects should be avoided to preserve the integrity of the original payload for logging, debugging, or downstream middleware.
* Expected user actions (like cancelling a stream) should not be treated or logged identically to unhandled runtime exceptions.

## v0.8.0: Stop Generating (AbortController)
Learned:
* `AbortController` and `AbortSignal` provide a native way to cancel ongoing `fetch` requests in the browser without third-party dependencies.
* Calling `controller.abort()` throws a DOMException with `name === 'AbortError'`, which must be trapped explicitly to prevent standard error UI behaviors.
* When a frontend fetch is aborted, the backend Express `req` object emits a `close` event, allowing the server to gracefully exit generator loops and save resources.

## v0.7.0: Conversation Memory
Learned:
* LLMs (Large Language Models) are naturally stateless. Providing a memory feature requires explicitly re-submitting the entire previous dialogue string/array on every new turn.
* How to format generic `role`/`content` schemas into provider-specific schemas (e.g., mapping `assistant` to Gemini's `model` role).
* Ensuring states remain synchronized between UI rendering (streaming) and memory (committing to the array only upon completion).

## v0.6.0: Streaming Responses (Frontend)
Learned:
* The native Fetch API exposes `response.body.getReader()`, which returns a `ReadableStreamDefaultReader` for chunk-by-chunk processing.
* Using `TextDecoder` to properly convert `Uint8Array` stream chunks into UTF-8 text.
* Managing DOM states effectively: rendering markdown incrementally by holding an accumulated string to prevent broken HTML structures mid-stream.

## v0.5.0: Streaming Responses (Backend)
Learned:
* Using `generateContentStream` to process AI responses in real-time.
* Node.js HTTP response objects are Writable Streams, allowing raw data forwarding using `res.write()`.
* Handling asynchronous iterators (`for await...of`) in JavaScript.
* Graceful error handling in Express when HTTP headers have already been sent to the client (`res.headersSent`).

## v0.4.0: Modern Chat UI
Learned:
* Modern UI design principles (spacing, typography, color palettes).
* Implementing ChatGPT-like layouts using CSS Flexbox.
* Building responsive sidebars and dynamic text input areas.

## v0.3.0: Response Rendering
Learned:
* AI models return Markdown formatted text.
* Parsing Markdown to HTML on the client side using the `marked` library.
* Applying syntax highlighting to parsed code blocks using `highlight.js`.

## v0.2.0: AI Chat Flow
Learned:
* Establishing full-stack communication using the Fetch API.
* Creating Express routes to handle POST requests containing JSON bodies.
* Updating the DOM dynamically using Vanilla JavaScript without page reloads.

## v0.1.0: Initial Project Setup
Learned:
* Setting up a basic Express.js web server.
* Managing sensitive API keys securely using `.env` files.
* Initializing and configuring Google Gemini and OpenAI Node.js SDKs.
