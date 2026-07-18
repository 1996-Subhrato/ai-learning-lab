# Project History

This file serves as a complete development journal for the project. New features and updates are logged here.

### Version v1.1.1
**Date:** 2026-07-18
**Feature Name:** AI Title Generation Backend Refactor
**Objective:** Improve the maintainability, security, and scalability of the backend `/google/title` route.
**Problem Statement:** The AI Title generation endpoint embedded a raw, multi-line string prompt directly within the routing logic. Additionally, it sent raw string strings to the Gemini API instead of utilizing the standardized `contents` array structure used by the primary chat route. Finally, it dangerously passed raw LLM output directly back to the frontend without any sanitization.
**What Was Implemented:**
* Abstracted the prompt engineering logic into a dedicated module: `prompts/generateChatTitlePrompt.js`.
* Rebuilt the `/google/title` Gemini request to utilize the structured `contents` -> `role` -> `parts` array format, perfectly mirroring `/google/chat`.
* Created a strict output sanitizer utility: `utils/sanitizeChatTitle.js` which forcefully strips quotes, trims whitespace, collapses inner spacing, and truncates the string to 50 characters.
**Internal Working:** The `/google/title` route now acts strictly as a traffic controller. It receives the `message`, passes it to the `generateChatTitlePrompt` helper, wraps the resulting string in the `contents` format, sends it to Gemini, passes the raw output through `sanitizeChatTitle`, and finally returns the sanitized string to the client. 
**Architecture Decisions:** Extracting prompt generation into the `prompts` directory prepares the architecture for future AI enhancements (like summarization or metadata extraction) without turning the route file into a monolithic text block. Forcing all AI output through a sanitizer ensures that if the LLM disobeys formatting instructions (e.g., returning `"Title"` instead of `Title`), the frontend still receives pristine data.
**Libraries Used:** Vanilla JS, Express.
**Folder/File Changes:** Created `prompts/generateChatTitlePrompt.js` and `utils/sanitizeChatTitle.js`. Modified `routes/google-gemini.js`.
**Challenges Faced:** N/A (Standard Refactoring).
**Solutions:** N/A.
**Lessons Learned:** Never trust LLM output. Even with strict instructions ("No quotes"), language models can and will hallucinate formatting. Always build a deterministic sanitation layer to protect the application's state.
**Screenshots Placeholder:** N/A
**Next Improvements:** Persistent Storage (MongoDB).

---

### Version v1.1.0
**Date:** 2026-07-18
**Feature Name:** AI Generated Chat Titles (Chat Sessions Step 3)
**Objective:** Replace the generic "New Chat" sidebar labels with contextual, AI-generated titles without degrading the perceived performance of the main chat stream.
**Problem Statement:** Every new session in the sidebar was named "New Chat", making it impossible for users to differentiate between historical threads. However, generating a title requires a separate API call to Gemini, which could introduce latency if injected into the critical response path.
**What Was Implemented:**
* Built a new `/google/title` backend route strictly configured to prompt Gemini for short, unformatted 3-5 word summaries.
* Implemented `shouldGenerateTitle()` to deterministically check if a chat is fresh and has successfully received its first complete AI response.
* Wrote an asynchronous `generateChatTitle()` fetcher that runs completely detached from the `sendMessage()` lifecycle.
* Implemented `updateChatTitle()` to mutate the internal data model, followed by a silent `refreshUI()` to snap the new title into the DOM.
**Internal Working:** When a user sends their first message, the standard streaming engine fires. Once the stream successfully closes and `complete: true` is saved to state, `shouldGenerateTitle` evaluates to true. A detached Promise fires off to `/google/title`. When it returns seconds later, it overwrites `chat.title` and triggers `refreshUI()`, updating the sidebar seamlessly while the user is reading their response.
**Architecture Decisions:** Generating the title asynchronously *after* the stream finishes guarantees absolute zero latency impact on the user's chat experience. Treating title generation as a silent, non-critical background task ensures that if the Gemini API hiccups, the user's primary workflow is entirely unaffected.
**Libraries Used:** Node.js, Express, @google/generative-ai.
**Folder/File Changes:** Modified `routes/google-gemini.js` and `public/js/script.js`.
**Challenges Faced:** N/A
**Solutions:** N/A.
**Lessons Learned:** Background UI mutation relies heavily on unidirectional data flow. Because `refreshUI()` was implemented in the previous refactor, swapping the title became a trivial 2-line state mutation rather than a fragile jQuery-style DOM lookup.
**Screenshots Placeholder:** N/A
**Next Improvements:** Multiple Chats/Chat Switching UI is complete. Next is likely persistent storage (MongoDB).

