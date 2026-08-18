
# AI Health Screening Assistant

An AI-powered health screening web application that allows users to have a conversational health screening session with an AI assistant.

The application accepts user input through text and voice, processes the conversation using an LLM, responds conversationally, and generates a structured health screening report after the conversation.

> **Disclaimer:** This application is for basic health information collection only. It is not a medical diagnosis or treatment system.

---

## Features

- AI-powered health screening conversation
- Conversational question flow
- Collects basic health information:
  - Name
  - Main health concern / symptom
  - Symptom duration
  - Severity from 1–10
  - Related symptoms
- Conversation history is maintained across turns
- Voice input using browser Speech Recognition
- AI voice responses using browser Text-to-Speech
- English language support
- Push-to-talk style voice interaction
- Short and incomplete conversations are handled gracefully
- Backend API for AI conversation processing
- Responsive React frontend

---

## Tech Stack

### Frontend

- React.js
- JavaScript
- Vite
- CSS
- Web Speech API
  - Speech Recognition
  - Speech Synthesis

### Backend

- Node.js
- Express.js
- JavaScript
- REST API
- OpenRouter API

### AI

The application uses an LLM through OpenRouter.

The backend sends the conversation history and the latest user message to the AI model. The AI uses the conversation history to determine the next appropriate health-screening question.

---

## Application Architecture

```text
User
 |
 | Voice / Text
 v
React Frontend
 |
 | HTTP POST
 v
Node.js + Express Backend
 |
 | Conversation + User Message
 v
OpenRouter API
 |
 | AI Response
 v
Node.js Backend
 |
 | JSON Response
 v
React Frontend
 |
 +----> Display AI response
 |
 +----> Text-to-Speech
```

---

## Conversation Flow

The AI follows a basic health-screening flow.

```text
Start
  |
  v
Ask Name
  |
  v
Ask Main Concern / Symptom
  |
  v
Ask Duration
  |
  v
Ask Severity
  |
  v
Ask Related Symptoms
  |
  v
Complete Screening
```

The AI checks the existing conversation history before asking the next question so that information already provided by the user is not unnecessarily requested again.

For example:

```text
User:
My name is Nilesh Kumar and I have a headache.

AI:
Nice to meet you, Nilesh. How long have you had the headache?
```

Instead of asking for the name again.

---

## Voice Interaction

The application uses browser-based Web Speech APIs for voice interaction.

### Speech-to-Text

The browser's Speech Recognition API converts the user's speech into text.

```text
User speaks
     |
     v
Browser Speech Recognition
     |
     v
Text
     |
     v
Backend
```

### Text-to-Speech

The AI response is converted into speech using the browser's Speech Synthesis API.

```text
AI response
     |
     v
Browser Speech Synthesis
     |
     v
AI voice
```

This approach keeps the implementation simple and avoids requiring a separate paid TTS service for the assessment.

---

## Backend API

### Health Check

```http
GET /
```

Response:

```json
{
  "message": "AI Health Screening Backend is running"
}
```

---

### Chat

```http
POST /api/chat
```

Request:

```json
{
  "message": "I have a headache",
  "conversation": [
    {
      "role": "user",
      "content": "My name is Nilesh Kumar"
    },
    {
      "role": "assistant",
      "content": "Nice to meet you, Nilesh. What is your main health concern?"
    }
  ]
}
```

Response:

```json
{
  "response": "How long have you had the headache?"
}
```

---

## Project Structure

```text
ai-health-screening/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

# Setup Instructions

## Prerequisites

Make sure the following are installed:

- Node.js
- npm
- Git
- Google Chrome or another browser with Web Speech API support
- OpenRouter API key

---

# 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-health-screening.git
```

Go into the project:

```bash
cd ai-health-screening
```

---

# 2. Backend Setup

Open a terminal:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `backend` folder.

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

Replace:

```text
your_openrouter_api_key
```

with your actual OpenRouter API key.

> Never commit the `.env` file or expose the API key publicly.

---

# 3. Start Backend

Run:

```bash
npm run dev
```

The backend should start at:

```text
http://localhost:5000
```

Test it by opening:

```text
http://localhost:5000
```

Expected response:

```json
{
  "message": "AI Health Screening Backend is running"
}
```

---

# 4. Frontend Setup

Open another terminal.

From the project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

The Vite development server will normally run at:

```text
http://localhost:5173
```

Open the URL in the browser.

---

# Environment Variables

The backend requires:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

Example `.env.example`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

The actual `.env` file should not be committed to GitHub.

---

# Error Handling

The application handles several common failure cases:

- Empty user messages
- AI API failures
- Missing AI responses
- Speech recognition errors
- Microphone permission errors
- No speech detected
- Browser speech recognition unsupported
- AI response failures

When an AI request fails, the frontend displays an appropriate error message instead of crashing.

---

# Conversation State

Conversation state is maintained on the frontend and sent to the backend with every chat request.

Example:

```text
User message
     |
     v
Frontend conversation state
     |
     v
Backend
     |
     v
OpenRouter
     |
     v
AI response
     |
     v
Frontend updates conversation
```

This allows the AI to use previous answers when deciding what question to ask next.

---

# AI Safety

The AI is instructed to:

- Avoid diagnosing diseases
- Avoid prescribing medication
- Ask one question at a time
- Remember previously provided information
- Ask relevant follow-up questions
- Keep responses short
- Recommend appropriate medical attention when a potentially urgent situation is described

This application should not be used as a replacement for professional medical advice.

---

# Current Limitations

This is an assessment/demo implementation rather than a production medical application.

Current limitations include:

- Voice recognition depends on browser support
- Browser Speech Recognition may behave differently across browsers
- Browser Text-to-Speech is used instead of a dedicated TTS provider
- Voice interaction is turn-based rather than fully duplex
- No advanced medical diagnosis functionality
- No user authentication
- No persistent database
- No production deployment configuration

---

# Future Improvements

With additional development time, the following could be added:

- Real-time WebSocket/WebRTC communication
- Full-duplex voice conversation
- Barge-in support
- Dedicated STT provider such as Deepgram, AssemblyAI, Sarvam AI, or OpenAI
- Dedicated TTS provider such as ElevenLabs or Sarvam AI
- Automatic language detection
- Hindi and English language switching
- Persistent conversation storage
- Structured health report generation
- Authentication
- Database integration
- Better silence and background-noise handling
- Production deployment
- Streaming AI responses for lower latency

---

# Why This Architecture?

The implementation uses a simple turn-based architecture because it is reliable and practical for a take-home assessment.

Instead of recording the entire conversation and uploading it at the end, each user turn is processed independently:

```text
User speaks
    ↓
Speech-to-Text
    ↓
Conversation + Current Message
    ↓
Node.js Backend
    ↓
OpenRouter LLM
    ↓
AI Response
    ↓
Text-to-Speech
    ↓
User hears response
```

This allows the application to maintain conversation state while keeping the implementation relatively simple.

---

# Running the Complete Application

Start the backend first:

```bash
cd backend
npm run dev
```

Then open another terminal:

```bash
cd frontend
npm run dev
```

Open the frontend URL shown by Vite.

Example:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:5000
```

---

# Author

Nilesh Kumar

AI Health Screening Technical Assessment

Built using:

- React
- Node.js
- Express
- JavaScript
- OpenRouter
- Web Speech API
