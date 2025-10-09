# How to Run

This is a monorepo containing both the FastAPI backend and React TypeScript frontend for the owner chat interface.

## Prerequisites
- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn

## Backend Setup (FastAPI)

1. **Create a virtual environment**
   ```bash
   python3 -m venv venv
   ```

2. **Activate the virtual environment**

   On macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

   On Windows:
   ```bash
   venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend server**
   ```bash
   uvicorn main:app --reload
   ```

5. **Access the API**
   - Health endpoint: http://127.0.0.1:8000/health
   - API documentation: http://127.0.0.1:8000/docs

## Frontend Setup (React TypeScript)

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Access the frontend**
   - Owner chat interface: http://localhost:3000

## Development

- **Backend**: FastAPI server with RAG document chat functionality
- **Frontend**: React TypeScript app with Tailwind CSS for owner chat interface
- **Communication**: Frontend configured to proxy API calls to backend

## Architecture

```
aiwb-doc-chat/
├── backend (Python FastAPI)
│   ├── main.py
│   ├── services/
│   └── requirements.txt
├── frontend (React TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── tailwind.config.js
└── HOW_TO_RUN.md
```