---

### Version v1.0.1
**Date:** 2026-07-18
**Feature Name:** Functional Sidebar Architecture Refactor
**Objective:** De-duplicate DOM logic and streamline UI state synchronization before proceeding to AI-generated titles.
**Problem Statement:** Following the implementation of the functional sidebar in `v1.0.0`, several architectural smells emerged: `renderSidebar()` became a monolithic function handling layout, stylings, and event loops. Markdown processing was copy-pasted across streaming loops and retroactive rendering loops.
**What Was Implemented:**
* Fragmented `renderSidebar()` into distinct single-responsibility helpers: `createSidebarItem()`, `updateActiveChatUI()`, and `initializeSidebarIcons()`.
* Replaced inline JS styling (`element.style`) with native CSS class toggling (`.active`).
* Consolidated all DOM wipes and renders under a unified `refreshUI()` orchestrator.
* Extracted the `marked.parse()` and `hljs` highlighting pipeline into a universal `renderMarkdown(container, text)` helper.
**Internal Working:** The UI now updates through a highly normalized pipeline. Whenever a state change occurs (e.g., clicking New Chat or swapping sessions), the script simply calls `refreshUI()`, which blindly drops and reconstructs the sidebar list and chat pane natively.
**Architecture Decisions:** Shifting UI logic entirely to CSS `.active` classes enforces separation of concerns—JavaScript dictates *state*, CSS dictates *presentation*. Extracting `renderMarkdown` guarantees that rendering a complete array behaves identically to rendering a live HTTP chunk stream.
**Libraries Used:** Vanilla JS, Marked.js, Highlight.js.
**Folder/File Changes:** Modified `public/css/style.css` and `public/js/script.js`.
**Challenges Faced:** N/A (Standard Refactoring).
**Solutions:** N/A.
**Lessons Learned:** Monolithic UI functions are anti-patterns in vanilla JavaScript. Breaking rendering routines down to the smallest possible unit (e.g., `clearConversation()`) vastly reduces cognitive load and eliminates edge cases where one chunk of UI updates while another stalls.
**Screenshots Placeholder:** N/A
**Next Improvements:** AI Generated Chat Titles.

---

### Version v1.0.0
**Date:** 2026-07-18
**Feature Name:** Functional Sidebar (Chat Sessions Step 2)
**Objective:** Connect the previously implemented in-memory `chatSessions` architecture to the UI, allowing users to spawn and toggle between multiple disjointed chat threads seamlessly.
**Problem Statement:** Despite the internal data model supporting multiple chats, the visual interface still operated as a single-thread monolith with hardcoded dummy sidebar items. Users could not visually partition their context.
**What Was Implemented:**
* Purged hardcoded mockup chats from `views/index.ejs`.
* Implemented `renderSidebar()` to dynamically iterate over `chatSessions` and inject interactive `.history-item` nodes.
* Attached listeners to the "New Chat" buttons to mint fresh sessions and instantly switch focus to them.
* Built the `renderCurrentConversation()` and `renderMessage()` helpers to reconstruct the UI purely from the selected array in state, retaining syntax highlighting and markdown format upon restoration.
**Internal Working:** The UI is now completely state-driven. When a user clicks a sidebar item, `currentChatId` updates, `#messages` is wiped clean, and the engine loops through the selected session's `messages` array, passing each object through pure DOM generation functions before dumping them into the chat pane.
**Architecture Decisions:** Extracted `createUserMessage()` to join `createAiMessage()`, ensuring absolute zero DOM duplication across active streaming versus retroactive rendering.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `views/index.ejs` and `public/js/script.js`.
**Challenges Faced:** Restoring AI responses identically to their streamed equivalents.
**Solutions:** Bypassing `innerHTML +=` and manually passing restored text chunks through the identical `marked.parse()` and `hljs.highlightElement()` pipelines.
**Lessons Learned:** A unidirectional data flow (State -> Render) minimizes UI bugs and simplifies complex transitions like swapping out an entire DOM sub-tree on a button click.
**Screenshots Placeholder:** N/A
**Next Improvements:** AI-generated Chat Titles.

