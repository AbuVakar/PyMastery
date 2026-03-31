#!/bin/bash

# PyMastery Production Deployment Script
# This script automates the deployment of PyMastery to production Kubernetes cluster

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="pymastery"
KUBECTL_CMD="kubectl"
DOCKER_REGISTRY="your-registry.com"
PROJECT_NAME="pymastery"

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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check if kubectl can connect to cluster
    if ! $KUBECTL_CMD cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if helm is installed (optional)
    if command -v helm &> /dev/null; then
        print_status "Helm is available"
    else
        print_warning "Helm is not installed. Some features may not work."
    fi
    
    print_success "Prerequisites check completed"
}

# Function to validate environment variables
validate_env_vars() {
    print_status "Validating environment variables..."
    
    required_vars=(
        "MONGODB_URL"
        "REDIS_URL"
        "JWT_SECRET_KEY"
        "OPENAI_API_KEY"
        "JUDGE0_API_KEY"
        "SMTP_HOST"
        "SMTP_USER"
        "SMTP_PASSWORD"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_error "Please set these variables before continuing."
        exit 1
    fi
    
    print_success "Environment variables validation completed"
}

# Function to create namespace
create_namespace() {
    print_status "Creating namespace: $NAMESPACE"
    
    if $KUBECTL_CMD get namespace "$NAMESPACE" &> /dev/null; then
        print_warning "Namespace $NAMESPACE already exists"
    else
        $KUBECTL_CMD apply -f k8s/production/namespace.yaml
        print_success "Namespace $NAMESPACE created"
    fi
}

# Function to create secrets
create_secrets() {
    print_status "Creating secrets..."
    
    # Create secrets from environment variables
    cat <<EOF | $KUBECTL_CMD apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: pymastery-secrets
  namespace: $NAMESPACE
type: Opaque
data:
  mongodb-url: $(echo -n "$MONGODB_URL" | base64)
  redis-url: $(echo -n "$REDIS_URL" | base64)
  jwt-secret: $(echo -n "$JWT_SECRET_KEY" | base64)
  openai-api-key: $(echo -n "$OPENAI_API_KEY" | base64)
  judge0-api-key: $(echo -n "$JUDGE0_API_KEY" | base64)
  smtp-host: $(echo -n "$SMTP_HOST" | base64)
  smtp-user: $(echo -n "$SMTP_USER" | base64)
  smtp-password: $(echo -n "$SMTP_PASSWORD" | base64)
EOF
    
    print_success "Secrets created"
}

# Function to create ConfigMap
create_configmap() {
    print_status "Creating ConfigMap..."
    
    $KUBECTL_CMD apply -f k8s/production/configmap.yaml
    print_success "ConfigMap created"
}

# Function to deploy database
deploy_database() {
    print_status "Deploying MongoDB..."
    
    $KUBECTL_CMD apply -f k8s/production/mongodb-deployment.yaml
    
    # Wait for MongoDB to be ready
    print_status "Waiting for MongoDB to be ready..."
    $KUBECTL_CMD wait --for=condition=ready pod -l app=mongodb -n "$NAMESPACE" --timeout=300s
    
    print_success "MongoDB deployed and ready"
}

# Function to deploy Redis
deploy_redis() {
    print_status "Deploying Redis..."
    
    $KUBECTL_CMD apply -f k8s/production/redis-deployment.yaml
    
    # Wait for Redis to be ready
    print_status "Waiting for Redis to be ready..."
    $KUBECTL_CMD wait --for=condition=ready pod -l app=redis -n "$NAMESPACE" --timeout=300s
    
    print_success "Redis deployed and ready"
}

# Function to deploy backend
deploy_backend() {
    print_status "Deploying backend..."
    
    $KUBECTL_CMD apply -f k8s/production/backend-deployment.yaml
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    $KUBECTL_CMD wait --for=condition=ready pod -l app=pymastery-backend -n "$NAMESPACE" --timeout=300s
    
    print_success "Backend deployed and ready"
}

# Function to deploy frontend
deploy_frontend() {
    print_status "Deploying frontend..."
    
    $KUBECTL_CMD apply -f k8s/production/frontend-deployment.yaml
    
    # Wait for frontend to be ready
    print_status "Waiting for frontend to be ready..."
    $KUBECTL_CMD wait --for=condition=ready pod -l app=pymastery-frontend -n "$NAMESPACE" --timeout=300s
    
    print_success "Frontend deployed and ready"
}

# Function to deploy ingress
deploy_ingress() {
    print_status "Deploying ingress..."
    
    $KUBECTL_CMD apply -f k8s/production/ingress.yaml
    
    print_success "Ingress deployed"
}

# Function to deploy monitoring
deploy_monitoring() {
    print_status "Deploying monitoring stack..."
    
    # Create monitoring namespace
    if ! $KUBECTL_CMD get namespace monitoring &> /dev/null; then
        $KUBECTL_CMD create namespace monitoring
    fi
    
    # Deploy Prometheus and Grafana
    $KUBECTL_CMD apply -f k8s/production/monitoring.yaml
    
    # Wait for monitoring to be ready
    print_status "Waiting for monitoring stack to be ready..."
    $KUBECTL_CMD wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s
    $KUBECTL_CMD wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s
    
    print_success "Monitoring stack deployed"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check backend health
    backend_url=$($KUBECTL_CMD get ingress pymastery-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[2].host}')
    if curl -f -s "https://$backend_url/api/health" > /dev/null; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    frontend_url=$($KUBECTL_CMD get ingress pymastery-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}')
    if curl -f -s "https://$frontend_url/" > /dev/null; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        return 1
    fi
    
    print_success "All health checks passed"
}

# Function to show deployment status
show_deployment_status() {
    print_status "Deployment status:"
    
    echo ""
    echo "=== Pods ==="
    $KUBECTL_CMD get pods -n "$NAMESPACE"
    
    echo ""
    echo "=== Services ==="
    $KUBECTL_CMD get services -n "$NAMESPACE"
    
    echo ""
    echo "=== Ingress ==="
    $KUBECTL_CMD get ingress -n "$NAMESPACE"
    
    echo ""
    echo "=== HPA ==="
    $KUBECTL_CMD get hpa -n "$NAMESPACE"
    
    echo ""
    echo "=== Access URLs ==="
    frontend_url=$($KUBECTL_CMD get ingress pymastery-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}')
    backend_url=$($KUBECTL_CMD get ingress pymastery-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[2].host}')
    grafana_url=$($KUBECTL_CMD get ingress pymastery-ingress -n monitoring -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "N/A")
    
    echo "Frontend: https://$frontend_url"
    echo "Backend API: https://$backend_url"
    echo "Grafana: https://$grafana_url" 2>/dev/null || echo "Grafana: Not configured"
}

# Function to cleanup old resources
cleanup() {
    print_status "Cleaning up old resources..."
    
    # Remove old pods that are terminating
    $KUBECTL_CMD delete pods -n "$NAMESPACE" --field-selector=status.phase=Failed --ignore-not-found=true
    
    # Clean up old images (optional)
    docker system prune -f
    
    print_success "Cleanup completed"
}

# Function to rollback deployment
rollback() {
    print_status "Rolling back deployment..."
    
    # Rollback backend
    $KUBECTL_CMD rollout undo deployment/pymastery-backend -n "$NAMESPACE"
    
    # Rollback frontend
    $KUBECTL_CMD rollout undo deployment/pymastery-frontend -n "$NAMESPACE"
    
    # Wait for rollback to complete
    $KUBECTL_CMD rollout status deployment/pymastery-backend -n "$NAMESPACE" --timeout=300s
    $KUBECTL_CMD rollout status deployment/pymastery-frontend -n "$NAMESPACE" --timeout=300s
    
    print_success "Rollback completed"
}

# Main deployment function
deploy() {
    print_status "Starting PyMastery production deployment..."
    
    # Load environment variables from .env.production
    if [[ -f ".env.production" ]]; then
        source .env.production
        print_status "Loaded environment variables from .env.production"
    else
        print_warning ".env.production file not found. Please ensure environment variables are set."
    fi
    
    check_prerequisites
    validate_env_vars
    create_namespace
    create_secrets
    create_configmap
    deploy_database
    deploy_redis
    deploy_backend
    deploy_frontend
    deploy_ingress
    deploy_monitoring
    run_health_checks
    show_deployment_status
    
    print_success "PyMastery production deployment completed successfully!"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy      - Deploy PyMastery to production"
    echo "  rollback    - Rollback to previous deployment"
    echo "  status      - Show deployment status"
    echo "  health      - Run health checks"
    echo "  cleanup     - Clean up old resources"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 status"
    echo "  $0 rollback"
}

# Parse command line arguments
case "${1:-}" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    status)
        show_deployment_status
        ;;
    health)
        run_health_checks
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: ${1:-}"
        show_usage
        exit 1
        ;;
esac
