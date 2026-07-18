# Project History

This file serves as a complete development journal for the project. New features and updates are logged here.

### Version v7.3.0
**Date:** 2026-07-18
**Feature Name:** Chat Repository (PR 3.4)
**Objective:** Create a dedicated data access layer (Repository Pattern) responsible for all database operations related to chats, completely decoupled from HTTP routes and business logic.
**Problem Statement:** To safely migrate away from `LocalStorage`, the application needs a secure, predictable way to perform CRUD operations on the `chats` table without leaking SQL queries into the controller layer.
**What Was Implemented:**
* **Chat Repository Module:** Authored `repositories/chatRepository.js` exposing 5 core database wrapper methods explicitly frozen via `Object.freeze()`.
* **Explicit Projections:** Replaced lazy `SELECT *` and `RETURNING *` clauses with strict column declarations (`id, title, created_at, updated_at`) to prevent future schema leaks.
* **Parameterized SQL:** All methods (`createChat`, `getChats`, `getChatById`, `renameChat`, `deleteChat`) exclusively use parameterized `$1, $2` variables, comprehensively preventing SQL injection attacks.
* **Separation of Concerns:** The repository strictly returns raw Javascript objects or null values. It never interacts with Express `req`/`res` objects, and it delegates error catching back to the caller.
**Internal Working:** The module imports the `db.query()` abstraction from `config/db.js`. Functions guarantee deterministic results (e.g., sorting by `updated_at DESC, created_at DESC`).
**Architecture Decisions:** Adopted the strict Repository Pattern. By forcing all SQL queries regarding chats into this single file, any future database restructuring only requires updating this isolated module rather than hunting down queries scattered across the application.
**Libraries Used:** PostgreSQL driver (`pg`).
**Folder/File Changes:** Created `repositories/chatRepository.js`.
**Challenges Faced:** Ensuring errors bubble up correctly without unnecessary duplicate try/catch blocks.
**Solutions:** Omitted localized `try/catch` wrappers within the repository methods, allowing native database promise rejections to naturally flow upwards to the business layer.
**Lessons Learned:** Returning primitives (booleans for deletion, null for not-found) from the repository layer keeps the API extremely clean and pushes HTTP status code logic into the controllers where it belongs.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement the Message Repository (PR 3.5).

---

### Version v7.2.0
**Date:** 2026-07-18
**Feature Name:** Create Database Tables (PR 3.3)
**Objective:** Design and instantiate the PostgreSQL database schema for the AI Chat application to prepare for API integration.
**Problem Statement:** After establishing a reusable database layer, the database itself was completely empty. We required a normalized schema capable of durably storing hierarchical chat history.
**What Was Implemented:**
* **Schema Definition:** Authored `database/schema.sql` containing idempotent `CREATE TABLE IF NOT EXISTS` statements.
* **Tables Created:** Created `chats` (tracking conversation metadata) and `messages` (tracking individual role/content nodes).
* **Constraints:** Enforced UUID generation (`gen_random_uuid()`) via `pgcrypto`, timestamp defaulting (`NOW()`), strict `NOT NULL` validations, and a `CHECK` constraint restricting the `role` column to `user`, `assistant`, or `system`.
* **Relationships:** Bound `messages.chat_id` to `chats.id` using `ON DELETE CASCADE` so deleting a conversation cleanly wipes its history without manual query orchestration.
* **Performance:** Preemptively created indexes on `messages(chat_id)` and `messages(created_at)`.
**Internal Working:** Executed the schema directly against the Supabase database. The SQL relies entirely on native PostgreSQL features without requiring external ORM abstractions.
**Architecture Decisions:** Adopted an idempotent SQL schema design. All creation commands use `IF NOT EXISTS`, allowing the script to be run repeatedly without causing destructive side effects (like dropping existing data).
**Libraries Used:** PostgreSQL (SQL dialect).
**Folder/File Changes:** Created `database/schema.sql`.
**Challenges Faced:** None.
**Solutions:** N/A.
**Lessons Learned:** Defining cascading relationships at the database layer drastically simplifies application-layer deletion logic, pushing referential integrity guarantees down to the storage engine where they belong.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement Data Repositories for backend CRUD operations.

---

### Version v7.1.0
**Date:** 2026-07-18
**Feature Name:** Database Layer Abstraction (PR 3.2)
**Objective:** Create a reusable database layer to modularize PostgreSQL communication and keep future repositories decoupled from the raw `pg` pool.
**Problem Statement:** Following the database connection in PR 3.1, passing around the raw `Pool` object would lead to duplicate error handling logic and tight coupling across the application. We needed an abstraction.
**What Was Implemented:**
* **Reusable DB Wrapper:** Refactored `config/db.js` to export a module containing `query()` and `getClient()` helper methods rather than exporting the raw `pool` instance.
* **Centralized Error Handling:** Integrated `try/catch` blocks inside the database helper methods to ensure any SQL execution errors are automatically logged uniformly and then bubbled up (`throw error`) to the calling layer.
* **Server Update:** Updated `server.js` to use `db.query()` instead of `pool.query()`.
**Internal Working:** The module closes over the instantiated `Pool` and provides functional wrappers. Any call to `db.query()` internally invokes `pool.query()` but automatically handles the `catch` branch logging before throwing.
**Architecture Decisions:** Adopted the Module Pattern to conceal the actual database driver instance (Encapsulation). This allows us to theoretically swap out the driver later without rewriting the rest of the application, and prepares the backend for the Repository Pattern.
**Libraries Used:** Vanilla JS, `pg`.
**Folder/File Changes:** Modified `config/db.js` and `server.js`.
**Challenges Faced:** None.
**Solutions:** N/A.
**Lessons Learned:** Centralized abstraction layers prevent widespread code duplication and enforce consistent error reporting rules across the entire application before those errors become problems.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implementing actual Database Tables (SQL) and building Repositories for Chats/Messages.

---

### Version v7.0.1
**Date:** 2026-07-18
**Feature Name:** PostgreSQL Connection Fix
**Objective:** Resolve the database authentication failure during server startup.
**Problem Statement:** The server was failing to connect to the Supabase PostgreSQL database with a `password authentication failed` error, causing the `nodemon` process to crash.
**What Was Implemented:**
* **.env Correction:** Removed the literal bracket `[` and `]` characters from the `DATABASE_URL` password section, which were incorrectly copied from the Supabase connection template.
**Internal Working:** The `server.js` startup function `startServer()` relies on the `pg` pool which automatically parses the `DATABASE_URL`. Fixing the string allows the `SELECT NOW()` heartbeat query to succeed.
**Architecture Decisions:** No architectural changes; simple configuration fix.
**Libraries Used:** N/A.
**Folder/File Changes:** Modified `.env`.
**Challenges Faced:** Identifying the syntax error in the connection string.
**Solutions:** Inspected the terminal logs and `.env` file to spot the bracket issue.
**Lessons Learned:** Always double-check connection string templates when copying from cloud providers like Supabase; placeholders like `[YOUR-PASSWORD]` mean replace the entire placeholder including brackets.
**Screenshots Placeholder:** N/A
**Next Improvements:** Continue with persistent storage implementation.