---

### Version v0.9.1
**Date:** 2026-07-18
**Feature Name:** Chat Sessions Architecture Refactor
**Objective:** Solidify the internal session architecture by strictly enforcing the Single Responsibility Principle and removing all direct state mutations from business logic.
**Problem Statement:** While `v0.9.0` introduced the foundation for chat sessions, business logic within `sendMessage` was still mutating the message array directly via `.pop()` on error rollbacks, and object construction was coupled to state registration.
**What Was Implemented:**
* Extracted message removal into a strict `rollbackLastMessage()` helper, ensuring the `updatedAt` timestamp is bumped even upon deletion.
* Decoupled object generation into a pure `createChatObject()` factory function, leaning on `crypto.randomUUID()` for collision-proof database-ready IDs.
* Moved startup logic into a dedicated `initializeChatSession()` orchestrator.
**Internal Working:** Business logic (the UI controllers and fetch wrappers) now possesses absolutely zero knowledge of how the `chatSessions` array or internal message arrays function. All data flow, both reading and writing, is routed through isolated helper functions.
**Architecture Decisions:** Enforced a rigid "No Direct State Mutation" policy. This guarantees that when LocalStorage or MongoDB is introduced in the future, developers will only need to modify the helper functions rather than auditing the entire application for rogue `.push()` or `.pop()` calls.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** N/A (Standard refactoring).
**Solutions:** N/A.
**Lessons Learned:** The `crypto.randomUUID()` Web API provides an instant, native way to generate V4 UUIDs without external dependencies like `uuid`, perfect for assigning primary keys before pushing to a database.
**Screenshots Placeholder:** N/A
**Next Improvements:** Functional sidebar and Chat Switching.

---

### Version v0.9.0
**Date:** 2026-07-18
**Feature Name:** Chat Sessions Architecture (Step 1)
**Objective:** Replace the single-array conversation model with a scalable in-memory session architecture to support multiple concurrent chats in the future.
**Problem Statement:** The application historically hardcoded all messages into a single global `conversationHistory` array, completely preventing the ability to switch conversations or store multiple disjointed chat threads.
**What Was Implemented:**
* Introduced a centralized `chatSessions` array to hold robust chat objects (`id`, `title`, `createdAt`, `updatedAt`, `messages`).
* Created a tracking variable `currentChatId` to monitor the active context.
* Established strict helper functions (`createChat()`, `setCurrentChat()`, `getCurrentMessages()`, `addMessage()`) to encapsulate all message mutations.
* Hardwired the initialization to automatically spawn and select a "New Chat" on page load.
* Swept the existing `sendMessage` logic to swap direct array manipulations with the new API boundaries.
**Internal Working:** Instead of pushing strings blindly to a list, the application now requests the active `messages` array from the `getCurrentMessages()` helper. The `addMessage()` helper handles appending objects while automatically bumping the `updatedAt` timestamp of the parent chat session.
**Architecture Decisions:** Adopted the Single Responsibility Principle for state management. This prepares the exact schema that a future MongoDB integration will require, minimizing future migration friction.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** Transitioning legacy direct-array operations (`.pop()`, `.filter()`) safely behind getter functions without breaking existing AbortError rollbacks.
**Solutions:** Designed `getCurrentMessages()` to return a direct reference to the active array, permitting safe local operations while forbidding structural reassignment.
**Lessons Learned:** Centralized state managers (even simple helper functions) dramatically improve application scalability compared to global mutable arrays.
**Screenshots Placeholder:** N/A
**Next Improvements:** Functional sidebar chat switching and UI integration.

---

