# PyMastery Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying PyMastery to a production Kubernetes cluster with automated scaling, monitoring, and security features.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Process](#deployment-process)
5. [Monitoring and Observability](#monitoring-and-observability)
6. [Security Configuration](#security-configuration)
7. [Scaling and Performance](#scaling-and-performance)
8. [Backup and Recovery](#backup-and-recovery)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

## Prerequisites

### Required Tools

- **Kubernetes** (v1.24+)
- **kubectl** (v1.24+)
- **Docker** (v20.10+)
- **Helm** (v3.8+) - optional
- **Git** (v2.30+)

### Required Services

- **Kubernetes Cluster** (managed or self-hosted)
- **Container Registry** (Docker Hub, GCR, ECR, or private)
- **Load Balancer** (cloud provider or on-premises)
- **DNS Provider** (for domain management)
- **SSL Certificate** (Let's Encrypt or custom)

### Infrastructure Requirements

#### Minimum Cluster Resources

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: pymastery-limits
  namespace: pymastery
spec:
  limits:
  - default:
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    type: Container
```

#### Recommended Cluster Configuration

- **Nodes**: 3+ worker nodes
- **CPU per node**: 2+ cores
- **Memory per node**: 4+ GB
- **Storage**: SSD with 50+ GB
- **Network**: 1+ Gbps

## Infrastructure Setup

### 1. Kubernetes Cluster Setup

#### Google Kubernetes Engine (GKE)

```bash
# Create cluster
gcloud container clusters create pymastery-prod \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=e2-standard-2 \
  --disk-size=50 \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=10 \
  --enable-autorepair \
  --enable-autoupgrade

# Get credentials
gcloud container clusters get-credentials pymastery-prod \
  --zone=us-central1-a
```

#### Amazon EKS

```bash
# Create cluster
eksctl create cluster \
  --name pymastery-prod \
  --region us-west-2 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 10 \
  --managed

# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name pymastery-prod
```

#### Self-Hosted (using kubeadm)

```bash
# Initialize master node
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# Setup kubectl for non-root user
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install network plugin (Flannel)
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
```

### 2. Storage Classes

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
allowVolumeExpansion: true
reclaimPolicy: Retain
```

### 3. Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: pymastery-network-policy
  namespace: pymastery
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
  - from:
    - podSelector:
        matchLabels:
          app: pymastery-frontend
  - from:
    - podSelector:
        matchLabels:
          app: pymastery-backend
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: mongodb
  - to:
    - podSelector:
        matchLabels:
          app: redis
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
```

## Environment Configuration

### 1. Environment Variables

Create `.env.production`:

```bash
# Database Configuration
MONGODB_URL=mongodb://mongodb-service.pymastery:27017/pymastery
REDIS_URL=redis://redis-service.pymastery:6379/0

# Security
JWT_SECRET_KEY=your-super-secure-secret-key-here
OPENAI_API_KEY=your-openai-api-key
JUDGE0_API_KEY=your-judge0-api-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Application Settings
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
```

### 2. Secrets Management

#### Using Kubernetes Secrets

```bash
# Create secrets from environment variables
kubectl create secret generic pymastery-secrets \
  --from-literal=mongodb-url="$MONGODB_URL" \
  --from-literal=redis-url="$REDIS_URL" \
  --from-literal=jwt-secret="$JWT_SECRET_KEY" \
  --from-literal=openai-api-key="$OPENAI_API_KEY" \
  --from-literal=judge0-api-key="$JUDGE0_API_KEY" \
  --from-literal=smtp-host="$SMTP_HOST" \
  --from-literal=smtp-user="$SMTP_USER" \
  --from-literal=smtp-password="$SMTP_PASSWORD" \
  --namespace=pymastery
```

#### Using External Secret Manager

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: pymastery
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "pymastery"
```

### 3. SSL/TLS Configuration

#### Let's Encrypt with cert-manager

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@pymastery.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Deployment Process

### 1. Automated Deployment

```bash
# Make deployment script executable
chmod +x scripts/deploy-production.sh

# Run deployment
./scripts/deploy-production.sh deploy
```

### 2. Manual Deployment Steps

```bash
# 1. Create namespace
kubectl apply -f k8s/production/namespace.yaml

# 2. Create secrets and configmaps
kubectl apply -f k8s/production/secrets.yaml
kubectl apply -f k8s/production/configmap.yaml

# 3. Deploy databases
kubectl apply -f k8s/production/mongodb-deployment.yaml
kubectl apply -f k8s/production/redis-deployment.yaml

# 4. Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n pymastery --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n pymastery --timeout=300s

# 5. Deploy applications
kubectl apply -f k8s/production/backend-deployment.yaml
kubectl apply -f k8s/production/frontend-deployment.yaml

# 6. Deploy ingress
kubectl apply -f k8s/production/ingress.yaml

# 7. Deploy monitoring
kubectl apply -f k8s/production/monitoring.yaml
```

### 3. Verification

```bash
# Check deployment status
kubectl get pods -n pymastery
kubectl get services -n pymastery
kubectl get ingress -n pymastery

# Check health endpoints
curl -k https://api.pymastery.com/api/health
curl -k https://pymastery.com/
```

## Monitoring and Observability

### 1. Prometheus Configuration

The monitoring stack includes:

- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **AlertManager**: Alert management
- **Node Exporter**: System metrics

### 2. Key Metrics

#### Application Metrics

```yaml
# Custom metrics in application
http_requests_total{method="GET", endpoint="/api/health", status="200"}
http_request_duration_seconds_bucket{le="0.1", endpoint="/api/health"}
database_connections_active
database_query_duration_seconds
cache_hit_rate
code_execution_total{language="python", status="success"}
```

#### System Metrics

```yaml
# System metrics
cpu_usage_percent
memory_usage_percent
disk_usage_percent
network_receive_bytes_total
network_transmit_bytes_total
```

### 3. Grafana Dashboards

#### Application Dashboard

- Request rate and error rate
- Response time percentiles
- Database performance
- Cache performance
- Code execution metrics

#### Infrastructure Dashboard

- CPU and memory usage
- Disk and network I/O
- Pod status and restarts
- HPA scaling events

### 4. Alerting Rules

```yaml
# Critical alerts
- alert: ServiceDown
  expr: up{job=~"pymastery-.*"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Service {{ $labels.job }} is down"

- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
```

## Security Configuration

### 1. Pod Security Policies

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: pymastery-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

### 2. Network Security

```yaml
# Ingress security annotations
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pymastery-ingress
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://pymastery.com"
    nginx.ingress.kubernetes.io/server-snippet: |
      more_set_headers "X-Frame-Options: DENY";
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "X-XSS-Protection: 1; mode=block";
      more_set_headers "Strict-Transport-Security: max-age=31536000; includeSubDomains";
```

### 3. RBAC Configuration

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: pymastery
  name: pymastery-operator
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
```

## Scaling and Performance

### 1. Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: pymastery-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: pymastery-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 2. Vertical Pod Autoscaling

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: pymastery-backend-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: pymastery-backend
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: backend
      maxAllowed:
        cpu: 1
        memory: 2Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi
```

### 3. Cluster Autoscaling

```bash
# For GKE
gcloud container clusters update pymastery-prod \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=20 \
  --autoscaling-profile=optimize-utilization

# For EKS
eksctl create nodegroup --cluster=pymastery-prod \
  --name=autoscaling-group \
  --node-type=t3.medium \
  --nodes=3 \
  --nodes-min=2 \
  --nodes-max=20 \
  --auto-scaling-group
```

### 4. Performance Optimization

#### Database Optimization

```yaml
# MongoDB configuration
env:
- name: MONGODB_INITDB_ROOT_USERNAME
  value: "admin"
- name: MONGODB_INITDB_ROOT_PASSWORD
  valueFrom:
    secretKeyRef:
      name: pymastery-secrets
      key: mongodb-password
- name: MONGODB_INITDB_DATABASE
  value: "pymastery"
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

#### Caching Strategy

```yaml
# Redis configuration
env:
- name: REDIS_PASSWORD
  valueFrom:
    secretKeyRef:
      name: pymastery-secrets
      key: redis-password
command:
- redis-server
- --requirepass
- $(REDIS_PASSWORD)
- --maxmemory
- "512mb"
- --maxmemory-policy
- "allkeys-lru"
```

## Backup and Recovery

### 1. Database Backups

```bash
# MongoDB backup script
#!/bin/bash
kubectl exec -n pymastery deployment/mongodb -- mongodump \
  --uri="mongodb://admin:password@mongodb-service.pymastery:27017/pymastery" \
  --out=/backup/$(date +%Y%m%d_%H%M%S)

# Copy backup to persistent storage
kubectl cp pymastery/mongodb-pod:/backup/$(date +%Y%m%d_%H%M%S) ./backups/
```

### 2. Automated Backup CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mongodb-backup
  namespace: pymastery
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: mongodb-backup
            image: mongo:6.0
            command:
            - /bin/bash
            - -c
            - |
              mongodump --uri="mongodb://admin:password@mongodb-service.pymastery:27017/pymastery" \
                --out=/backup/$(date +%Y%m%d_%H%M%S)
              aws s3 cp /backup/$(date +%Y%m%d_%H%M%S) s3://pymastery-backups/mongodb/
            env:
            - name: AWS_ACCESS_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: aws-credentials
                  key: access-key-id
            - name: AWS_SECRET_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: aws-credentials
                  key: secret-access-key
          restartPolicy: OnFailure
```

### 3. Disaster Recovery

#### Recovery Procedure

```bash
# 1. Scale down applications
kubectl scale deployment pymastery-backend --replicas=0 -n pymastery
kubectl scale deployment pymastery-frontend --replicas=0 -n pymastery

# 2. Restore database
kubectl exec -i -n pymastery deployment/mongodb -- mongorestore \
  --uri="mongodb://admin:password@mongodb-service.pymastery:27017/pymastery" \
  --drop /backup/latest/pymastery

# 3. Scale up applications
kubectl scale deployment pymastery-backend --replicas=3 -n pymastery
kubectl scale deployment pymastery-frontend --replicas=2 -n pymastery

# 4. Verify recovery
kubectl wait --for=condition=ready pod -l app=pymastery-backend -n pymastery --timeout=300s
kubectl wait --for=condition=ready pod -l app=pymastery-frontend -n pymastery --timeout=300s
```

## Troubleshooting

### 1. Common Issues

#### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n pymastery

# Check pod logs
kubectl logs <pod-name> -n pymastery

# Check events
kubectl get events -n pymastery --sort-by=.metadata.creationTimestamp
```

#### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints -n pymastery

# Check service configuration
kubectl describe service <service-name> -n pymastery

# Test connectivity
kubectl exec -it <pod-name> -n pymastery -- curl http://<service-name>:<port>
```

#### Ingress Not Working

```bash
# Check ingress status
kubectl describe ingress pymastery-ingress -n pymastery

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Test ingress
kubectl exec -it <pod-name> -n pymastery -- curl -k https://api.pymastery.com/api/health
```

### 2. Performance Issues

#### High Memory Usage

```bash
# Check resource usage
kubectl top pods -n pymastery

# Check memory limits
kubectl describe pod <pod-name> -n pymastery

# Adjust resource limits
kubectl patch deployment pymastery-backend -n pymastery -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"memory":"1Gi"}}}]}}}}'
```

#### High CPU Usage

```bash
# Check CPU usage
kubectl top pods -n pymastery

# Check HPA status
kubectl describe hpa pymastery-backend-hpa -n pymastery

# Scale manually if needed
kubectl scale deployment pymastery-backend --replicas=5 -n pymastery
```

### 3. Debug Commands

```bash
# General status
kubectl get all -n pymastery
kubectl get events -n pymastery --sort-by=.metadata.creationTimestamp

# Resource usage
kubectl top nodes
kubectl top pods -n pymastery

# Network debugging
kubectl exec -it <pod-name> -n pymastery -- netstat -tulpn
kubectl exec -it <pod-name> -n pymastery -- nslookup mongodb-service.pymastery

# Storage debugging
kubectl get pv,pvc -n pymastery
kubectl exec -it <pod-name> -n pymastery -- df -h
```

## Maintenance

### 1. Rolling Updates

```bash
# Update backend image
kubectl set image deployment/pymastery-backend backend=pymastery/backend:v1.1.0 -n pymastery

# Monitor rollout status
kubectl rollout status deployment/pymastery-backend -n pymastery

# Rollback if needed
kubectl rollout undo deployment/pymastery-backend -n pymastery
```

### 2. Certificate Renewal

```bash
# Check certificate status
kubectl describe certificate pymastery-tls -n pymastery

# Force renewal if needed
kubectl delete certificate pymastery-tls -n pymastery
kubectl apply -f k8s/production/ingress.yaml
```

### 3. Maintenance Windows

```bash
# Schedule maintenance
kubectl annotate deployment pymastery-backend maintenance=true -n pymastery

# Scale down during maintenance
kubectl scale deployment pymastery-backend --replicas=1 -n pymastery

# Resume after maintenance
kubectl annotate deployment pymastery-backend maintenance- -n pymastery
kubectl scale deployment pymastery-backend --replicas=3 -n pymastery
```

### 4. Health Monitoring

```bash
# Continuous health check script
#!/bin/bash
while true; do
  if ! curl -f -s https://api.pymastery.com/api/health > /dev/null; then
    echo "$(date): Health check failed"
    # Send alert
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"PyMastery health check failed"}' \
      $SLACK_WEBHOOK_URL
  fi
  sleep 60
done
```

## Conclusion

This production deployment guide provides a comprehensive framework for deploying PyMastery with enterprise-grade features including:

- **High Availability**: Multiple replicas and automatic failover
- **Scalability**: Horizontal and vertical autoscaling
- **Security**: Network policies, RBAC, and SSL/TLS
- **Monitoring**: Prometheus, Grafana, and alerting
- **Backup**: Automated database backups and disaster recovery
- **Maintenance**: Rolling updates and health monitoring

Follow this guide to ensure a robust, scalable, and secure production deployment of PyMastery.

For additional support or questions, refer to the troubleshooting section or contact the infrastructure team.
