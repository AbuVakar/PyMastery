#!/bin/bash

# PyMastery Development Startup Script
# This script starts both frontend and backend services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required directories exist
check_directories() {
    if [ ! -d "frontend" ]; then
        print_error "Frontend directory not found!"
        exit 1
    fi
    
    if [ ! -d "backend" ]; then
        print_error "Backend directory not found!"
        exit 1
    fi
}

# Check if required files exist
check_files() {
    if [ ! -f "frontend/.env" ]; then
        print_warning "Frontend .env file not found, copying from .env.example"
        cp frontend/.env.example frontend/.env
    fi
    
    if [ ! -f "backend/.env" ]; then
        print_warning "Backend .env file not found, copying from .env.example"
        cp backend/.env.example backend/.env
    fi
}

# Install dependencies if needed
install_dependencies() {
    print_status "Checking dependencies..."
    
    # Frontend dependencies
    if [ ! -d "frontend/node_modules" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
    
    # Backend dependencies
    if [ ! -d "backend/.venv" ]; then
        print_status "Setting up Python virtual environment..."
        cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cd ..
    fi
}

# Start services
start_services() {
    print_status "Starting PyMastery services..."
    
    # Start backend in background
    print_status "Starting backend..."
    cd backend
    source .venv/bin/activate
    python start.py &
    BACKEND_PID=$!
    cd ..
    
    # Wait a moment for backend to start
    sleep 3
    
    # Check if backend is healthy
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        print_success "Backend is healthy!"
    else
        print_error "Backend failed to start!"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    
    # Start frontend
    print_status "Starting frontend..."
    cd frontend
    npm run dev:quiet &
    FRONTEND_PID=$!
    cd ..
    
    print_success "PyMastery is starting up!"
    echo ""
    echo "Services:"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for interrupt
    trap 'print_status "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; print_success "All services stopped"; exit 0' INT
    
    # Keep script running
    wait
}

# Main execution
main() {
    echo "PyMastery Development Startup Script"
    echo "=================================="
    echo ""
    
    check_directories
    check_files
    install_dependencies
    start_services
}

# Run main function
main