### Version v0.8.2
**Date:** 2026-07-18
**Feature Name:** Loading UI & Conversation Architecture Refactor
**Objective:** Improve code consistency via reusable DOM helpers and formalize the conversation model to handle interrupted AI responses.
**Problem Statement:** The loading "Thinking..." UI relied on raw `innerHTML` string injection, breaking the pattern of pure DOM manipulation established in `v0.8.1`. Additionally, preserving interrupted AI responses in the UI without explicit metadata meant that consecutive user prompts (or partial AI garbage text) could confuse the AI's contextual awareness in future turns.
**What Was Implemented:**
* Extracted the loading message UI into a `createLoadingMessage()` helper, utilizing strict `document.createElement()` calls.
* Introduced a `complete` boolean flag metadata on assistant messages inside `conversationHistory`.
* Logged aborted AI responses as `complete: false` and successful ones as `complete: true`.
* Added a pre-fetch filter so that only user messages and fully completed assistant messages are passed in the Gemini payload.
**Internal Working:** The UI layer and the data layer are now fully decoupled regarding aborted requests. If the user stops a generation, the partial AI text is recorded in memory as incomplete and rendered on screen so the user doesn't lose what they were reading. However, when the user sends their next prompt, the `filter()` drops the incomplete AI response from the payload, presenting Gemini with a clean, logical history that excludes interrupted, potentially non-sensical trailing sentences.
**Architecture Decisions:** Adopted a "Record Everything, Filter for Context" approach to memory management.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** Ensuring the UI doesn't visually break when decoupling the payload array from the display history array.
**Solutions:** Maintaining a single source of truth (`conversationHistory`) for the UI, but deriving a computed `payloadMessages` array dynamically at fetch time.
**Lessons Learned:** Differentiating the user's *visual* history (what they see on screen) from the AI's *semantic* history (what the model needs to understand the conversation flow).
**Screenshots Placeholder:** N/A
**Next Improvements:** Multiple chat sessions or backend database persistence.

---

