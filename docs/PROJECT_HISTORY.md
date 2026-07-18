# Project History

This file serves as a complete development journal for the project. New features and updates are logged here.

### Version v0.5.0
**Date:** 2026-07-18
**Feature Name:** Streaming Responses (Step 1 - Backend)
**Objective:** Modify the backend to stream AI responses as they are generated rather than waiting for the entire response.
**Problem Statement:** The previous implementation buffered the entire AI response before sending it to the client, leading to long loading times.
**What Was Implemented:**
* Replaced `generateContent` with `generateContentStream` from the Gemini SDK.
* Implemented HTTP chunked transfer encoding (`Transfer-Encoding: chunked`).
* Streamed text chunks to the Express response stream using `res.write()`.
* Added robust error handling to safely close the stream if an error occurs mid-generation.
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
