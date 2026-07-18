# Architecture

This document explains the project architecture.

## Overview
The application is a full-stack Node.js application utilizing Express for routing and EJS for view templating. The frontend uses vanilla HTML/CSS/JS to communicate with the backend via the Fetch API. The backend securely interacts with AI services (Google Gemini).

## Folder Structure
```text
ai-integration/
├── .env                # Environment variables (API keys)
├── app.js              # Entry point & Express server configuration
├── package.json        # Dependencies
├── public/             # Static assets (CSS, JS)
├── routes/             # Express route handlers
└── views/              # EJS templates for frontend
```

## Request & Data Flow
Browser
↓
Fetch API (Frontend JS)
↓
Express Route (`/google/chat`)
↓
Gemini Streaming API
↓
Receive Chunk
↓
Write Chunk to Response (`res.write`)
↓
Browser
↓
Next Chunk
↓
Response Ends

