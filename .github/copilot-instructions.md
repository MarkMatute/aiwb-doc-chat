# AI Coding Agent Instructions for aiwb-doc-chat

## Project Overview
This is a FastAPI-based web API application focused on document chat functionality (currently in early development with a basic health endpoint). The project follows standard Python FastAPI patterns with virtual environment setup.

## Development Environment Setup
- **Python Version**: 3.8+ required
- **Virtual Environment**: Always use `venv/` directory for isolation
- **Dependencies**: Managed via `requirements.txt` with pinned versions

### Critical Workflow Commands
```bash
# Environment setup (run from project root)
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# Development server
uvicorn main:app --reload  # Auto-reload on changes

# Key endpoints
# http://127.0.0.1:8000/health - Health check
# http://127.0.0.1:8000/docs - Auto-generated API docs
```

## Project Structure & Conventions
- `main.py` - FastAPI application entry point with app instance
- `requirements.txt` - Pinned dependencies (FastAPI 0.115.0, uvicorn 0.32.0)
- `HOW_TO_RUN.md` - Detailed setup instructions for new developers
- `venv/` - Virtual environment (ignored in git)

## Code Patterns & Architecture
- **API Definition**: Single `FastAPI()` app instance in `main.py`
- **Endpoint Pattern**: Use standard FastAPI decorators (`@app.get("/path")`)
- **Health Checks**: `/health` endpoint returns `{"status": "healthy"}`
- **Development**: Use `--reload` flag for auto-reloading during development

## Adding New Features
When extending this API:
1. Add new endpoint functions in `main.py` following the health check pattern
2. Update `requirements.txt` if adding new dependencies
3. Test endpoints via the auto-generated docs at `/docs`
4. Follow FastAPI best practices for request/response models

## Environment & Dependencies
- Virtual environment is **required** - never install globally
- Use `pip install -r requirements.txt` for consistent dependency versions
- The `.gitignore` includes standard Python, IDE, and FastAPI patterns

## Documentation Strategy
- FastAPI auto-generates OpenAPI docs accessible at `/docs`
- Keep `HOW_TO_RUN.md` updated for setup instructions
- Document any complex business logic or external integrations as the project grows