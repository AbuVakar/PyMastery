# PyMastery - Complete Architecture Documentation

## 🏗️ SYSTEM OVERVIEW

PyMastery is a **modern, scalable programming learning platform** built with a microservices-ready monolithic architecture. The system is designed to handle millions of users while maintaining exceptional performance and security.

## 🎯 ARCHITECTURE PRINCIPLES

### Core Design Principles
1. **Scalability**: Built for horizontal scaling
2. **Reliability**: 99.9% uptime with fault tolerance
3. **Security**: Enterprise-grade security measures
4. **Performance**: Optimized for sub-200ms response times
5. **Maintainability**: Clean, well-documented codebase
6. **Extensibility**: Plugin-ready architecture for future features

### Technology Stack
- **Backend**: FastAPI (Python 3.13)
- **Frontend**: React 19 + TypeScript + Vite
- **Database**: MongoDB with connection pooling
- **Cache**: Redis + multi-level caching
- **Code Execution**: Judge0 API + local fallback
- **Monitoring**: Prometheus + Grafana
- **Containerization**: Docker + Docker Compose

## 🏛️ SYSTEM ARCHITECTURE

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        LOAD BALANCER                        │
│                      (Nginx + SSL)                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼────┐    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
│ FRONTEND │    │ BACKEND │    │ MONGODB │    │  REDIS  │
│ (React) │    │ (FastAPI)│    │ (Data)  │    │ (Cache) │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼────┐    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
│ JUDGE0  │    │ PROMET- │    │ GRAFANA │    │ ALERTS  │
│ (Code   │    │ HEUS    │    │ (Dash-  │    │ (Alert- │
│ Execution)│   │ (Metrics)│    │ boards) │    │ Manager)│
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### Component Interactions
```
User Request → Nginx → Frontend/Backend → Services → Database/Cache → Response
     ↓              ↓           ↓            ↓              ↓           ↓
  Load Balance   SSL/TLS    API Routes   Business Logic  Data Store  Response
  SSL Termination  Routing   Middleware   Services     Cache      HTML/JSON
```

## 🧩 COMPONENT ARCHITECTURE

### 1. Backend Architecture (FastAPI)

#### **Layer Structure**
```
┌─────────────────────────────────────────────────────────┐
│                   API LAYER                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │    Auth     │ │   Users     │ │   Courses   ││
│  │ Middleware  │ │ Middleware  │ │ Middleware  ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 SERVICE LAYER                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Auth      │ │   User      │ │   Course    ││
│  │  Service    │ │  Service    │ │  Service    ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 DATA LAYER                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  MongoDB    │ │    Redis    │ │   Files     ││
│  │ (Primary)   │ │   (Cache)   │ │ (Storage)   ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────┘
```

#### **Key Backend Components**

##### **API Layer**
- **FastAPI Application**: Modern async web framework
- **Middleware Stack**: Security, performance, error handling
- **Route Handlers**: RESTful API endpoints
- **WebSocket Support**: Real-time communication
- **OpenAPI Documentation**: Auto-generated API docs

##### **Service Layer**
- **Business Logic**: Core application logic
- **Code Execution**: Judge0 integration + fallback
- **User Management**: Authentication, authorization, profiles
- **Course Management**: Content, enrollment, progress
- **Analytics**: Performance tracking and reporting

##### **Data Layer**
- **MongoDB**: Primary data store with connection pooling
- **Redis**: Multi-level caching (memory, disk, distributed)
- **File Storage**: User uploads, static assets
- **Search**: Elasticsearch integration for advanced search

### 2. Frontend Architecture (React 19)

#### **Component Structure**
```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │    Pages    │ │ Components  │ │   Hooks     ││
│  │ (Routes)    │ │ (Reusable)  │ │ (State)     ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   STATE MANAGEMENT                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Zustand   │ │ React Query │ │   Context   ││
│  │ (Global)    │ │ (Server)    │ │ (Local)     ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   DATA LAYER                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │    API      │ │   Cache     │ │   Storage   ││
│  │ (Axios)     │ │ (Local)     │ │ (IndexedDB) ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────┘
```

#### **Key Frontend Components**

##### **Presentation Layer**
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool with HMR
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing

##### **State Management**
- **Zustand**: Lightweight state management
- **React Query**: Server state management
- **Context API**: Component-level state
- **Local Storage**: Persistent client storage

##### **Data Layer**
- **Axios**: HTTP client with interceptors
- **React Query**: Caching and synchronization
- **IndexedDB**: Client-side storage
- **Service Worker**: PWA offline support

### 3. Database Architecture (MongoDB)

