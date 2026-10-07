#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  ExpenseGuard: The Financial Immune System"
echo "========================================================"

# 1. Backend Setup
echo "[1/4] Setting up Python virtual environment..."
if [ ! -d "backend/.venv" ]; then
    python3 -m venv backend/.venv
fi
source backend/.venv/bin/activate
pip install -q -r backend/requirements.txt

# 2. Frontend Setup
echo "[2/4] Installing frontend dependencies..."
cd frontend
npm install
cd ..

# 3. Database Initial Seed
echo "[3/4] Initializing database and seeding 60 days of telemetry..."
backend/.venv/bin/python -c "from backend.database import init_db, SessionLocal; from backend.seed import seed; init_db(); db = SessionLocal(); print('Seeded:', seed(db)); db.close()"

# 4. Start Servers
echo "[4/4] Starting ExpenseGuard API and Frontend..."
backend/.venv/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "ExpenseGuard is live!"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