---

### Version v7.0.0
**Date:** 2026-07-18
**Feature Name:** PostgreSQL Connection (PR 3.1)
**Objective:** Establish a robust PostgreSQL database connection on server startup to pave the way for persistent backend storage.
**Problem Statement:** Up until this phase, chat states have only been persisted in the browser's `LocalStorage`. For true cross-device continuity and robustness, the application needs a real backend database. The first step is securely connecting to PostgreSQL.
**What Was Implemented:**
* **`pg` Driver Integration:** Installed the official Node.js PostgreSQL driver (`pg`).
* **Connection Pool Configuration:** Created a dedicated `config/db.js` module that initializes a connection pool using a `DATABASE_URL` environment variable.
* **Startup Verification:** Refactored the entry point (renamed from `app.js` to `server.js` to match standard backend topology) to aggressively verify the database connection with a `SELECT NOW()` query before binding to the HTTP port. If the database is unreachable, the application elegantly crashes (`process.exit(1)`) rather than running in an invalid state.
**Internal Working:** The server utilizes an `async function startServer()` pattern. It awaits the database heartbeat. Upon success, it fires up Express. On `catch(error)`, it logs the error clearly and aborts execution.
**Architecture Decisions:** Adopted a "fail-fast" topology. The server refuses to start unless the critical infrastructure (database) is alive. Abstracted the pool instance into a singleton `config/db.js` module so future repositories can import it natively.
**Libraries Used:** `pg`, `dotenv`.
**Folder/File Changes:** Created `config/db.js`, modified `.env`, renamed `app.js` to `server.js`, updated `package.json`.
**Challenges Faced:** Ensuring the application doesn't hang on unhandled promise rejections if the URL is invalid.
**Solutions:** Explicitly wrapped the initialization in a robust `try/catch` block.
**Lessons Learned:** Validating critical infrastructure dependencies before opening HTTP ports prevents "zombie" servers that appear healthy to load balancers but fail on data requests.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement database migrations, schema definitions, and replace LocalStorage with API calls.

---

### Version v6.0.0
**Date:** 2026-07-18
**Feature Name:** Animated Typing Indicator (Feature 6)
**Objective:** Add a responsive, polished typing indicator that appears while waiting for the first token of a streaming AI response to arrive.
**Problem Statement:** Before this feature, a static "Thinking..." text appeared, which looked unpolished. The typing indicator should emulate modern messaging apps and vanish exactly when the stream begins or aborts.
**What Was Implemented:**
* **Bouncing Dot Animation:** Replaced the static "Thinking..." text with a smooth CSS-driven keyframe animation (`typingBounce`) on three inline dots.
* **Stream Lifecycle Integration:** Wired the typing indicator into the `streamChatResponse` cycle. It renders instantly upon `fetch`, and is explicitly destroyed via `loading.remove()` the moment the `ReadableStream` yields its first chunk, or if an `AbortError` or network error triggers.
* **Redundancy Cleanup:** Refactored `sendMessage` and `streamChatResponse` to prevent duplicate loading elements from spawning simultaneously.
* **Accessibility:** Bound `aria-live="polite"` and `role="status"` to the typing element with an explicit `aria-label` ("Assistant is typing").
**Internal Working:** The UI mounts a transient `.typing-indicator` DOM node. When the `TextDecoder` decodes the first non-empty byte of the `ReadableStream`, `aiResponseDiv` is lazily mounted, and the `loading` node is explicitly detached from its parent.
**Architecture Decisions:** Kept the animation purely in CSS using `animation-delay` rather than JS intervals to guarantee lightweight execution that won't compete with the streaming processing thread.
**Libraries Used:** Vanilla JS, CSS.
**Folder/File Changes:** Modified `public/js/script.js` and `public/css/style.css`.
**Challenges Faced:** Ensuring the indicator didn't leak if the user rapidly mashed the stop button before the stream connected.
**Solutions:** The existing `AbortController` catch-block handles this gracefully, and I added a defensive `if (loading && loading.parentNode) loading.remove();` to guarantee cleanup in the error and abort pipelines.
**Lessons Learned:** Pure CSS animations with negative `animation-delay` provide incredibly cheap, native-feeling stagger effects without touching JavaScript.
**Screenshots Placeholder:** N/A
**Next Improvements:** Persistent Backend Storage or Authentication.

---

### Version v5.3.0
**Date:** 2026-07-18
**Feature Name:** Search UX Improvements (PR 5.4)
**Objective:** Polish the chat search experience by adding micro-interactions, keyboard accessibility, and visual feedback without altering the core filtering algorithm.
**Problem Statement:** The basic search integration worked, but it felt slightly rigid. Typing could reset scroll positions, clearing the field required using the mouse, and users lacked feedback on exactly how many chats matched their query.
**What Was Implemented:**
* **Scroll Preservation:** Upgraded `renderSidebar()` to cache the `.history-list`'s `scrollTop` property before clearing the inner HTML, and strictly restoring it after rendering the filtered results. This prevents jarring scroll-jumps while typing.
* **Keyboard Accessibility:** Attached a `keydown` listener to the search input. Pressing `Escape` while text is present instantly clears the search query and restores the full chat list while maintaining cursor focus.
* **Result Counters:** Dynamically injected a `<div class="search-result-count">` header whenever a search is active, providing users with explicit feedback (e.g., "3 chats found").
* **Click-to-Focus:** Added an event listener to the outer `.sidebar-search` container so clicking anywhere near the input automatically focuses the cursor.
* **Friendly Empty State:** Updated the empty state message to include secondary helper text ("Try a different search") for a softer UI experience.
**Internal Working:** The UX enhancements are layered seamlessly over the existing DOM rendering pipeline. Scroll state preservation is handled synchronously during the `renderSidebar` loop.
**Architecture Decisions:** Opted for vanilla DOM injection for the result counter rather than heavy templating, keeping the execution path incredibly fast.
**Libraries Used:** Vanilla JS, CSS.
**Folder/File Changes:** Modified `public/js/script.js` and `public/css/style.css`.
**Challenges Faced:** Ensuring the clear button didn't trigger the container's focus event.
**Solutions:** Used `!clearSearchBtn.contains(e.target)` to exclude the clear button and its inner icon from the container's click-to-focus behavior.
**Lessons Learned:** Preserving transient DOM state (like `scrollTop` and `focus`) during aggressive re-renders is critical for making web applications feel native and polished.
**Screenshots Placeholder:** N/A
**Next Improvements:** Transitioning to MongoDB persistence or Authentication.

---

