# IssueWise – ML-Powered GitHub Issue Analysis

IssueWise is a machine learning-powered platform that analyzes public GitHub repositories to help developers understand, categorize, and prioritize issues. It combines machine learning, natural language processing, and semantic similarity techniques to provide useful insights into repository issues.

## Demo

[Watch the IssueWise Demo on YouTube](https://www.youtube.com/watch?v=rKOuRXMsByQ)

## Features

- **Repository Analysis:** Analyze public GitHub repositories and retrieve their issues.
- **Issue Classification:** Automatically predict issue categories using a trained machine learning model.
- **Priority Prediction:** Predict issue priority using rule-based analysis.
- **Similar Issue Detection:** Identify semantically similar issues using Sentence Transformers and similarity techniques.
- **AI-Powered Summaries:** Generate concise issue summaries using the Groq API.
- **Analytics Dashboard:** Visualize issue statistics, category distributions, and repository insights.
- **Issue Details:** View individual issues along with their predicted categories, priorities, and related issues.

## Tech Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| ML Service | Python, FastAPI, scikit-learn |
| NLP & Similarity | TF-IDF, Sentence Transformers |
| APIs | GitHub REST API, Groq API |
| Containerization | Docker, Docker Compose |

## Architecture

IssueWise consists of three main components:

- **Frontend:** React application built with Vite.
- **Backend:** Node.js and Express.js application that handles API requests and communicates with the ML service.
- **ML Service:** Python FastAPI application responsible for machine learning predictions and similar issue detection.

The frontend communicates with the backend through HTTP APIs, while the backend communicates with the ML service through HTTP requests.

## Getting Started

IssueWise can be run locally using either Docker Compose or by setting up each service independently.

### Prerequisites

- Git
- Docker and Docker Compose (for the Docker setup)
- Node.js and npm
- Python 3.11 or later
- GitHub Personal Access Token
- Groq API Key

### Option 1: Using Docker Compose

**1. Clone the repository**

```bash
git clone https://github.com/Pranav-Savant/IssueWise.git
cd IssueWise
```

**2. Configure environment variables**

Create the backend environment file:

```bash
cp server/.env.example server/.env
```

Add your GitHub Personal Access Token and Groq API Key to `server/.env`.

**3. Build and run the application**

```bash
docker compose up --build
```

**4. Access the application**

Open the following URL in your browser:

```text
http://localhost
```

### Option 2: Running Services Independently

**1. Clone the repository**

```bash
git clone https://github.com/Pranav-Savant/IssueWise.git
cd IssueWise
```

**2. Set up the ML service**

Navigate to the ML directory and create a virtual environment:

```bash
cd ml
python -m venv venv
```

Activate the virtual environment.

Windows:

```bash
venv\Scripts\activate
```

Linux/macOS:

```bash
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the ML service:

```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

**3. Set up the backend**

Open another terminal:

```bash
cd server
npm install
```

Create a `.env` file using the provided `.env.example` file and configure the following variables:

```env
PORT=5000
GITHUB_TOKEN=your_github_token
GROQ_API_KEY=your_groq_api_key
FRONTEND_URL=http://localhost:5173
ML_SERVICE_URL=http://127.0.0.1:8000
```

Start the backend:

```bash
npm start
```

**4. Set up the frontend**

Open another terminal:

```bash
cd client
npm install
```

Create a `.env` file with the following variable:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the application:

```text
http://localhost:5173
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL used by the frontend |
| `PORT` | Port on which the backend runs |
| `GITHUB_TOKEN` | GitHub Personal Access Token used for GitHub API requests |
| `GROQ_API_KEY` | API key used for AI-powered summaries |
| `FRONTEND_URL` | Frontend origin allowed by the backend |
| `ML_SERVICE_URL` | Base URL of the FastAPI ML service |

Use the provided `.env.example` files as templates. Add your own credentials locally and never commit actual API keys or secrets.

## Project Structure

```text
IssueWise/
│
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── server/                 # Express backend
│   ├── routes/
│   ├── services/
│   ├── index.js
│   ├── Dockerfile
│   └── package.json
│
├── ml/                     # Python ML service
│   ├── models/
│   ├── api.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

## Deployment Notes

The ML service uses a SentenceTransformer model for semantic embeddings, which requires significant memory and computational resources. The available free-tier hosting instances could not reliably support the model.

Consequently, a permanent live deployment of the complete application was not feasible within the available free-tier resources.

The complete application can still be run locally in either of the following ways:

- Using Docker Compose to build and run all three services together.
- Cloning the repository, installing the required dependencies, configuring environment variables, and running each service independently.