#### **Schema Design**
```
┌─────────────────────────────────────────────────────────┐
│                 DATABASE SCHEMA                        │
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │    Users    │ │   Courses   │ │  Problems   ││
│  │             │ │             │ │             ││
│  │ - Profile   │ │ - Content   │ │ - Tests     ││
│  │ - Auth      │ │ - Metadata  │ │ - Solutions ││
│  │ - Progress  │ │ - Stats     │ │ - Stats     ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │Submissions │ │Enrollments │ │ Leaderboard ││
│  │             │ │             │ │             ││
│  │ - Code      │ │ - User/     │ │ - Rankings  ││
│  │ - Results   │ │   Course    │ │ - Points    ││
│  │ - Feedback  │ │ - Progress  │ │ - Achieve-  ││
│  │ - Stats     │ │ - Status    │ │   ments    ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────┘
```

#### **Indexing Strategy**
- **Compound Indexes**: Multi-field queries
- **Unique Indexes**: Email, username constraints
- **Text Indexes**: Full-text search capability
- **TTL Indexes**: Automatic data expiration

### 4. Cache Architecture (Redis)

#### **Multi-Level Caching**
```
┌─────────────────────────────────────────────────────────┐
│                 CACHE HIERARCHY                       │
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   L1 Cache  │ │   L2 Cache  │ │   L3 Cache  ││
│  │ (Memory)    │ │ (Redis)     │ │ (Disk)      ││
│  │             │ │             │ │             ││
│  │ - Fastest   │ │ - Fast      │ │ - Persistent ││
│  │ - Limited   │ │ - Shared    │ │ - Large     ││
│  │ - Volatile  │ │ - Persistent│ │ - Slow      ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
│                     │                   │         │
│                     └───────────────────┼─────────┘
│                                         │
┌─────────────────────────────────────────────▼─────────┐
│                 CACHE PROMOTION                        │
│                                                     │
│  L3 → L2 → L1 (Hot data promotion)                │
│  L1 → L2 → L3 (Cold data eviction)                │
│                                                     │
└─────────────────────────────────────────────────────────┘
```

#### **Cache Strategies**
- **Write-Through**: Immediate cache updates
- **Write-Behind**: Asynchronous cache updates
- **Cache-Aside**: Application-managed cache
- **Read-Through**: Automatic cache population

### 5. Code Execution Architecture

#### **Execution Pipeline**
```
┌─────────────────────────────────────────────────────────┐
│                 CODE EXECUTION                        │
│                                                     │
│  User Code → Validation → Queue → Execute → Results   │
│      │            │         │        │         │      │
│      │            │         │        │         │      │
│  ┌───▼──┐ ┌────▼──┐ ┌────▼──┐ ┌────▼──┐ ┌────▼──┐│
│  │Syntax │ │Security│ │ Queue │ │Judge0 │ │Local  ││
│  │Check │ │ Scan  │ │       │ │ API   │ │Fallback││
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘│
│                     │         │         │         │      │
│                     └─────────┼─────────┼─────────┘      │
│                               │         │                │
┌─────────────────────────────────────▼─────────▼────────▼┐
│                 RESULT PROCESSING                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  Sanitize   │ │   Cache     │ │   Store     ││
│  │  Results    │ │  Results    │ │  Results    ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────┘
```

#### **Language Support**
- **12+ Languages**: Python, JavaScript, Java, C++, C, Go, Rust, Ruby, PHP, TypeScript, C#, Swift, Kotlin
- **Smart Compilation**: Automatic compilation for compiled languages
- **Security Sandboxing**: Isolated execution environments
- **Resource Limits**: Memory and time constraints

## 🔒 SECURITY ARCHITECTURE

