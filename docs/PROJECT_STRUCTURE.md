# 📁 PyMastery Project Structure

## 🎯 **Organization Overview**

PyMastery follows a clean, enterprise-standard project structure designed for scalability, maintainability, and developer productivity.

## 📂 **Complete Structure**

```
PyMastery/
├── 📁 backend/                    # Backend FastAPI application
│   ├── 📁 src/                   # Source code
│   ├── 📁 tests/                  # Test files
│   ├── 📁 migrations/             # Database migrations
│   ├── 📁 docs/                   # Backend-specific docs
│   ├── 📁 scripts/                # Backend utility scripts
│   ├── 📄 requirements.txt         # Python dependencies
│   ├── 📄 Dockerfile.prod         # Production Dockerfile
│   └── 📄 main.py                # Application entry point
│
├── 📁 frontend/                   # Frontend React application
│   ├── 📁 src/                   # Source code
│   │   ├── 📁 components/          # React components
│   │   ├── 📁 pages/               # Page components
│   │   ├── 📁 hooks/               # Custom React hooks
│   │   ├── 📁 services/            # API services
│   │   ├── 📁 utils/               # Utility functions
│   │   ├── 📁 contexts/            # React contexts
│   │   └── 📁 types/               # TypeScript types
│   ├── 📁 public/                 # Static assets
│   ├── 📁 tests/                  # Test files
│   ├── 📁 docs/                   # Frontend-specific docs
│   ├── 📁 scripts/                # Frontend utility scripts
│   ├── 📄 package.json            # Node.js dependencies
│   ├── 📄 tsconfig.json           # TypeScript configuration
│   ├── 📄 vite.config.ts          # Vite configuration
│   ├── 📄 tailwind.config.js      # Tailwind CSS config
│   └── 📄 Dockerfile.prod         # Production Dockerfile
│
├── 📁 docs/                      # Main documentation
│   ├── 📄 README.md               # Complete project guide
│   ├── 📄 DEPLOYMENT.md          # Deployment instructions
│   ├── 📄 API.md                 # API documentation
│   ├── 📄 PROJECT_STRUCTURE.md    # This file
│   └── 📁 guides/                # Detailed guides
│
├── 📁 config/                    # Configuration files
│   ├── 📁 docker/                # Docker configurations
│   │   ├── 📄 docker-compose.yml          # Development compose
│   │   ├── 📄 docker-compose.prod.yml     # Production compose
│   │   └── 📄 docker-compose.test.yml     # Test compose
│   ├── 📁 environments/          # Environment variables
│   │   ├── 📄 .env.example              # Environment template
│   │   ├── 📄 .env.development         # Development variables
│   │   └── 📄 .env.production          # Production variables
│   └── 📁 nginx/                 # Nginx configuration
│       └── 📄 nginx.conf               # Nginx config
│
├── 📁 scripts/                   # Project-wide scripts
│   ├── 📄 deploy.sh              # Deployment script
│   ├── 📄 setup.sh               # Setup script
│   ├── 📄 cleanup.sh             # Cleanup script
│   ├── 📄 DEPLOY_PRODUCTION.bat  # Windows deployment
│   └── 📄 COMPLETE_PROJECT.bat   # Project completion
│
├── 📁 archive/                   # Archived files
│   ├── 📁 old_docs/              # Old documentation
│   ├── 📁 deprecated/            # Deprecated files
│   └── 📁 backups/               # Backup files
│
├── 📄 README.md                  # Main project README
├── 📄 .gitignore                 # Git ignore file
├── 📄 LICENSE                    # Project license
└── 📄 docker-compose.yml         # Main Docker compose
```

## 🎯 **Organization Principles**

### **1. Separation of Concerns**
- **Backend**: FastAPI application with business logic
- **Frontend**: React application with UI components
- **Configuration**: Environment and deployment configs
- **Documentation**: Comprehensive guides and references
- **Scripts**: Utility and automation scripts

### **2. Scalability**
- **Modular Structure**: Easy to add new features
- **Clear Boundaries**: Well-defined component responsibilities
- **Standardized Patterns**: Consistent across the project
- **Extensible**: Easy to extend and modify

### **3. Maintainability**
- **Logical Grouping**: Related files together
- **Clear Naming**: Descriptive file and folder names
- **Documentation**: Comprehensive and up-to-date
- **Standards**: Industry best practices

### **4. Developer Experience**
- **Quick Navigation**: Easy to find files
- **Clear Structure**: Intuitive organization
- **Good Tooling**: Modern development tools
- **Helpful Scripts**: Automation for common tasks

## 📂 **Key Directories Explained**