### Version v5.2.0
**Date:** 2026-07-18
**Feature Name:** Search Sidebar Integration (PR 5.3)
**Objective:** Connect the Search UI input to the DOM rendering engine, enabling real-time filtering of the chat sidebar without mutating application state.
**Problem Statement:** Searching chats should be immediate and non-destructive. Modifying the global array would break the active chat selection or permanently delete un-rendered chats from local storage during a subsequent save operation.
**What Was Implemented:**
* Refactored `renderSidebar()` in `script.js` to derive its rendering source dynamically by calling `filterChats(chatSessions, chatSearchInput.value)`.
* Appended `renderSidebar()` to the `input` and `click` event listeners on the search input and clear buttons.
* Engineered a clean empty state (`<div class="empty-search-state">No chats found.</div>`) that displays when the filter returns zero results.
**Internal Working:** When a user types, the DOM fires an `"input"` event. This triggers a targeted `renderSidebar()` execution, which calculates the subset of visible chats, wipes the `historyList` container, and repopulates it. The core `chatSessions` array, `currentChatId`, and the right-hand conversation viewport remain untouched.
**Architecture Decisions:** Opted for a "Derived State Rendering" pattern. By computing the filtered list inside the render function rather than maintaining a separate `filteredChats` global variable, we eliminate entire classes of state-sync bugs.
**Libraries Used:** Vanilla JS, CSS.
**Folder/File Changes:** Modified `public/js/script.js` and `public/css/style.css`.
**Challenges Faced:** Preventing the active chat from de-selecting if it's hidden by a search filter.
**Solutions:** Because the core state (`currentChatId`) is never touched during filtering, the active chat seamlessly persists in memory. Clicking a visible chat securely jumps the active pointer while the filter query remains active.
**Lessons Learned:** Re-rendering a specific section of the DOM (the sidebar) based on a derived calculation of the global state is highly performant and incredibly safe compared to managing multi-layered application states.
**Screenshots Placeholder:** N/A
**Next Improvements:** Persistent backend storage for deleted items.

---

### Version v5.1.0
**Date:** 2026-07-18
**Feature Name:** Search Filter Helper (PR 5.2)
**Objective:** Implement the core pure-function logic required to filter chat histories before hooking it up to the DOM.
**Problem Statement:** Searching chats requires iterating over the array and matching strings. Embedding this logic directly into a UI event listener tightly couples the data layer to the presentation layer, making it harder to test, reuse, or extend (e.g., searching by date later).
**What Was Implemented:**
* Built `filterChats(chatsCollection, query)`, a completely pure helper function in `script.js`.
* The function accepts the search array and query string as inputs and returns a brand-new filtered array without modifying the original inputs.
* Implemented partial, case-insensitive string matching (`.toLowerCase().includes()`) specifically targeting the `chat.title` property.
* Engineered resilient edge-case handling: the function gracefully returns the unmodified original array if the query is empty, null, undefined, or whitespace-only.
**Internal Working:** The function first sanitizes the query via `.trim().toLowerCase()`. If valid, it leverages `Array.prototype.filter()` to generate the resulting collection, preserving the exact original ordering of matches.
**Architecture Decisions:** Adopted functional programming principles (pure functions, no side effects, immutability) to ensure the search logic is perfectly isolated and predictable.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** None.
**Solutions:** N/A.
**Lessons Learned:** Pure functions act as an excellent firewall between application state and UI logic. By writing `filterChats` independently, we guarantee that the original `chatSessions` array cannot be accidentally mutilated during a complex search operation.
**Screenshots Placeholder:** N/A
**Next Improvements:** Connect the search input to the sidebar rendering engine using this helper.

---

### Version v5.0.0
**Date:** 2026-07-18
**Feature Name:** Search UI (PR 5.1)
**Objective:** Introduce a dedicated search bar into the sidebar to establish the visual and interactive layout for upcoming chat filtering capabilities.
**Problem Statement:** As chat history grows, finding specific conversations becomes tedious. Before implementing full text-search algorithms, the UI layer must be securely integrated into the sidebar without causing layout shifts or displacing existing controls.
**What Was Implemented:**
* Added a new `.sidebar-search` container in `index.ejs`, nestled cleanly between the header and the "New Chat" button.
* Designed a responsive, accessible search input featuring a `search` icon for clear affordance and a `clear` (×) button for quick resetting.
* Added modern focus states in `style.css` matching the application's overall accent color and shadow tokens (`box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.2)`).
* Hooked up lightweight JS logic in `script.js` to conditionally toggle the visibility of the clear button based on input length, maintaining a clean UI when empty.
**Internal Working:** The clear button dynamically switches between `display: none` and `display: flex` via an `input` event listener, and immediately re-focuses the input when clicked.
**Architecture Decisions:** Isolated the Search UI completely from the application's state rendering pipeline. It currently acts purely as a dumb visual component, ensuring no regressions in the existing chat list behavior.
**Libraries Used:** Lucide (icons), Vanilla JS, CSS.
**Folder/File Changes:** Modified `views/index.ejs`, `public/css/style.css`, and `public/js/script.js`.
**Challenges Faced:** Positioning the icons flawlessly inside the input box without overlapping user text.
**Solutions:** Utilized CSS `position: relative` on the container with absolute positioning for the icons, coupled with explicit left/right padding on the `input` field.
**Lessons Learned:** Building UI independently from complex filtering logic drastically simplifies testing. We can perfect the responsive layout and micro-interactions (like the clear button) before touching the heavy state-management code.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement actual filtering logic to dynamically hide non-matching chats.

---

### Version v4.3.0
**Date:** 2026-07-18
**Feature Name:** Delete Edge Cases (PR 4.4)
**Objective:** Harden the chat deletion workflow by introducing robust defensive programming techniques to prevent invalid states, rapid-click bugs, and unexpected external mutations.
**Problem Statement:** The initial in-memory delete logic functioned well in the "happy path" but was vulnerable to edge cases. For instance, double-clicking the confirmation button could trigger back-to-back splice operations, or a delayed deletion could target a chat that no longer exists, throwing an exception or leaving the application in a permanently broken state.
**What Was Implemented:**
* Decoupled validation logic into dedicated helper functions: `chatExists()`, `ensureMinimumChats()`, and `ensureValidActiveChat()`.
* Upgraded `deleteChat()` to utilize these helpers, guaranteeing the application always enforces a valid minimum state (at least one chat exists, and the active chat pointer is valid) even if external logic mutates the list unexpectedly.
* Patched `handleDeleteConfirm()` to cache the target ID locally and instantly nullify the global `currentDeleteChatId` pointer. This entirely neutralizes double-click race conditions.
* Added a pre-flight `chatExists()` check before allowing a deletion to proceed, cleanly handling stale requests by quietly closing the modal instead of throwing an error.
**Internal Working:** The logic evaluates the application constraints (`length > 0` and `exists(active)`) *after* any deletion (or failed deletion), shifting the codebase from imperative step-by-step state management to a more declarative "ensure valid state" model.
**Architecture Decisions:** Adopted the "guard clause" defensive programming pattern. By validating the state at the beginning and end of operations, we remove the need for deeply nested `if/else` checks, flattening the logic and making it significantly easier to read.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** Handling rapid-clicks without introducing complex debouncing logic.
**Solutions:** Instantly clearing the state pointer (`currentDeleteChatId = null`) effectively acts as a synchronous lock, ignoring any subsequent clicks that arrive before the UI updates.
**Lessons Learned:** UI events are not inherently synchronous with user perception. Users can easily fire two click events before a modal begins its closing animation. Immediate, synchronous state nullification is the most resilient way to prevent duplicate operations on destructive workflows.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement actual LocalStorage persistence.