### Security Layers
```
┌─────────────────────────────────────────────────────────┐
│                SECURITY ARCHITECTURE                  │
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ Network     │ │ Application │ │   Data      ││
│  │ Security    │ │ Security    │ │ Security    ││
│  │             │ │             │ │             ││
│  │ - SSL/TLS   │ │ - Auth      │ │ - Encryption││
│  │ - Firewall  │ │ - JWT       │ │ - Backup    ││
│  │ - DDoS      │ │ - CSRF      │ │ - Access    ││
│  │ - Rate      │ │ - XSS       │ │   Control   ││
│  │   Limiting  │ │ - Input     │ │ - Audit     ││
│  │             │ │ Validation  │ │   Logging   ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Security Features
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive validation for all inputs
- **SQL Injection**: Protected through MongoDB/ORM
- **XSS Protection**: Content Security Policy and sanitization
- **CSRF Protection**: CSRF tokens and same-site cookies
- **Rate Limiting**: Intelligent rate limiting per endpoint
- **Security Headers**: HSTS, X-Frame-Options, etc.

## 📊 MONITORING ARCHITECTURE

### Monitoring Stack
```
┌─────────────────────────────────────────────────────────┐
│                MONITORING STACK                        │
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  Metrics    │ │   Logs      │ │  Tracing    ││
│  │ Collection  │ │ Collection  │ │ Collection  ││
│  │             │ │             │ │             ││
│  │ - Prometheus│ │ - ELK Stack │ │ - Jaeger    ││
│  │ - Grafana   │ │ - Fluentd   │ │ - Zipkin    ││
│  │ - Custom    │ │ - Logstash  │ │ - OpenTelem ││
│  │   Metrics   │ │ - Kibana    │ │   etry      ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
│                     │         │         │         │
│                     └─────────┼─────────┼─────────┘
│                               │         │
┌─────────────────────────────────────▼─────────▼─────────┐
│                 ALERTING & VISUALIZATION             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  Grafana    │ │ AlertManager│ │   Dashboards││
│  │ Dashboards  │ │             │ │             ││
│  │             │ │ - Slack     │ │ - Business  ││
│  │ - System    │ │ - Email     │ │ - Technical ││
│  │ - Apps      │ │ - PagerDuty │ │ - Custom    ││
│  │ - Custom    │ │ - Webhooks  │ │             ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Key Metrics
- **Application Metrics**: Response time, error rate, throughput
- **Infrastructure Metrics**: CPU, memory, disk, network
- **Business Metrics**: User engagement, course completion
- **Security Metrics**: Failed logins, suspicious activities

## 🚀 DEPLOYMENT ARCHITECTURE

### Deployment Strategy
```
┌─────────────────────────────────────────────────────────┐
│                DEPLOYMENT PIPELINE                    │
│                                                     │
│  Code → Build → Test → Deploy → Monitor → Scale     │
│   │      │       │       │        │        │      │
│   │      │       │       │        │        │      │
│ ┌─▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐│
│ │Git  │ │Docker│ │Tests │ │Compose│ │Monitor│ │Auto ││
│ │Repo│ │ Build│ │ Run  │ │ Deploy│ │ System│ │Scale ││
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘│
└─────────────────────────────────────────────────────────┘
```

### Container Architecture
```
┌─────────────────────────────────────────────────────────┐
│                CONTAINER ORCHESTRATION               │
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  Frontend   │ │   Backend   │ │  Database   ││
│  │  Container  │ │  Container  │ │  Container  ││
│  │             │ │             │ │             ││
│  │ - Nginx     │ │ - FastAPI   │ │ - MongoDB   ││
│  │ - React     │ │ - Python    │ │ - Data      ││
│  │ - SSL       │ │ - Services  │ │ - Persistence││
│  └─────────────┘ └─────────────┘ └─────────────┘│
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │    Redis    │ │ Prometheus  │ │   Grafana   ││
│  │  Container  │ │  Container  │ │  Container  ││
│  │             │ │             │ │             ││
│  │ - Cache     │ │ - Metrics   │ │ - Dashboards││
│  │ - Sessions  │ │ - Alerting  │ │ - Analytics ││
│  │ - Queue     │ │ - Storage   │ │ - Reports   ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────┘
```

## 🔄 DATA FLOW ARCHITECTURE

### Request Flow
```
┌─────────────────────────────────────────────────────────┐
│                 REQUEST FLOW                           │
│                                                     │
│  User → Load Balancer → Nginx → Backend → DB/Cache   │
│   │         │            │       │        │         │
│   │         │            │       │        │         │
│ ┌─▼──┐ ┌───▼──┐ ┌────▼──┐ ┌───▼──┐ ┌────▼──┐│
│ │User│ │Load  │ │ Nginx │ │ API  │ │ Data  ││
│ │Req │ │Balancer│ │ Proxy │ │Route │ │ Store ││
│ └────┘ └──────┘ └──────┘ └──────┘ └──────┘│
│                     │         │        │         │
│                     └─────────┼────────┼─────────┘
│                               │        │
┌─────────────────────────────────────▼────────▼─────────┐
│                 RESPONSE FLOW                          │
│  DB/Cache → Backend → Nginx → Load Balancer → User │
└─────────────────────────────────────────────────────────┘
```

### Event Flow
```
┌─────────────────────────────────────────────────────────┐
│                 EVENT FLOW                             │
│                                                     │
│  User Action → Event → Queue → Processor → Store     │
│      │          │       │        │         │        │
│      │          │       │        │         │        │
│ ┌────▼──┐ ┌───▼──┐ ┌───▼──┐ ┌───▼──┐ ┌────▼──┐│
│ │User   │ │Event │ │Queue │ │Worker│ │Data   ││
│ │Action │ │Emit  │ │      │ │      │ │Store  ││
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘│
│                                          │         │
│                                          └─────────┘
┌─────────────────────────────────────────────────▼─────────┐
│                 NOTIFICATION FLOW                      │
│  Store → Notification → Email/Push → User           │
└─────────────────────────────────────────────────────────┘
```

