# Optimus CRM: AI-Powered WhatsApp Sales Agent

Optimus CRM is a full-stack application designed to streamline sales outreach and lead management through a powerful, AI-driven WhatsApp agent. It provides a comprehensive suite of tools for sales professionals to import leads, run automated outreach campaigns, and manage conversations, with an AI co-pilot handling the initial engagement and qualification.

## Core Features

*   **AI Sales Agent**: A stateful AI built with LangGraph and OpenAI that engages with leads, answers questions, and qualifies them based on a pre-defined playbook.
*   **Kanban Leads Pipeline**: A drag-and-drop interface to visually manage leads through various stages of the sales funnel (New Lead, Outreach Sent, Demo Booked, etc.).
*   **Campaign Management**: Import leads in bulk via CSV files and initiate automated, personalized outreach campaigns.
*   **Real-time WhatsApp Chat**: A chat interface integrated directly into the lead view, showing the full conversation history and allowing for manual intervention.
*   **Live UI Updates**: The entire frontend is connected to Supabase Realtime, ensuring that any change in the backend (e.g., a new message, a stage change) is reflected in the UI instantly without needing a refresh.
*   **Dashboard & Calendar**: A high-level dashboard for viewing sales metrics and a full-featured calendar for managing appointments.

---

## Architectural Overview

The application is a modern monorepo with a decoupled frontend and backend.
[React Frontend] <---- (REST API Calls) ----> [Node.js Backend API]
| |
| |------> [OpenAI API]
| |------> [WhatsApp Web]
| |
(Real-time Subscriptions) |
| |
'-----------------> [Supabase Database] <-------'
code
Code
*   **React Frontend (`client`):** A single-page application that provides the user interface. It fetches data from the Node.js API and subscribes directly to the Supabase database for live updates.
*   **Node.js Backend (`server`):** An Express.js server that serves three main purposes:
    1.  **REST API:** Provides standard endpoints for the frontend to manage data.
    2.  **Background Services:** Runs persistent workers for sending queued outreach messages and maintaining a live connection to WhatsApp.
    3.  **AI Agent Engine:** Contains the complex LangGraph state machine that acts as the "brain" for all AI-powered conversations.
*   **Supabase (Database):** The single source of truth for the entire application, storing all data related to leads, campaigns, conversations, and agent memory.

---

## Technology Stack

### Frontend (Client)
*   **Framework:** React 19
*   **Routing:** React Router DOM
*   **Data Fetching:** SWR (for powerful caching and revalidation)
*   **API Client:** Axios
*   **Real-time:** Supabase.js Client
*   **UI/UX:** FullCalendar, DnD Kit (for drag-and-drop)

### Backend (Server)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** Supabase (PostgreSQL) with `supabase-js`
*   **AI Engine:** LangChain.js & LangGraph
*   **LLM Provider:** OpenAI (GPT-4 Turbo)
*   **WhatsApp Integration:** `whatsapp-web.js`
*   **Schema Validation:** Zod

---

## Setup and Installation

### Prerequisites
*   Node.js (v18 or higher)
*   An active Supabase project
*   An OpenAI API Key
*   A dedicated WhatsApp account for the bot

### 1. Clone the Repository
```bash
git clone <your_repository_url>
cd optimus-crm
2. Backend Setup
Navigate to the server directory and create your environment file.
code
Bash
cd server
cp .env.example .env
Now, open the .env file and fill in your credentials:
code
Env
# .env in /server

# Your Supabase project URL
SUPABASE_URL="https://your-project-ref.supabase.co"
# Your Supabase SERVICE_ROLE key (this is a secret)
SUPABASE_SERVICE_KEY="your_supabase_service_key"

# Your OpenAI API Key
OPENAI_API_KEY="sk-..."
Install dependencies:
code
Bash
npm install
3. Frontend Setup
Navigate to the client directory and create its environment file.
code
Bash
cd ../client
cp .env.example .env
Open the .env file and fill in your credentials. Note: These are the public, "anon" keys.
code
Env
# .env in /client

# Your Supabase project URL
REACT_APP_SUPABASE_URL="https://your-project-ref.supabase.co"
# Your Supabase PUBLIC ANON key
REACT_APP_SUPABASE_ANON_KEY="your_supabase_anon_key"

# The URL of your backend server
REACT_APP_API_URL="http://localhost:5001/api"
Install dependencies:
code
Bash
npm install
4. Database Initialization
Before starting the server, you must update your Supabase database schema.
Log in to your Supabase project dashboard.
Go to the SQL Editor.
Copy the contents of database_setup/database_changes.sql and run the query to add the necessary jsonb columns to your leads table.
Running the Application
You will need two separate terminals to run the frontend and backend concurrently.
Terminal 1: Start the Backend Server
code
Bash
cd server
npm start
The server will start on http://localhost:5001. You will be prompted in the terminal to scan a QR code with your dedicated WhatsApp account to log in.
Terminal 2: Start the React Frontend
code
Bash
cd client
npm start
The React development server will open the application in your browser at http://localhost:3000