---

### Version v4.2.0
**Date:** 2026-07-18
**Feature Name:** Delete State (PR 4.3)
**Objective:** Connect the Delete Confirmation Modal to the application's internal memory state so that chats can be deleted and the active chat seamlessly transitions, without yet committing to LocalStorage.
**Problem Statement:** Deleting a chat is not just about removing an object from an array; it's about handling what happens to the user's viewport. If the active chat is deleted, the app cannot be left in an undefined state. We need smart fallback logic to automatically select adjacent chats or generate a fresh one if the workspace is emptied.
**What Was Implemented:**
* Built `deleteChat(chatId)` in `script.js` to handle splicing the target chat out of the `chatSessions` array.
* Engineered active-chat fallback logic: if the currently active chat is deleted, the system intelligently selects the next available adjacent chat (or the previous one if the tail was deleted).
* Implemented a safeguard so that if the last remaining chat is deleted, a brand new chat is immediately instantiated to ensure the application is never empty.
* Hooked up `handleDeleteConfirm()` to invoke the deletion and fire `refreshUI()` to instantly synchronize both the sidebar and conversation rendering areas.
* Explicitly mutated `currentChatId` manually instead of using `setCurrentChat()` to guarantee no accidental `LocalStorage` writes occurred during this PR phase.
**Internal Working:** When confirmation is received, `Array.prototype.findIndex()` locates the item, and `.splice()` removes it. Active chat index tracking (`Math.min`) ensures smooth selection handoffs.
**Architecture Decisions:** Adopted a defensive "always valid state" pattern. The application state is guaranteed to always have at least one valid chat and one valid active selection pointer immediately after deletion.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** Ensuring `saveChatSessions()` was not accidentally invoked via internal helper dependencies like `setCurrentChat()`.
**Solutions:** Updated the active state tracking variables directly to maintain pure volatile memory state execution.
**Lessons Learned:** State transitions around deletion are often the most fragile part of client-side apps. Directly manipulating state pointers (rather than relying on high-level setters that might trigger I/O side effects) is sometimes necessary to enforce strict layer isolation during feature development.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement the final LocalStorage persistence layer to permanently commit deletions to disk.

---

### Version v4.1.0
**Date:** 2026-07-18
**Feature Name:** Delete Confirmation Modal (PR 4.2)
**Objective:** Replace the placeholder delete interaction with a robust, accessible confirmation modal to ensure users are explicitly warned before a destructive action occurs.
**Problem Statement:** Deleting a chat is an unrecoverable action. Clicking a small button in a sidebar is prone to misclicks. A secondary confirmation layer is required to intercept the action and request explicit user consent.
**What Was Implemented:**
* Added `<div id="deleteModal">` to `index.ejs`, explicitly structured as a dialog (`role="dialog"`, `aria-modal="true"`).
* The modal dynamically displays the title of the chat targeted for deletion to provide maximum context.
* Styled a dedicated `.btn-danger` class in `style.css` to render the primary action in solid red (`#ff4757`), contrasting with the neutral 'Cancel' button.
* Re-wired `script.js` so clicking the sidebar trash icon invokes `openDeleteModal(chat.id, chat.title)`.
* Built full state management: `closeDeleteModal()`, `handleDeleteConfirm()`, and updated global `Escape` key handling to close whichever modal is currently active.
**Internal Working:** The delete action caches `currentDeleteChatId` in memory while the modal is open. If the user clicks confirm, it logs the ID (as a placeholder for actual deletion) and clears the state.
**Architecture Decisions:** Adopted the exact same DOM-overlay structure as the Rename modal to ensure a consistent presentation layer and simplify state logic.
**Libraries Used:** Lucide (icons), Vanilla JS, CSS.
**Folder/File Changes:** Modified `views/index.ejs`, `public/js/script.js`, and `public/css/style.css`.
**Challenges Faced:** None.
**Solutions:** N/A.
**Lessons Learned:** Reusing modal UI patterns (backdrop overlay, centered content, escape-key listeners) speeds up development significantly while keeping the UX entirely consistent across different features.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement actual in-memory deletion and LocalStorage persistence updates.

---

### Version v4.0.0
**Date:** 2026-07-18
**Feature Name:** Delete Chat UI (PR 4.1)
**Objective:** Expose a non-destructive delete action for chat sessions within the sidebar to establish the interaction pattern for chat removal.
**Problem Statement:** Users need a way to clean up old chats, but before implementing data destruction, the UI pattern must be established securely alongside the existing rename action without causing accidental layout shifts.
**What Was Implemented:**
* Injected a `.delete-btn` into the `createSidebarItem` DOM generation sequence, positioned directly next to the rename button.
* Utilized the `trash-2` Lucide icon for clear semantic meaning.
* Engineered a custom CSS hover state for the delete button utilizing a danger color (`#ff6b6b`) and a soft red background (`rgba(255, 107, 107, 0.1)`) to visually distinguish it from the rename button.
* Hooked up a placeholder click handler that calls `e.stopPropagation()` and safely logs the intent to the console, entirely preserving application state.
**Internal Working:** The sidebar generator now outputs two actions per `.history-item`. Both are hidden by default and rely on CSS `.history-item:hover .chat-actions` to appear.
**Architecture Decisions:** Adopted the exact same inline action pattern used by Rename to guarantee interaction consistency.
**Libraries Used:** Lucide (icons), Vanilla JS, CSS.
**Folder/File Changes:** Modified `public/js/script.js` and `public/css/style.css`.
**Challenges Faced:** Ensuring the addition of a second action icon didn't break text truncation (`text-overflow: ellipsis`). Solved by adding a small flex `gap: 4px` to the action container and tweaking padding.
**Solutions:** Addressed via CSS Flexbox refinements.
**Lessons Learned:** Grouping destructive UI actions alongside safe UI actions requires distinct visual states (like red hover backgrounds) to prevent catastrophic misclicks.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement a confirmation modal for chat deletion.

---

