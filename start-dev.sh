#!/bin/bash

# Metro Booking Service - Development Startup Script

echo "🚀 Starting Metro Booking Service with Twilio Authentication"
echo "============================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if server dependencies are installed
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server
    npm install
    cd ..
    echo "✅ Server dependencies installed"
    echo ""
fi

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    echo "✅ Frontend dependencies installed"
    echo ""
fi

# Check if .env files exist
if [ ! -f "server/.env" ]; then
    echo "⚠️  Warning: server/.env not found. Creating from template..."
    cp server/.env.example server/.env 2>/dev/null || echo "Please create server/.env manually"
fi

if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env not found. Creating from template..."
    cp .env.example .env 2>/dev/null || echo "Please create .env manually"
fi

echo ""
echo "🎯 Starting services..."
echo ""
echo "📱 Backend API will run on: http://localhost:3000"
echo "🌐 Frontend will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start backend in background
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
