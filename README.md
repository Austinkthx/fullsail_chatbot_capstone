# NexusChat — Multi-LLM Chatbot

A full-stack chatbot web application with multi-model support, chat history, and user accounts.

Built with **React** (frontend) + **Python FastAPI** (backend) + **MongoDB** (database).

## Features

- **LLM Model Dropdown** — Switch between Ollama (local), OpenAI, and Anthropic models
- **Chat History** — Conversations saved and organized in the sidebar
- **User Accounts** — Register/login with JWT authentication
- **Streaming Responses** — Real-time token-by-token display via SSE
- **Auto-Titling** — Conversations auto-title from your first message
- **Dark Theme** — Polished UI with indigo accent
- **Docker Support** — Run everything with one command

## Supported Models

### Local (Ollama — free, runs on your machine)
| Model | ID |
|-------|-----|
| Llama 3.2 (3B) | `llama3.2` |
| Llama 3.2 (1B) | `llama3.2:1b` |
| Mistral 7B | `mistral` |
| Gemma 2 (2B) | `gemma2:2b` |
| Qwen 2.5 (3B) | `qwen2.5:3b` |
| Phi-3 Mini | `phi3:mini` |
| DeepSeek R1 (1.5B) | `deepseek-r1:1.5b` |

### Cloud (requires API keys)
| Model | Provider |
|-------|----------|
| GPT-4o / GPT-4o Mini | OpenAI |
| Claude Sonnet 4.5 / Claude Haiku 4.5 | Anthropic |

## Quick Start (Local)

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (or Docker for MongoDB)
- Ollama (for local models)

### 1. Start MongoDB
```bash
docker run -d -p 27017:27017 --name nexuschat-mongo mongo:7
```

### 2. Start Ollama and pull a model
```bash
ollama serve
ollama pull llama3.2
```

### 3. Start the backend
```bash
cd server
pip install -r requirements.txt
cp .env.example .env
python run.py
```
Backend runs at http://localhost:8000

### 4. Start the frontend
```bash
cd client
npm install
npm start
```
Frontend runs at http://localhost:3000

### 5. Open in browser
Go to http://localhost:3000, create an account, and start chatting!

## Quick Start (Docker)

### 1. Start Ollama and pull a model
```bash
ollama serve
ollama pull llama3.2
```

### 2. Run with Docker Compose
```bash
cp .env.example .env
docker-compose up --build
```
Open http://localhost:3000

## Cloud API Keys (Optional)

To use OpenAI or Anthropic models, add your keys to `.env`:
```
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## Project Structure

```
nexuschat/
├── server/                     # Python FastAPI backend
│   ├── app/
│   │   ├── main.py             # FastAPI app & MongoDB connection
│   │   ├── config.py           # Environment configuration
│   │   ├── models.py           # Pydantic schemas
│   │   ├── auth_utils.py       # JWT & password utilities
│   │   ├── routes/
│   │   │   ├── auth.py         # Register, Login, Get User
│   │   │   ├── chat.py         # Conversations & Messages (SSE)
│   │   │   └── llm.py          # List available models
│   │   └── services/
│   │       └── llm_service.py  # Ollama/OpenAI/Anthropic integration
│   ├── requirements.txt
│   ├── run.py
│   └── Dockerfile
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.js      # Conversation list & user menu
│   │   │   ├── ModelSelector.js# LLM dropdown grouped by provider
│   │   │   └── ChatMessage.js  # Message bubbles with code rendering
│   │   ├── context/
│   │   │   └── AuthContext.js  # Auth state management
│   │   ├── pages/
│   │   │   ├── LoginPage.js    # Login/Register form
│   │   │   └── ChatPage.js     # Main chat interface
│   │   ├── services/
│   │   │   └── api.js          # HTTP & streaming API calls
│   │   ├── App.js              # Routes & auth guards
│   │   └── App.css             # Full application styles
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/chat/conversations | List conversations |
| POST | /api/chat/conversations | Create conversation |
| DELETE | /api/chat/conversations/:id | Delete conversation |
| GET | /api/chat/conversations/:id/messages | Get messages |
| POST | /api/chat/conversations/:id/messages | Send message (SSE stream) |
| GET | /api/llm/models | List available models |

## Troubleshooting

**"Cannot connect to Ollama"**
- Make sure Ollama is running: `ollama serve`
- Docker users: Ollama must run on the host, not inside Docker

**"No models installed"**
- Pull at least one model: `ollama pull llama3.2`

**Cloud models show as unavailable**
- Add your API keys to the `.env` file and restart the server

**MongoDB connection failed**
- Make sure MongoDB is running on port 27017
- Docker users: `docker-compose up` starts MongoDB automatically

## License

MIT License — built for learning and school projects!