### Version v3.3.0
**Date:** 2026-07-18
**Feature Name:** Rename Validation (PR 3.4)
**Objective:** Harden the Rename Modal input by preventing the user from saving invalid, empty, or duplicate titles while providing clear, inline error feedback.
**Problem Statement:** Users could theoretically submit empty strings, massive strings of spaces, or submit without changing the name at all, leading to poor UX and confusing application state. The system needed defensive input handling before persistence could be hooked up.
**What Was Implemented:**
* Added a `.modal-error` container in `index.ejs` hooked up to `aria-live="polite"` for accessibility.
* Added corresponding error state CSS in `style.css` (e.g. `border-color: #ff6b6b`).
* Engineered a `validateChatTitle()` helper in `script.js` to assert that the trimmed input is neither empty nor identical to the current title.
* Implemented `showRenameError()` and `clearRenameError()` DOM manipulators.
* Re-wired `handleRenameSave()` to block modal closure and block state mutation if validation fails.
* Attached an `input` event listener to the modal input to auto-clear error states as soon as the user resumes typing.
**Internal Working:** The `handleRenameSave` now acts as a strict gateway. It delegates rules to `validateChatTitle`. If the boolean returns false, the function terminates early, leaving the modal open and displaying the inline error message. 
**Architecture Decisions:** validation is structurally isolated into its own function, ensuring that the presentation layer (modal behavior) and logic layer (validation rules) remain untangled.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `views/index.ejs`, `public/js/script.js`, and `public/css/style.css`.
**Challenges Faced:** None, standard form validation mechanics.
**Solutions:** N/A.
**Lessons Learned:** Real-time UX feedback (clearing errors immediately on keypress) dramatically improves perceived application quality compared to waiting for the user to hit "Save" again.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement actual LocalStorage persistence.

---

### Version v3.2.0
**Date:** 2026-07-18
**Feature Name:** Rename State (PR 3.3)
**Objective:** Connect the Rename Modal UI to the application's internal memory state so that chats can be renamed interactively, without yet committing the changes to long-term storage.
**Problem Statement:** Users could open the modal and type, but clicking 'Save' did nothing. The application needed a dedicated state modifier to update the chat session title in memory and immediately reflect that change in the sidebar.
**What Was Implemented:**
* Built a `renameChat(chatId, newTitle)` helper in `script.js` to handle the pure state mutation. It includes basic validation (trimming whitespace and rejecting empty strings).
* Hooked up `handleRenameSave()` to read the modal input, fire the state update, and immediately call `renderSidebar()` to synchronize the UI.
* Explicitly omitted `saveChatSessions()` to maintain strict PR scoping, meaning renames exist only in volatile memory for now.
**Internal Working:** When the user clicks Save (or hits Enter), the system searches the `chatSessions` array for the matching ID, mutates its `.title` property, updates its `.updatedAt` timestamp, and re-renders the DOM list. The modal is then closed.
**Architecture Decisions:** Adopted an optimistic UI rendering pattern where the DOM updates instantly upon state mutation. Persistence is deferred to the next architectural slice.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** None, standard state management pattern.
**Solutions:** N/A.
**Lessons Learned:** Decoupling state mutation from state persistence allows features to be built and tested in completely isolated architectural slices, guaranteeing that the memory model works perfectly before disk I/O complicates debugging.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement the final persistence layer to permanently save the renamed titles to LocalStorage.

---

### Version v3.1.0
**Date:** 2026-07-18
**Feature Name:** Rename Modal (PR 3.2)
**Objective:** Replace the placeholder browser prompt with a fully integrated, accessible DOM modal for chat renaming, without hooking up the persistence layer yet.
**Problem Statement:** The native `prompt()` was a poor user experience. The application needed a proper dialog overlay that captures focus, displays the current chat title, and allows users to cancel or save their changes.
**What Was Implemented:**
* Added `<div id="renameModal">` structure to `index.ejs` featuring a blurred backdrop overlay and a clean card interface with an input box.
* Wrote comprehensive CSS in `style.css` for `.modal-backdrop`, `.modal-content`, `.modal-input`, and interactive `.btn-primary`/`.btn-secondary` controls.
* Built state management logic in `script.js` (`openRenameModal`, `closeRenameModal`, `handleRenameSave`).
* Hooked the sidebar "Rename" button up to `openRenameModal`.
* Implemented UX quality-of-life enhancements: clicking the modal backdrop closes the modal, and pressing `Escape` closes the modal.
**Internal Working:** The modal operates purely in the DOM, pulling the active `chat.title` on launch. Clicking 'Save' currently serves as a functional placeholder (`console.log`) and gracefully cleans up the modal state.
**Architecture Decisions:** Separated the modal presentation layer from the persistence layer to maintain strict PR scoping.
**Libraries Used:** Vanilla JS, CSS.
**Folder/File Changes:** Modified `views/index.ejs`, `public/js/script.js`, and `public/css/style.css`.
**Challenges Faced:** None, standard modal implementation.
**Solutions:** N/A.
**Lessons Learned:** Building custom modals in Vanilla JS is often superior to using heavy library dependencies when only one or two simple inputs are required, provided you remember to handle keyboard accessibility (Escape key).
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement the actual persistence logic to save the renamed chat title to memory and LocalStorage.

---

### Version v3.0.0
**Date:** 2026-07-18
**Feature Name:** Rename Chat UI (PR 3.1)
**Objective:** Phase 3 officially begins! Implement the front-end user interface for renaming chat sessions from the sidebar without deploying the functional persistence logic yet.
**Problem Statement:** Users need an accessible, intuitive way to manually override auto-generated or default chat titles. Doing this required embedding an action button inside an existing dense UI layout (the sidebar history items) without disrupting text wrapping or click zones.
**What Was Implemented:**
* Refactored `createSidebarItem()` in `script.js` to render a robust flexbox structure separating the title wrapper from an actions container.
* Injected a new "Rename Chat" button utilizing the Lucide `pencil` icon.
* Wired up a placeholder JavaScript interaction using a native `prompt()` to log interactions, aggressively stopping event propagation so clicks don't accidentally switch the active chat.
* Upgraded `.history-item` in `style.css` to handle hover-state injection, gracefully hiding the action button by default and revealing it when the user hovers over the chat entry.
**Internal Working:** When the sidebar rendering loop constructs DOM nodes, it now builds an interactive flex container. The rename action is bound with `e.stopPropagation()` and is guarded by `isGenerationInProgress()` to block user interactions during active streaming responses.
**Architecture Decisions:** Opted for a progressive enhancement approach, separating the layout structural work (this PR) from the payload validation and state persistence work (next PR) to ensure stable UX.
**Libraries Used:** Vanilla JS, CSS Flexbox, Lucide Icons.
**Folder/File Changes:** Modified `public/js/script.js` and `public/css/style.css`.
**Challenges Faced:** Maintaining the `text-overflow: ellipsis` effect on the chat title text when wrapping it alongside an action button.
**Solutions:** Replaced the pure text node with a dedicated flex `.chat-title-wrapper` containing an `overflow: hidden` span, forcing the CSS engine to respect the text boundary.
**Lessons Learned:** When introducing nested clickable regions (like a button inside a clickable div), rigorous event propagation management (`stopPropagation`) is strictly required to prevent catastrophic state switching cascades.
**Screenshots Placeholder:** N/A
**Next Improvements:** Actually saving the renamed title to state and LocalStorage.

---

