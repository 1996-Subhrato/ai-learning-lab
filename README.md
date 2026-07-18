# AI Assistant Integration

**Current Version:** `v0.9.0`

A premium, production-ready AI Chat application built with Node.js, Express, and Google's Generative AI (Gemini). The application features a beautiful, modern UI inspired by top-tier AI chatbots (like ChatGPT and Claude) and supports rich markdown rendering.

## 📚 Documentation
Comprehensive project documentation is maintained in the `docs/` folder:
- [Project History](./docs/PROJECT_HISTORY.md)
- [Changelog](./docs/CHANGELOG.md)
- [Roadmap](./docs/ROADMAP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Learnings](./docs/LEARNINGS.md)

## 🌟 Features

- **Modern UI/UX**: Premium dark theme with glassmorphic elements, a responsive sidebar, and a clean, user-friendly interface.
- **Google Gemini Integration**: Uses the official `@google/generative-ai` SDK to communicate with the blazing-fast `gemini-2.5-flash` model.
- **Rich Text & Code Formatting**: Beautifully renders markdown responses, complete with syntax highlighting for code blocks using `highlight.js`.
- **Responsive Design**: Fully responsive layout that adapts gracefully from desktop to mobile devices.
- **Smart Input Area**: Auto-resizing textarea with `Enter` to send and `Shift+Enter` for new lines.

## 🚀 Tech Stack

**Backend:**
- [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Gemini API)
- [OpenAI](https://www.npmjs.com/package/openai) (Support included)
- [EJS](https://ejs.co/) for templating

**Frontend:**
- Vanilla HTML, CSS, and JS
- [Marked.js](https://marked.js.org/) for Markdown rendering
- [Highlight.js](https://highlightjs.org/) for code syntax highlighting
- [Lucide Icons](https://lucide.dev/) for crisp, modern SVG icons

## 🛠️ Installation & Setup

1. **Clone the repository** (if applicable):
   ```bash
   git clone <your-repo-url>
   cd ai-integration
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root of your project and add your API keys:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

4. **Run the application**:
   - For development (with auto-restart via Nodemon):
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

5. **Open in Browser**:
   Navigate to `http://localhost:5000` (or the port specified in your `app.js`).

## 🎨 UI Features

- **Dynamic Loading State**: Features a sleek, CSS-only bouncing dots animation while waiting for the AI response.
- **Scroll Management**: The chat area automatically scrolls to the newest message, while the custom scrollbar maintains a premium look.
- **Responsive Sidebar**: Includes a hidden-by-default mobile sidebar toggle for clean usage on smaller screens.

## 📜 License

This project is licensed under the ISC License.
