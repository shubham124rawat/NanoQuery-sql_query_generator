# 🚀 NanoQuery

NanoQuery is an AI-powered, privacy-first Text-to-SQL developer workspace. It allows you to convert plain-English questions into complex, fully executable SQL queries instantly, without your private database structure or credentials ever leaving your local machine.

By combining a **React (Vite) frontend** and a **FastAPI backend** running inside isolated **Docker containers**, NanoQuery securely bridges straight into your local **XAMPP MySQL** instance.

---

## ✨ Features

* **Natural Language to SQL:** Powered by the official `google-genai` SDK using the ultra-fast `gemini-2.5-flash` model.
* **100% Data Privacy:** Your database schema is handled entirely on your machine. No cloud storage, no third-party database tracking.
* **Widescreen Interactive Dashboard:** A spacious layout designed for seamless schema visualization, prompt execution, and live data rendering.
* **Persistent History:** Keep track of your past generated queries for easy auditing and re-execution.
* **Dockerized Infrastructure:** Launch the complete stack (Frontend, Backend, and Networking) with one single terminal command.

---

## 🏗️ Architecture

```text
               +----------------------------------------+
               |              YOUR LAPTOP               |
               |                                        |
               |   +------------+      +------------+   |
               |   |  Docker    |      |  Docker    |   |
               |   |  Frontend  | ---> |  Backend   |   |
               |   |  (React)   |      | (FastAPI)  |   |
               |   +------------+      +------------+   |
               |                             |          |
               |                             v          |
               |                    [ host.docker.internal ]
               |                             |          |
               |                             v          |
               |                      +------------+    |
               |                      |   XAMPP    |    |
               |                      |  (MySQL)   |    |
               |                      +------------+    |
               +----------------------------------------+


```
## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Python, FastAPI
- **AI:** Google Gemini API
- **Database:** MySQL

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/NanoQuery.git
cd NanoQuery

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Add your Gemini API key to backend/.env
# GEMINI_API_KEY=your_key_here

# Start the application
./docker-start.sh
```

Access the app:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

**Note:** When connecting to your local MySQL database from Docker, use `host.docker.internal` as the host.

### Manual Setup

#### Prerequisites
- Node.js 18+
- Python 3.10+
- MySQL (XAMPP recommended)
- Gemini API Key ([Get it here](https://aistudio.google.com/))

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

#### Database
Import `database/sample_schema.sql` into your MySQL database using phpMyAdmin or MySQL CLI.

## Environment Variables

### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sql_generator_db
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## Usage

1. **Connect Database:** Choose between sample data or your own MySQL database
2. **Enter Query:** Type your question in natural language
3. **Review Results:** Get SQL queries with explanations and risk analysis
4. **Execute:** Run queries directly and view results

## API Documentation

Interactive API docs available at: http://localhost:8000/docs

## Docker

For detailed Docker setup and troubleshooting, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)

HAPPY CODING !!!🫶🏻