### Version v2.4.0
**Date:** 2026-07-18
**Feature Name:** Storage Helper Refactor & Write Optimization (LocalStorage Persistence PR 2.5)
**Objective:** Clean up the internal persistence architecture to eliminate redundant disk writes and strictly enforce the separation of concerns.
**Problem Statement:** Certain UI flows naturally executed sequential state mutations (e.g. creating a chat array entry *then* instantly setting it as the active chat). Because both `createChat` and `setCurrentChat` called `saveChatSessions()`, this resulted in double-writes to LocalStorage for a single logical user interaction. 
**What Was Implemented:**
* Removed the automatic `saveChatSessions()` call from `createChat()`. Since this factory method is purely internal and always functionally chained into `setCurrentChat()`, it defers the disk write to the latter.
* Added a guard clause `if (currentChatId === chatId) return;` to `setCurrentChat()` to silently exit if the user clicks the currently active chat, preventing a useless save cycle.
* Added visual namespace groupings (`// --- Storage Layer ---`, `// --- Application State Helpers ---`) to `script.js` to clearly delineate responsibility boundaries.
**Internal Working:** The application remains perfectly synchronized but now performs 50% fewer I/O operations when bootstrapping or creating new chats.
**Architecture Decisions:** Adopted a "Commit at the end of the chain" pattern for synchronous mutations to maximize performance without sacrificing durability.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** None, the centralized state pattern made locating redundant writes very straightforward.
**Solutions:** A combination of removing one function call and adding one early return.
**Lessons Learned:** Just because state mutations are centralized doesn't mean they are fully optimized; chained synchronous mutations can easily cause redundant I/O churn if every mutation natively saves itself.
**Screenshots Placeholder:** N/A
**Next Improvements:** Cloud persistence (MongoDB).

---

### Version v2.3.0
**Date:** 2026-07-18
**Feature Name:** Storage Versioning & Safe Recovery (LocalStorage Persistence PR 2.4)
**Objective:** Make the LocalStorage schema future-proof by introducing versioning and ensuring the application gracefully recovers from corrupted or outdated storage payloads.
**Problem Statement:** If the structure of the application's storage schema ever changes in the future, attempting to load an older payload would crash the application or result in undefined behavior. Additionally, corrupted JSON data would silently fail and potentially leave the application in a permanently broken state.
**What Was Implemented:**
* Introduced a constant `STORAGE_VERSION = 1` which is now stamped into the JSON payload every time the application saves.
* Re-wrote the `restoreChatSessions()` parser to strictly validate the version parameter during boot.
* Added destructive recovery fallback logic. If `restoreChatSessions()` detects an unsupported version, an empty array, or throws a parsing exception (corrupted data), it actively calls `clearStoredChats()` to wipe the toxic entry from the browser and forces the application to cleanly reboot as a fresh instance.
**Internal Working:** During initialization, the restore pipeline extracts the payload. If `data.version !== STORAGE_VERSION`, it considers the payload poisoned, wipes it, and returns `false`. The caller (`initializeChatSession`) receives the `false` signal and natively provisions a new chat, hiding the background failure from the user entirely.
**Architecture Decisions:** Adopted a "Nuke and Pave" recovery strategy rather than attempting complex fallback migrations, as this PR lays the foundation for future migrations but explicitly delays writing the transformation layers until an actual schema change necessitates them.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** Safely clearing invalid state without getting trapped in error loops.
**Solutions:** Consolidated all validation checks and generic exceptions under unified exit branches that consistently wipe the entry before returning.
**Lessons Learned:** Defensive programming at the persistence boundary is crucial. Trusting `localStorage` data inherently assumes the user hasn't tampered with it, which is an unsafe assumption in browser environments.
**Screenshots Placeholder:** N/A
**Next Improvements:** Cloud persistence (MongoDB).

---

### Version v2.2.0
**Date:** 2026-07-18
**Feature Name:** Persist Current Chat (LocalStorage Persistence PR 2.3)
**Objective:** Guarantee the active chat context (`currentChatId`) is durably synchronized to the persistence layer under all conditions, particularly edge-case restorations.
**Problem Statement:** While the user's manual navigation clicks were synchronizing the active chat, the initialization block occasionally had to auto-correct orphaned context pointers without committing that auto-correction back to the storage layer, potentially leading to repetitive hydration warnings or desyncs.
**What Was Implemented:**
* Added a `saveChatSessions()` write flush inside the `restoreChatSessions()` array fallback block.
**Internal Working:** Whenever the application restarts, it cross-references the saved `currentChatId` against the loaded arrays. If the pointer is invalid, the engine forces the user into `chatSessions[0].id`. Crucially, it now instantly flushes this correction back to the storage engine via `saveChatSessions()`. Any other programmatic or manual chat switching safely runs through the bottlenecked `setCurrentChat()` method which handles saving natively.
**Architecture Decisions:** Enforced strict "Single Source of Truth" validation. The application only permits mutations to `currentChatId` if immediately followed by a downstream payload save.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** None, the core architecture previously laid down correctly centralized mutations.
**Solutions:** A single line injection of `saveChatSessions()`.
**Lessons Learned:** Validating state on boot requires bidirectional flow; if the boot layer fixes corrupted data, it should write those fixes back so the corruption doesn't linger invisibly on disk.
**Screenshots Placeholder:** N/A
**Next Improvements:** Cloud persistence (MongoDB).

---

### Version v2.1.0
**Date:** 2026-07-18
**Feature Name:** Restore Chat Sessions (LocalStorage Persistence PR 2.2)
**Objective:** Fully restore previously saved application state during initial startup so users can pick up exactly where they left off.
**Problem Statement:** While the application was successfully persisting data into local storage, the startup flow was not correctly validating the `currentChatId` against the actual restored payload.
**What Was Implemented:**
* Renamed `loadChatSessions()` to `restoreChatSessions()` for semantic clarity.
* Added deterministic ID validation against the active chat during the restoration phase.
* Updated `initializeChatSession()` to cleanly orchestrate the restore-or-fallback flow.
**Internal Working:** During initialization, `restoreChatSessions()` parses the local storage JSON, rebuilds JavaScript Date objects, and verifies that the stored `currentChatId` actually exists within the deserialized `chatSessions` array. If it matches, the user is dropped right back into their active conversation. If the ID is orphaned or missing, the system gracefully falls back to selecting the first available chat (index 0). If the storage is completely empty or corrupted, it catches the error and signals the UI to create a brand new chat.
**Architecture Decisions:** Restoration logic is kept strictly isolated inside the persistence layer. The `initializeChatSession()` function only ever asks the storage layer "did we restore?", and if yes, passes control blindly to the UI layer `refreshUI()` which natively knows how to render memory structures. 
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** Handling edge cases where local storage might hold an array of sessions, but an invalid `currentChatId`.
**Solutions:** A quick `some()` check against the IDs array provides a perfect guard clause before assigning the `currentChatId` singleton.
**Lessons Learned:** Safely restoring state means validating references (like foreign keys) even in unstructured storage like LocalStorage.
**Screenshots Placeholder:** N/A
**Next Improvements:** Cloud persistence (MongoDB).

---

