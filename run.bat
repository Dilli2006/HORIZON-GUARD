@echo off
echo ========================================================
echo   ExpenseGuard: The Financial Immune System
echo ========================================================
echo.

:: 1. Backend Setup
echo [1/4] Setting up Python virtual environment...
if not exist backend\.venv (
    python -m venv backend\.venv
)
call backend\.venv\Scripts\activate.bat
python -m pip install -q -r backend\requirements.txt

:: 2. Frontend Setup
echo [2/4] Installing frontend dependencies...
cd frontend
call npm install
cd ..

:: 3. Database Initial Seed
echo [3/4] Initializing database and seeding 60 days of telemetry...
backend\.venv\Scripts\python -c "from backend.database import init_db, SessionLocal; from backend.seed import seed; init_db(); db = SessionLocal(); print('Seeded:', seed(db)); db.close()"

:: 4. Start Servers
echo [4/4] Starting ExpenseGuard API and Frontend...
start "ExpenseGuard Backend API (Port 8000)" cmd /k "backend\.venv\Scripts\python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "ExpenseGuard Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo ExpenseGuard is live!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ========================================================
pause