## 🎯 PERFORMANCE ARCHITECTURE

### Performance Optimization
```
┌─────────────────────────────────────────────────────────┐
│              PERFORMANCE OPTIMIZATION                 │
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Caching   │ │ Connection  │ │ Compression ││
│  │ Strategy    │ │  Pooling    │ │   & CDN     ││
│  │             │ │             │ │             ││
│  │ - L1/L2/L3 │ │ - Database  │ │ - Gzip      ││
│  │ - Smart     │ │ - HTTP      │ │ - Brotli    ││
│  │   Promotion │ │ - Keep-Alive │ │ - CDN       ││
│  │ - TTL       │ │ - Reuse     │ │ - Static    ││
│  │ - Invalidation│ │ - Limits    │ │   Assets    ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Async     │ │   Database  │ │   Code      ││
│  │ Processing │ │ Optimization│ │ Execution   ││
│  │             │ │             │ │             ││
│  │ - Asyncio   │ │ - Indexing   │ │ - Sandboxing││
│  │ - Concurrency│ │ - Queries    │ │ - Caching   ││
│  │ - Queues    │ │ - Sharding   │ │ - Fallback  ││
│  │ - Workers   │ │ - Replication│ │ - Monitoring││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────┘
```

## 🔧 DEVELOPMENT ARCHITECTURE

### Development Workflow
```
┌─────────────────────────────────────────────────────────┐
│              DEVELOPMENT WORKFLOW                     │
│                                                     │
│  Develop → Test → Build → Deploy → Monitor          │
│     │        │       │        │        │            │
│     │        │       │        │        │            │
│ ┌───▼──┐ ┌───▼──┐ ┌───▼──┐ ┌───▼──┐ ┌───▼──┐│
│ │Local  │ │ Unit │ │Docker│ │Staging│ │Prod   ││
│ │Dev    │ │Tests │ │ Build│ │ Deploy│ │ Deploy││
│ │       │ │      │ │      │ │      │ │      ││
│ │ - Hot │ │ - Jest│ │ - CI  │ │ - QA  │ │ - CD  ││
│ │   Reload│ │ - Pytest│ │ - Auto│ │ - Test│ │ - Auto││
│ │ - Debug│ │ - E2E │ │ - Test│ │ - Review│ │ - Roll││
│ │ - Lint │ │ - Perf│ │ - Scan│ │ - Perf│ │   Back││
│ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘│
└─────────────────────────────────────────────────────────┘
```

## 📈 SCALABILITY ARCHITECTURE

### Scaling Strategy
```
┌─────────────────────────────────────────────────────────┐
│                SCALABILITY STRATEGY                   │
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ Horizontal  │ │ Vertical    │ │ Auto        ││
│  │ Scaling     │ │ Scaling     │ │ Scaling     ││
│  │             │ │             │ │             ││
│  │ - Load      │ │ - CPU/Memory│ │ - Metrics   ││
│  │   Balancer  │ │ - Storage   │ │ - Thresholds││
│  │ - Multiple  │ │ - Network   │ │ - Rules     ││
│  │   Instances│ │ - I/O       │ │ - Actions   ││
│  │ - Database  │ │ - Upgrades   │ │ - Monitoring││
│  │   Cluster  │ │             │ │             ││
│  │ - Cache     │ │             │ │             ││
│  │   Cluster  │ │             │ │             ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────┘
```

## 🎯 CONCLUSION

The PyMastery architecture represents a **modern, scalable, and maintainable** system designed for:

- **High Performance**: Sub-200ms response times
- **High Availability**: 99.9% uptime
- **Security**: Enterprise-grade protection
- **Scalability**: Horizontal scaling capability
- **Maintainability**: Clean, well-documented code
- **Extensibility**: Plugin-ready architecture

### Key Architectural Benefits
1. **Microservices-Ready**: Can be easily split into microservices
2. **Cloud-Native**: Designed for container orchestration
3. **Performance-Optimized**: Multi-level caching and optimization
4. **Security-First**: Comprehensive security measures
5. **Monitoring-Rich**: Complete observability stack
6. **Developer-Friendly**: Excellent documentation and tooling

This architecture ensures PyMastery can handle millions of users while maintaining exceptional performance, security, and reliability.

---

**Document Version**: 1.0.0  
**Last Updated**: March 22, 2026  
**Architecture Status**: ✅ **PRODUCTION READY**