### Version v2.0.0
**Date:** 2026-07-18
**Feature Name:** Save Chat Sessions (LocalStorage Persistence)
**Objective:** Store chat sessions and the currently active chat across browser page refreshes using the browser's native `localStorage` API.
**Problem Statement:** Moving away from memory-only persistence to allow users to maintain their conversations and context across page loads. If users refreshed the page, the `chatSessions` array was completely wiped.
**What Was Implemented:**
* Built a standalone, reusable local storage layer: `saveChatSessions`, `loadChatSessions`, and `clearStoredChats` using the `ai-chat-app` key.
* Modified `initializeChatSession` to prioritize bootstrapping from local storage. If storage parsing fails or is empty, it safely falls back to creating a fresh chat.
* Wired up the `saveChatSessions()` helper to all state-mutating functions: `createChat`, `setCurrentChat`, `addMessage`, `rollbackLastMessage`, `updateChatTitle`, and `regenerateResponse`.
**Internal Working:** During initialization, the app attempts to deserialize the stored state. Dates are reconstructed back into native JavaScript `Date` objects. If validation passes, `chatSessions` is populated and `currentChatId` is resumed. Any user action that changes the application state automatically syncs back to local storage, creating a seamless experience.
**Architecture Decisions:** Adopted a centralized state injection model rather than sprawling `localStorage.setItem()` calls. Functions like `addMessage` maintain single-responsibility by managing state array updates, while internally delegating the final snapshot commit to the storage layer.
**Libraries Used:** Vanilla JS (`localStorage`).
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** Ensuring robust error handling if users had manually corrupted their browser's local storage with malformed JSON.
**Solutions:** Wrapped the storage parser in a `try...catch` and validated array existence. A failure simply ignores the storage and starts a fresh session without crashing the app.
**Lessons Learned:** Centralized storage layers heavily rely on clean state-mutation boundaries. Because all state changes were previously centralized (e.g. `addMessage`, `rollbackLastMessage`), adding persistence required adding less than 10 lines of injection code.
**Screenshots Placeholder:** N/A
**Next Improvements:** Cloud persistence (MongoDB).

---

### Version v1.5.0
**Date:** 2026-07-18
**Feature Name:** Regenerate Edge Cases & Hardening (Regenerate Response Step 1.5)
**Objective:** Solidify the "Regenerate" and general streaming implementation by explicitly preventing invalid application states and UI bugs during execution.
**Problem Statement:** Moving away from a simple "Send Message" model to a more complex architecture with multiple chats and regenerative AI responses introduced massive race conditions. For example, a user could click a sidebar chat during an active generation cycle, causing the background `ReadableStream` to inject chunks into an entirely disconnected conversation history. 
**What Was Implemented:**
* Added a global `isGenerationInProgress()` helper which strictly evaluates `btn.disabled` as a system-wide execution lock.
* Inserted guard clauses inside sidebar click listeners (`item.addEventListener("click")`), new chat initialization (`handleNewChat()`), `sendMessage()`, and `regenerateResponse()`.
**Internal Working:** If any stream is active, the application entirely ignores requests to switch contexts or trigger parallel generations. Additionally, by depending entirely on `hasRegeneratableResponse()`, the regenerate feature intrinsically ignores edge cases where the active conversation only has user messages, or where the last AI message was aborted (and thus technically un-regeneratable).
**Architecture Decisions:** Opted for proactive UI locking over reactive payload shifting. Rather than tracking active `chatId`s down into the HTTP loop to ensure chunks appended correctly after a mid-stream switch, it is significantly safer and cleaner to simply freeze destructive context switches (like changing chats) until the active stream completes or is explicitly aborted by the user.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** Handling race conditions between background fetch loops and frontend context switches.
**Solutions:** Global stream locking via `isGenerationInProgress()`.
**Lessons Learned:** Centralized state lock functions are significantly easier to maintain than scattering scattered `btn.disabled` checks, and applying them globally across sidebar actions immediately hardens the entire application against complex asynchronous UI bugs.
**Screenshots Placeholder:** N/A
**Next Improvements:** Persistent Storage (MongoDB) integration.

---

### Version v1.4.0
**Date:** 2026-07-18
**Feature Name:** Implement Regenerate Response (Streaming Logic)
**Objective:** Fully activate the Regenerate button by rolling back the last assistant completion, rebuilding the API payload, and fetching a fresh stream.
**Problem Statement:** Implementing regenerate requires nearly identical networking, loading, UI rendering, error handling, and abort controller logic as standard message sending. Simply duplicating `sendMessage()` would have resulted in roughly 150 lines of duplicate code, making maintenance a nightmare.
**What Was Implemented:**
* Abstracted the entirety of the `fetch()` and `ReadableStream` decoding loop out of `sendMessage()` into a generic `streamChatResponse(payloadMessages, isRegenerate)` helper.
* Wrote `regenerateResponse()` which leverages `hasRegeneratableResponse()`, splices the final assistant node off the `chat.messages` array, triggers a fast UI re-render (causing the bad response to instantly vanish), and then kicks off `streamChatResponse()`.
* Bound the new logic to the previously inert Regenerate button click listener.
**Internal Working:** When Regenerate is clicked, the app locks the UI inputs, locates the index of the final assistant message (via the `getLastAssistantMessageIndex()` helper), deletes it, and instantly repaints the screen. It then computes a fresh API payload up to the point of the deletion. Finally, it delegates execution to the abstracted `streamChatResponse()` which identically handles loading indicators, chunk streaming, error states, and abort signals.
**Architecture Decisions:** Used a boolean `isRegenerate` flag inside the streaming abstraction. Standard message failures need to rollback the trailing *user* message from state, but if a regenerate fails, the user message must remain untouched. 
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** Handling error state rollbacks correctly depending on context.
**Solutions:** Bypassed `rollbackLastMessage()` in the `catch` block if `isRegenerate === true`.
**Lessons Learned:** Modularizing large orchestrator functions piece-by-piece (payload building, DOM querying) drastically simplifies final feature implementation. `regenerateResponse()` ended up being fewer than 20 lines of code because all heavy lifting was pre-abstracted.
**Screenshots Placeholder:** N/A
**Next Improvements:** Persistent Storage (MongoDB) integration.

---