### Version v0.8.1
**Date:** 2026-07-18
**Feature Name:** Stop Generating Architecture Refactor
**Objective:** Improve the internal architecture, conversation consistency, and code quality of the Stop Generating feature.
**Problem Statement:** Aborted requests were aggressively popping the user's message from the conversation history, resulting in a loss of valid user context. The DOM creation logic and backend validation were also sub-optimal.
**What Was Implemented:**
* Preserved the user's message in the `conversationHistory` array even when an `AbortError` occurs, reflecting the true state of the conversation.
* Refactored `createAiMessage()` to build DOM nodes incrementally using `document.createElement` rather than string interpolation and `querySelector()`.
* Shifted backend content trimming from the original request mutation to the mapped Gemini payload generation.
* Reused a single, globally initialized Stop button by toggling its `display` property, avoiding redundant DOM creation loops.
* Stripped unnecessary `console.log` statements for expected `AbortError`s to keep production logs clean.
**Internal Working:** The frontend now retains the user prompt in memory upon cancellation. The backend leaves the incoming `req.body.messages` object completely unmodified and isolated, strictly handling transformation mapping right before injecting it into the LLM stream function. 
**Architecture Decisions:** Adopted strict mutation-avoidance on incoming HTTP payloads, aligning with pure-function design principles. 
**Libraries Used:** Vanilla JS, Node.js Express.
**Folder/File Changes:** Modified `public/js/script.js` and `routes/google-gemini.js`.
**Challenges Faced:** Resolving Gemini SDK strict-role alternation requirements while retaining un-answered user messages.
**Solutions:** Upgraded the payload mapping mapping structure to permit consecutive user interactions gracefully (or handle them dynamically if needed by the specific SDK iteration) by allowing the true history to reflect reality.
**Lessons Learned:** Differentiating true system errors (which mandate full conversation rollbacks) from user-initiated interrupts (which mandate preserving the user's side of the conversation).
**Screenshots Placeholder:** N/A
**Next Improvements:** Multiple chat sessions.

---

### Version v0.8.0
**Date:** 2026-07-18
**Feature Name:** Stop Generating (AbortController)
**Objective:** Allow the user to cancel an in-progress AI response stream.
**Problem Statement:** If the AI started generating a long, unwanted response, the user had no way to stop it, wasting API tokens and locking the UI until completion.
**What Was Implemented:**
* Introduced the native `AbortController` API to the frontend `fetch` request.
* Replaced the "Send" button with a dynamic "Stop" button while streaming is active.
* Handled the resulting `AbortError` gracefully, avoiding error UI rendering.
* Prevented appending partial, aborted AI responses to the in-memory `conversationHistory` to keep the context clean.
* Modified the Express route to listen for the `req.on('close')` event to detect client disconnects.
* Cleanly broke the backend stream writing loop upon disconnect to prevent orphaned processes.
**Internal Working:** When a stream starts, an `AbortController` is attached to the `fetch` signal. A temporary Stop button is injected. If clicked, `controller.abort()` is called. This forcibly terminates the TCP connection. The catch block on the frontend traps the specific `AbortError`, pops the user message from the history to maintain consistency, and leaves the partially rendered AI text on screen. Simultaneously, the backend Express route detects the connection close and halts the generator loop.
**Architecture Decisions:** Opted to dynamically inject a dedicated Stop button element rather than permanently overloading the event listeners of the Send button to ensure deterministic state cleanup.
**Libraries Used:** Vanilla JS, Node.js Express.
**Folder/File Changes:** Modified `public/js/script.js` and `routes/google-gemini.js`.
**Challenges Faced:** Keeping the `conversationHistory` array valid for Gemini. Because Gemini strictly requires alternating user/model roles, an aborted request (which leaves an unrecorded model response) would cause the next user message to break the sequence (`user`, `user`).
**Solutions:** Automatically popped the preceding user message out of `conversationHistory` upon an `AbortError`. The user can see their prompt in the UI, but under the hood, the next request resets to before they asked it.
**Lessons Learned:** `AbortController` signals, fetch cancellation, and Express request lifecycle events (`req.on('close')`).
**Screenshots Placeholder:** N/A
**Next Improvements:** Multiple chats or persistent database storage.

---

### Version v0.7.0
**Date:** 2026-07-18
**Feature Name:** Conversation Memory (In-Memory Context)
**Objective:** Maintain multi-turn conversation context so the AI can remember previous messages during a session.
**Problem Statement:** The AI treated every prompt as an isolated event, lacking the ability to follow up on previous context or maintain a cohesive dialogue.
**What Was Implemented:**
* Instantiated an in-memory `conversationHistory` array on the frontend to track all user and assistant messages chronologically.
* Updated the POST `/chat` payload to send the complete `messages` array instead of a single `prompt`.
* Appended the AI's final accumulated response to the array only after the streaming successfully completes.
* Modified the Express route to validate the `messages` array structure.
* Mapped the `messages` array into the precise `{ role, parts }` object structure required by the `@google/generative-ai` SDK.
* Replaced the `generateContentStream(prompt)` call with `generateContentStream({ contents: ... })` to feed the entire history into Gemini.
**Internal Working:** When the user hits send, their message is immediately pushed to the frontend history array. The entire array is serialized and POSTed to the backend. The backend maps the "assistant" roles to "model", validates the data, and invokes the Gemini streaming API with the full multi-turn context. The stream is sent back. Upon successful completion, the frontend pushes the accumulated AI response to the history array.
**Architecture Decisions:** Stored the history strictly in JavaScript memory variables. No LocalStorage, SessionStorage, or database was used to keep the implementation purely stateless across refreshes as per requirements.
**Libraries Used:** Vanilla JS, Express, `@google/generative-ai`
**Folder/File Changes:** Modified `public/js/script.js` and `routes/google-gemini.js`.
**Challenges Faced:** Safely appending the assistant's response to the history array only when streaming completes successfully to avoid corrupting the memory with partial or failed responses.
**Solutions:** Placed the `conversationHistory.push()` operation strictly at the end of the `try` block, after flushing the final decoder bytes.
**Lessons Learned:** Formatting multi-turn data for the Gemini SDK (`generateContentStream` accepts an array of content parts rather than requiring the explicit `startChat` class wrapper).
**Screenshots Placeholder:** N/A
**Next Improvements:** Support for multiple distinct chats or persistent storage.

---

### Version v0.6.0
**Date:** 2026-07-18
**Feature Name:** Frontend Streaming Responses (Step 2)
**Objective:** Consume the backend HTTP stream and display the AI response in real-time within the chat UI.
**Problem Statement:** The backend was streaming chunks, but the frontend still attempted to parse a single JSON payload via `await response.json()`, causing errors and breaking the chat.
**What Was Implemented:**
* Refactored the `fetch()` handler to use the native `ReadableStream` API via `response.body.getReader()`.
* Utilized `TextDecoder` to parse the streamed byte chunks into readable strings.
* Modified the DOM manipulation to create exactly one AI message container and continuously append text to it.
* Triggered the `marked.parse` and `hljs.highlightElement` functions on every chunk arrival.
* Auto-scroll behavior tied to chunk streaming.
* Removed the loading spinner the moment the first chunk arrives instead of waiting for the full response.
**Internal Working:** The `fetch` call reads the body incrementally using a `while(true)` loop until the `done` flag is true. The accumulated string is re-rendered via the Markdown parser on every tick and injected into the DOM.
**Architecture Decisions:** Used pure vanilla JavaScript (Fetch API, ReadableStream) instead of third-party libraries (like Axios or Socket.io) to keep the frontend bundle completely zero-dependency and lightweight.
**Libraries Used:** Built-in Fetch API, `marked`, `highlight.js`.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** Ensuring Markdown was parsed correctly as partial chunks arrived without breaking syntax highlighting.
**Solutions:** Stored the continuously growing response in an `accumulatedText` variable, and passed the entirely accumulated string to the parser on each tick to ensure proper HTML structures were formed.
**Lessons Learned:** Native browser stream consumption, `TextDecoder`, and DOM update efficiency.
**Screenshots Placeholder:** N/A
**Next Improvements:** Conversation memory and preserving chat history.

---

### Version v0.5.0
**Date:** 2026-07-18
**Feature Name:** Streaming Responses (Step 1 - Backend)
**Objective:** Modify the backend to stream AI responses as they are generated rather than waiting for the entire response.
**Problem Statement:** The previous implementation buffered the entire AI response before sending it to the client, leading to long loading times.
**What Was Implemented:**
* Replaced `generateContent` with `generateContentStream` from the Gemini SDK.
* Implemented HTTP chunked transfer encoding (managed automatically by Node.js).
* Streamed text chunks to the Express response stream using `res.write()`.
* Added robust error handling to safely close the stream if an error occurs mid-generation.
* Added input validation, `Cache-Control: no-cache` headers, and full stack-trace logging for production readiness.
**Internal Working:** The `/google/chat` Express route now iterates over the async stream returned by Gemini. For each chunk received, the text is immediately forwarded to the client. The response is explicitly closed with `res.end()` once generation completes.
**Architecture Decisions:** Opted for simple HTTP chunked transfer for this step to keep the integration lightweight, laying the groundwork for full SSE (Server-Sent Events) or raw stream processing on the frontend later.
**Libraries Used:** Express, @google/generative-ai
**Folder/File Changes:** Modified `routes/google-gemini.js`.
**Challenges Faced:** Handling errors gracefully once the HTTP headers have already been sent to the client.
**Solutions:** Added a check for `res.headersSent` to decide whether to return a JSON 500 error or simply terminate the active stream.
**Lessons Learned:** Node.js HTTP response streaming, async iterators in JavaScript, and Gemini's streaming API.
**Screenshots Placeholder:** N/A (Backend only change)
**Next Improvements:** Implement the frontend logic to consume this stream.

---

### Version v0.4.0
**Date:** 2026-07-18
**Feature Name:** Modern Chat UI
**Objective:** Upgrade the chat interface to a modern, responsive layout similar to ChatGPT/Claude.
**Problem Statement:** The basic chat page was functional but lacked polish, making it feel less like a production app.
**What Was Implemented:**
* Modern responsive UI
* ChatGPT/Claude-inspired layout
* Improved spacing and better typography
* Sidebar navigation
* Modern input box
* Better message styling and responsive design improvements
**Internal Working:** Applied custom CSS to style the chat layout, flexbox/grid for responsiveness, and improved the input styling to handle multiline text gracefully.
**Architecture Decisions:** Kept the frontend vanilla CSS/JS to maintain simplicity while improving aesthetics.
**Libraries Used:** Vanilla CSS/JS.
**Folder/File Changes:** Modified `public/css` styles and `views` templates.
**Challenges Faced:** Ensuring the layout works well on both desktop and mobile screens.
**Solutions:** Leveraged CSS flexbox for the sidebar and main chat area layout.
**Lessons Learned:** Modern UI design principles, typography importance, and responsive flexbox techniques.
**Screenshots Placeholder:** [Placeholder: Screenshot of Modern Chat UI]
**Next Improvements:** Streaming responses and conversation memory.

---

### Version v0.3.0
**Date:** 2026-07-12
**Feature Name:** Response Rendering
**Objective:** Format the AI's markdown responses into readable HTML with syntax highlighting.
**Problem Statement:** Raw markdown from the AI API was being displayed as plain text, making code blocks unreadable.
**What Was Implemented:**
* Markdown rendering
* Marked integration
* Syntax highlighting
* highlight.js integration
* Styled code blocks
* Better AI response formatting
**Internal Working:** Integrated `marked` on the client side to parse the AI's markdown string into HTML. Used `highlight.js` to automatically detect code blocks within the parsed HTML and apply syntax highlighting styles.
**Architecture Decisions:** Moved markdown parsing to the client-side to offload processing from the Express server.
**Libraries Used:** `marked`, `highlight.js`.
**Folder/File Changes:** Updated frontend JavaScript to parse responses before appending them to the DOM.
**Challenges Faced:** Ensuring code blocks were correctly identified and highlighted after markdown parsing.
**Solutions:** Chained `highlight.js` initialization after `marked` parsed the content.
**Lessons Learned:** Client-side markdown parsing, HTML rendering from text, and integrating third-party syntax highlighters.
**Screenshots Placeholder:** [Placeholder: Screenshot of Rendered Code Block]
**Next Improvements:** Complete modern UI overhaul.

---

### Version v0.2.0
**Date:** 2026-07-09
**Feature Name:** AI Chat Flow
**Objective:** Create the core chat loop between the frontend user interface and the AI API.
**Problem Statement:** The server was set up but lacked a user interface to actually send prompts and see responses.
**What Was Implemented:**
* Frontend chat page
* Fetch API communication
* Express API route
* Sending user prompt to Gemini
* Returning AI response
* Basic conversation flow
**Internal Working:** Created an HTML/EJS view with an input field and submit button. The frontend uses `fetch` to POST the user's prompt to an Express route (`/google`). The Express route calls the Gemini API and returns the text response as JSON.
**Architecture Decisions:** Used a simple Fetch API request rather than websockets for the initial implementation to keep the architecture straightforward.
**Libraries Used:** Built-in Fetch API.
**Folder/File Changes:** Created `routes/google-gemini.js`, `views/` files, and `public/js/` for frontend logic.
**Challenges Faced:** Handling asynchronous API calls and updating the DOM dynamically.
**Solutions:** Used `async/await` with `fetch` and DOM manipulation to append messages to the chat container.
**Lessons Learned:** Full-stack communication, handling JSON payloads, and basic DOM manipulation.
**Screenshots Placeholder:** [Placeholder: Screenshot of Basic Chat Flow]
**Next Improvements:** Better markdown rendering for code blocks.

---

### Version v0.1.0
**Date:** 2026-07-05
**Feature Name:** Initial Project Setup
**Objective:** Initialize the Node.js project and configure the server and AI SDKs.
**Problem Statement:** Needed a foundational backend setup to interact with Google Gemini and OpenAI APIs securely.
**What Was Implemented:**
* Express.js project initialization
* Environment configuration
* Basic folder structure
* Gemini API key setup
* Gemini SDK integration
* First successful AI API request
**Internal Working:** Set up a Node.js project with `express` for routing and `dotenv` for secure API key management. Initialized `@google/generative-ai` and `openai` SDKs. Configured basic middleware (`morgan`, `express.json`).
**Architecture Decisions:** Chose Express.js for its simplicity and robust routing capabilities. Organized routes into a separate `routes/` folder for modularity.
**Libraries Used:** `express`, `dotenv`, `@google/generative-ai`, `openai`, `morgan`, `ejs`.
**Folder/File Changes:** Created `app.js`, `package.json`, `.env`, and established the `routes/` and `views/` directory structure.
**Challenges Faced:** Securely storing API keys without committing them to version control.
**Solutions:** Implemented `.dotenv` and added `.env` to `.gitignore`.
**Lessons Learned:** Express project scaffolding, environment variables, and SDK initialization.
**Screenshots Placeholder:** [Placeholder: Terminal output of server starting]
**Next Improvements:** Build the frontend chat interface.
