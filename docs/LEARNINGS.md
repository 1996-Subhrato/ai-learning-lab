# Learnings

This file documents concepts learned while implementing features for this project.

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