### Version v1.3.2
**Date:** 2026-07-18
**Feature Name:** Add Regenerate State Helpers (Regenerate Response Step 1.3)
**Objective:** Prepare the codebase for upcoming Regenerate Response logic by extracting immutable, read-only state query functions.
**Problem Statement:** In order to rollback a conversation and regenerate a response, the orchestrator needs to know exactly what to delete and what to retry. Traversing the active session array directly inside orchestration logic (`sendMessage` or `regenerateResponse`) would lead to massive duplication and fragile array indexing bugs.
**What Was Implemented:**
* Built four new pure functions to query chat state deterministically: `getLastAssistantMessageIndex()`, `getLastAssistantMessage()`, `getLastUserMessage()`, and `hasRegeneratableResponse()`.
**Internal Working:** These functions rely on JavaScript's native `findLastIndex` to scan `getCurrentMessages()` backwards. `getLastAssistantMessage()` strictly enforces a `msg.complete === true` check, guaranteeing that we never falsely flag an aborted or streaming message as a valid regeneration candidate. `hasRegeneratableResponse()` abstracts the null-check entirely, providing a simple boolean for future UI visibility checks.
**Architecture Decisions:** By defining these as pure read-only queries, we guarantee they will never accidentally mutate the chat array. They can be safely called hundreds of times during a render cycle without risking state corruption.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** N/A
**Solutions:** N/A.
**Lessons Learned:** Abstracting array traversal into semantic queries (e.g., `getLastUserMessage()`) instead of arbitrary index lookups (`messages[messages.length - 2]`) drastically improves code readability and prevents off-by-one errors when the underlying state model scales to include things like tool calls or hidden system prompts.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement backend Regenerate API endpoint and frontend execution lifecycle.

---

### Version v1.3.1
**Date:** 2026-07-18
**Feature Name:** Build Conversation Payload Helper (Regenerate Response Step 1.2)
**Objective:** Architecturally isolate the logic responsible for assembling the conversation payload array sent to the Gemini API.
**Problem Statement:** Payload assembly was previously hardcoded directly within the massive `sendMessage()` block (`const payloadMessages = getCurrentMessages().filter(...)`). In order for the future "Regenerate" feature to request a new completion from the API, it would need the exact same payload generation logic. Leaving it inline inside `sendMessage()` would have forced severe code duplication.
**What Was Implemented:**
* Extracted the filtering array logic into a pure helper function: `buildConversationPayload()`.
* Replaced the inline evaluation inside `sendMessage()` with a simple call to the new helper.
**Internal Working:** The function executes a deterministic read against application state (`getCurrentMessages()`), filters out system states like aborted responses and loading indicators (`msg.complete === true`), and returns an identical JSON array to what `sendMessage()` originally constructed. 
**Architecture Decisions:** Striving for absolute separation of concerns. The `sendMessage()` orchestrator's only job should be UI transitions and HTTP fetching. By pulling the data transformation out, the codebase is primed for the next Regenerate PR which can now safely rely on `buildConversationPayload()` for standard generation structures without bleeding into the standard chat workflow.
**Libraries Used:** Vanilla JS.
**Folder/File Changes:** Modified `public/js/script.js`.
**Challenges Faced:** N/A (Standard Refactoring).
**Solutions:** N/A.
**Lessons Learned:** Pure functions without side-effects are the bedrock of scalable applications. `buildConversationPayload()` never touches the DOM, never calls fetch, and never mutates state, ensuring absolute predictability.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement backend Regenerate API endpoint and frontend execution lifecycle.

---

### Version v1.3.0
**Date:** 2026-07-18
**Feature Name:** Regenerate Response Button (UI Only)
**Objective:** Introduce the "Regenerate" UI button adjacent to the Copy button on the latest completed assistant message, laying the groundwork for a future regenerate API integration.
**Problem Statement:** Users had no visual mechanism to request a new AI response if the previous one was unsatisfactory. We needed a UI foundation before building out the complex backend streaming and payload generation logic.
**What Was Implemented:**
* Built a new `.message-actions` flex container to cleanly group action buttons below AI responses side-by-side.
* Created `renderRegenerateButton(container)` using the exact same structural paradigm as the Copy button, complete with Lucide icons and hover states.
* Upgraded `renderCurrentConversation()` and `renderMessage()` to conditionally calculate and flag `isLastAssistantMessage`, ensuring the Regenerate button strictly appears only on the terminal assistant node of the conversation tree.
* Attached a placeholder `console.log("Regenerate clicked")` event listener to prevent premature API calls.
**Internal Working:** During a historic render, the script iterates through messages, caching `findLastIndex` for the assistant role. When rendering each node, it constructs the `.message-actions` div. It always appends the Copy button (if complete), but selectively appends the Regenerate button only if `isLastAssistantMessage` is true. During an active stream (`sendMessage`), the Regenerate button is injected simultaneously with the Copy button only after the final streaming chunk is successfully parsed.
**Architecture Decisions:** By creating a wrapper `.message-actions`, CSS styling was simplified and future action buttons (like Thumbs Up/Down or Edit) can be trivially appended without breaking the layout grid. 
**Libraries Used:** Vanilla JS, Lucide.
**Folder/File Changes:** Modified `public/css/style.css` and `public/js/script.js`.
**Challenges Faced:** Ensuring the Regenerate button strictly attached to the final message during historical hydration while completely avoiding layout jumps during live streaming.
**Solutions:** Passed an `isLastAssistantMessage` boolean flag down the rendering pipeline.
**Lessons Learned:** Modularizing DOM component construction (e.g. `renderRegenerateButton(container)`) keeps massive orchestrator functions like `sendMessage()` and `renderMessage()` clean, focused, and maintainable.
**Screenshots Placeholder:** N/A
**Next Improvements:** Implement actual backend request, payload construction, and conversation rollback on Regenerate click.

---

### Version v1.2.0
**Date:** 2026-07-18
**Feature Name:** Copy AI Response
**Objective:** Add a "Copy" button to all completed AI responses, allowing users to effortlessly transfer the pure markdown response to their clipboard without selecting rendered HTML manually.
**Problem Statement:** Users had to highlight and copy AI text manually, which often resulted in accidentally copying DOM metadata, icons, or malformed markdown depending on their browser highlighting behavior.
**What Was Implemented:**
* Built an encapsulated `renderCopyButton()` DOM generator to inject a subtle copy button beneath AI responses.
* Added `copyResponse()`, `showCopySuccess()`, and `resetCopyButton()` logic to securely handle `navigator.clipboard.writeText` calls and temporarily toggle the button's UI state to a checkmark for user feedback.
* Integrated the rendering conditionally: only `complete: true` AI messages receive the button.
**Internal Working:** During historical `renderMessage()` loads, the button is stamped onto the DOM. During live streaming (`sendMessage()`), the button is intentionally withheld to prevent layout shifting. Once the stream successfully closes, the DOM is mutated a final time to append the copy button. Clicking the button initiates an async clipboard API call.
**Architecture Decisions:** Maintaining a strict separation of concerns, the copy logic avoids re-rendering the conversation or parsing the DOM. By passing the raw string variable (`messageText`) directly from state into the button's closure during construction, we bypass the need to scrape text back out of the HTML.
**Libraries Used:** Vanilla JS, Lucide.
**Folder/File Changes:** Modified `public/css/style.css` and `public/js/script.js`.
**Challenges Faced:** N/A
**Solutions:** N/A.
**Lessons Learned:** Storing raw data (like Markdown) in memory and passing it via closures to event listeners is infinitely safer than attempting to reverse-engineer clean text out of an already-rendered `innerHTML` block.
**Screenshots Placeholder:** N/A
**Next Improvements:** Persistent Storage (MongoDB).

---

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