### **📁 backend/**
Contains the FastAPI backend application:
- **src/**: Main application code
- **tests/**: Backend test suite
- **migrations/**: Database migration files
- **docs/**: Backend-specific documentation
- **scripts/**: Backend utility scripts

### **📁 frontend/**
Contains the React frontend application:
- **src/**: Main application code
  - **components/**: Reusable UI components
  - **pages/**: Page-level components
  - **hooks/**: Custom React hooks
  - **services/**: API integration services
  - **utils/**: Utility functions
  - **contexts/**: React context providers
  - **types/**: TypeScript type definitions
- **public/**: Static assets and public files
- **tests/**: Frontend test suite
- **docs/**: Frontend-specific documentation

### **📁 docs/**
Main project documentation:
- **README.md**: Comprehensive project guide
- **DEPLOYMENT.md**: Deployment instructions
- **API.md**: Complete API documentation
- **guides/**: Detailed topic-specific guides

### **📁 config/**
Configuration files for different environments:
- **docker/**: Docker compose files
- **environments/**: Environment variables
- **nginx/**: Web server configuration

### **📁 scripts/**
Project-wide utility scripts:
- **deploy.sh**: Automated deployment
- **setup.sh**: Project setup
- **cleanup.sh**: Maintenance tasks
- **.bat files**: Windows equivalents

### **📁 archive/**
Historical and deprecated files:
- **old_docs/**: Previous documentation versions
- **deprecated/**: Old implementation files
- **backups/**: Configuration and data backups

## 🔄 **File Naming Conventions**

### **General Files**
- **kebab-case** for configuration files
- **PascalCase** for classes and components
- **camelCase** for functions and variables
- **UPPER_CASE** for constants and environment variables

### **Directory Names**
- **lowercase** with hyphens
- **Descriptive** of content
- **Plural** for collections
- **Singular** for single items

### **Code Files**
- **Python**: `snake_case.py`
- **TypeScript/JavaScript**: `PascalCase.tsx` or `camelCase.ts`
- **CSS**: `kebab-case.css`
- **Configuration**: `kebab-case.config.js`

## 🛠️ **Development Workflow**

### **1. Project Setup**
```bash
# Clone repository
git clone <repository-url>
cd PyMastery

# Setup environment
cp config/environments/.env.example config/environments/.env
# Edit .env with your configuration

# Install dependencies
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
```

### **2. Development**
```bash
# Start backend
cd backend && python main.py

# Start frontend (new terminal)
cd frontend && npm run dev

# Or use Docker
docker-compose -f config/docker/docker-compose.development.yml up
```

### **3. Testing**
```bash
# Backend tests
cd backend && pytest tests/ -v

# Frontend tests
cd frontend && npm test

# Integration tests
docker-compose -f config/docker/docker-compose.test.yml up --abort-on-container-exit
```

### **4. Deployment**
```bash
# Production deployment
docker-compose -f config/docker/docker-compose.production.yml up -d

# Or use deployment script
./scripts/deploy.sh production
```

## 📊 **Benefits of This Structure**

### **🎯 Clarity**
- **Easy Navigation**: Intuitive file organization
- **Clear Purpose**: Each directory has a specific role
- **Logical Grouping**: Related files are together
- **Standard Layout**: Familiar to developers

### **🚀 Scalability**
- **Modular Design**: Easy to add new features
- **Clear Boundaries**: Well-defined responsibilities
- **Extensible**: Simple to extend and modify
- **Future-Proof**: Supports growth and changes

### **🛠️ Maintainability**
- **Consistent Patterns**: Standard across the project
- **Good Documentation**: Comprehensive guides
- **Clean Code**: Organized and readable
- **Version Control**: Git-friendly structure

### **👥 Collaboration**
- **Team Friendly**: Easy for multiple developers
- **Clear Responsibilities**: Who works on what
- **Standard Practices**: Industry conventions
- **Good Tooling**: Modern development tools

## 🎯 **Best Practices**

### **File Organization**
- Keep related files together
- Use descriptive names
- Follow naming conventions
- Maintain logical structure

### **Code Organization**
- Separate concerns properly
- Use consistent patterns
- Write modular code
- Document interfaces

### **Documentation**
- Keep docs up to date
- Use clear examples
- Provide comprehensive guides
- Include troubleshooting

### **Version Control**
- Use meaningful commits
- Follow Git conventions
- Create proper branches
- Review before merging

---

## 📞 **Support**

For questions about project structure:
1. Review [Main Documentation](./README.md)
2. Check [Deployment Guide](./DEPLOYMENT.md)
3. Reference [API Documentation](./API.md)
4. Contact development team

---

**📁 PyMastery - Well-Structured, Clean, and Organized Project!**
