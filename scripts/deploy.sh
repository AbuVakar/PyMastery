#!/bin/bash

# PyMastery Production Deployment Script
# This script automates the deployment of PyMastery to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="pymastery"
BACKUP_DIR="/opt/backups/pymastery"
LOG_FILE="/var/log/pymastery/deploy.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env files exist
    if [[ ! -f ".env.production" ]]; then
        log_error ".env.production file not found. Please create it first."
        exit 1
    fi
    
    if [[ ! -f ".env.secrets" ]]; then
        log_error ".env.secrets file not found. Please create it first."
        exit 1
    fi
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        log_warning "This script should be run as root for proper permissions."
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Prerequisites check passed"
}

backup_database() {
    log "Creating database backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Backup MongoDB
    docker exec pymastery-mongodb mongodump --out "/backup/mongodb_$TIMESTAMP" --gzip
    
    # Copy backup to backup directory
    docker cp pymastery-mongodb:/backup/mongodb_$TIMESTAMP "$BACKUP_DIR/"
    
    # Backup Redis
    docker exec pymastery-redis redis-cli BGSAVE
    docker cp pymastery-redis:/data/dump.rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb"
    
    log_success "Database backup completed"
}

update_code() {
    log "Updating application code..."
    
    # Pull latest code
    git pull origin main
    
    # Check if there are any changes
    if git diff --quiet HEAD~1 HEAD; then
        log_warning "No code changes detected"
    else
        log_success "Code updated successfully"
    fi
}

build_images() {
    log "Building Docker images..."
    
    # Build backend image
    docker build -t pymastery-backend:latest ./backend
    
    # Build frontend image
    docker build -t pymastery-frontend:latest ./frontend
    
    log_success "Docker images built successfully"
}

run_tests() {
    log "Running tests..."
    
    # Run backend tests
    docker run --rm -v "$(pwd)/backend:/app" pymastery-backend:latest python -m pytest tests/ -v
    
    # Run frontend tests
    docker run --rm -v "$(pwd)/frontend:/app" pymastery-frontend:latest npm test
    
    log_success "All tests passed"
}

deploy_application() {
    log "Deploying application..."
    
    # Stop existing services
    docker-compose -f docker-compose.production.yml down
    
    # Start new services
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Check if backend is healthy
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        log_success "Backend is healthy"
    else
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Check if frontend is accessible
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        log_success "Frontend is accessible"
    else
        log_error "Frontend health check failed"
        exit 1
    fi
}

run_migrations() {
    log "Running database migrations..."
    
    # Run migrations
    docker exec pymastery-backend python -m database.cli migrate
    
    log_success "Database migrations completed"
}

cleanup() {
    log "Cleaning up old resources..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove unused Docker volumes (be careful with this)
    # docker volume prune -f
    
    # Remove old backups (keep last 7 days)
    find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
    
    log_success "Cleanup completed"
}

send_notification() {
    log "Sending deployment notification..."
    
    # Send Slack notification (if configured)
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 PyMastery deployed successfully at $(date)\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # Send email notification (if configured)
    if [[ -n "$DEPLOYMENT_EMAIL" ]]; then
        echo "PyMastery deployed successfully at $(date)" | \
            mail -s "PyMastery Deployment Success" "$DEPLOYMENT_EMAIL"
    fi
    
    log_success "Notifications sent"
}

verify_deployment() {
    log "Verifying deployment..."
    
    # Check all services are running
    services=("pymastery-backend" "pymastery-mongodb" "pymastery-redis" "pymastery-nginx")
    
    for service in "${services[@]}"; do
        if docker ps | grep -q "$service"; then
            log_success "$service is running"
        else
            log_error "$service is not running"
            exit 1
        fi
    done
    
    # Check API endpoints
    endpoints=(
        "http://localhost:8000/api/health"
        "http://localhost:8000/api/v1/dashboard/stats"
        "http://localhost:8000/api/v1/search"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f "$endpoint" > /dev/null 2>&1; then
            log_success "API endpoint $endpoint is accessible"
        else
            log_error "API endpoint $endpoint is not accessible"
            exit 1
        fi
    done
    
    log_success "Deployment verification completed"
}

rollback() {
    log_error "Deployment failed. Initiating rollback..."
    
    # Stop current services
    docker-compose -f docker-compose.production.yml down
    
    # Restore from backup
    if [[ -d "$BACKUP_DIR/mongodb_$TIMESTAMP" ]]; then
        docker cp "$BACKUP_DIR/mongodb_$TIMESTAMP" pymastery-mongodb:/backup/
        docker exec pymastery-mongodb mongorestore --drop --gzip /backup/mongodb_$TIMESTAMP
    fi
    
    # Start services with previous image
    docker-compose -f docker-compose.production.yml up -d
    
    log_success "Rollback completed"
}

# Main deployment flow
main() {
    log "Starting PyMastery deployment..."
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Check prerequisites
    check_prerequisites
    
    # Backup database
    backup_database
    
    # Update code
    update_code
    
    # Build images
    build_images
    
    # Run tests
    run_tests
    
    # Deploy application
    if ! deploy_application; then
        rollback
        exit 1
    fi
    
    # Run migrations
    run_migrations
    
    # Verify deployment
    verify_deployment
    
    # Cleanup
    cleanup
    
    # Send notification
    send_notification
    
    log_success "PyMastery deployment completed successfully!"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "backup")
        backup_database
        ;;
    "test")
        run_tests
        ;;
    "cleanup")
        cleanup
        ;;
    "verify")
        verify_deployment
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|backup|test|cleanup|verify}"
        echo "  deploy  - Full deployment (default)"
        echo "  rollback - Rollback to previous version"
        echo "  backup   - Create database backup"
        echo "  test     - Run tests only"
        echo "  cleanup  - Cleanup old resources"
        echo "  verify   - Verify current deployment"
        exit 1
        ;;
esac
