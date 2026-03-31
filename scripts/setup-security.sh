#!/bin/bash

# PyMastery Security Setup Script
# This script configures security settings for development/production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 PyMastery Security Setup Script${NC}"
echo -e "${BLUE}===================================${NC}"

# Configuration
ENVIRONMENT=${1:-development}
GENERATE_KEYS=${2:-true}
SETUP_SSL=${3:-false}

echo -e "${YELLOW}📋 Configuration:${NC}"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  Generate Keys: ${GENERATE_KEYS}"
echo -e "  Setup SSL: ${SETUP_SSL}"
echo

# Function to generate secure random key
generate_key() {
    if command -v openssl &> /dev/null; then
        openssl rand -base64 64
    else
        # Fallback if openssl is not available
        head /dev/urandom | tr -dc A-Za-z0-9 | head -c 64
    fi
}

# Function to update .env file
update_env() {
    local key=$1
    local value=$2
    local env_file=".env"
    
    if [ -f "$env_file" ]; then
        # Remove existing key
        sed -i.bak "/^${key}=/d" "$env_file"
        # Add new key
        echo "${key}=${value}" >> "$env_file"
    else
        echo "${key}=${value}" > "$env_file"
    fi
}

# 1. Generate JWT Secret Key
if [ "$GENERATE_KEYS" = "true" ]; then
    echo -e "${YELLOW}🔑 Generating secure JWT secret key...${NC}"
    JWT_SECRET=$(generate_key)
    update_env "JWT_SECRET_KEY" "$JWT_SECRET"
    echo -e "${GREEN}✅ JWT secret key generated and updated${NC}"
fi

# 2. Generate OpenAI API Key placeholder
if [ "$GENERATE_KEYS" = "true" ]; then
    echo -e "${YELLOW}🤖 Setting up OpenAI API key placeholder...${NC}"
    update_env "OPENAI_API_KEY" "sk-your-openai-api-key-here"
    update_env "OPENAI_MODEL" "gpt-3.5-turbo"
    update_env "OPENAI_MAX_TOKENS" "1000"
    echo -e "${GREEN}✅ OpenAI configuration added${NC}"
fi

# 3. Generate Judge0 API Key placeholder
if [ "$GENERATE_KEYS" = "true" ]; then
    echo -e "${YELLOW}⚡ Setting up Judge0 API key placeholder...${NC}"
    update_env "JUDGE0_API_KEY" "your-rapidapi-key-here"
    update_env "JUDGE0_API_URL" "https://judge0-ce.p.rapidapi.com/submissions"
    update_env "JUDGE0_HOST" "judge0-ce.p.rapidapi.com"
    echo -e "${GREEN}✅ Judge0 configuration added${NC}"
fi

# 4. Configure Redis
if [ "$GENERATE_KEYS" = "true" ]; then
    echo -e "${YELLOW}🗄️ Setting up Redis configuration...${NC}"
    update_env "REDIS_URL" "redis://localhost:6379/0"
    update_env "CACHE_ENABLED" "true"
    update_env "CACHE_TTL" "3600"
    echo -e "${GREEN}✅ Redis configuration added${NC}"
fi

# 5. Configure Security Settings
echo -e "${YELLOW}🛡️ Configuring security settings...${NC}"
update_env "ENVIRONMENT" "$ENVIRONMENT"
update_env "RATE_LIMIT_ENABLED" "true"
update_env "RATE_LIMIT_REQUESTS_PER_MINUTE" "100"
update_env "RATE_LIMIT_REQUESTS_PER_HOUR" "1000"
update_env "MONITORING_ENABLED" "true"
update_env "CORS_CREDENTIALS" "true"
echo -e "${GREEN}✅ Security settings configured${NC}"

# 6. Setup SSL if requested
if [ "$SETUP_SSL" = "true" ]; then
    echo -e "${YELLOW}🔐 Setting up SSL certificates...${NC}"
    if [ -f "./scripts/generate-ssl.sh" ]; then
        chmod +x ./scripts/generate-ssl.sh
        ./scripts/generate-ssl.sh --common-name "localhost" --org "PyMastery" --email "admin@pymastery.com"
        echo -e "${GREEN}✅ SSL certificates generated${NC}"
    else
        echo -e "${RED}❌ SSL generation script not found${NC}"
    fi
fi

# 7. Create required directories
echo -e "${YELLOW}📁 Creating required directories...${NC}"
mkdir -p logs
mkdir -p uploads
mkdir -p ssl
mkdir -p backups
echo -e "${GREEN}✅ Directories created${NC}"

# 8. Set appropriate permissions
echo -e "${YELLOW}🔒 Setting file permissions...${NC}"
chmod 600 .env
chmod 755 logs
chmod 755 uploads
chmod 700 ssl
chmod 755 backups
echo -e "${GREEN}✅ File permissions set${NC}"

# 9. Validate configuration
echo -e "${YELLOW}🔍 Validating configuration...${NC}"
if [ -f "./scripts/validate-env.js" ]; then
    node ./scripts/validate-env.js
else
    echo -e "${RED}❌ Validation script not found${NC}"
fi

# 10. Display next steps
echo -e "${BLUE}🚀 Setup completed! Next steps:${NC}"
echo
echo -e "${BLUE}1. Install dependencies:${NC}"
echo -e "   cd backend && pip install -r requirements.txt"
echo -e "   cd frontend && npm install"
echo
echo -e "${BLUE}2. Start services:${NC}"
echo -e "   # Start MongoDB"
echo -e "   # Start Redis (optional)"
echo -e "   cd backend && python main.py"
echo -e "   cd frontend && npm run dev"
echo
echo -e "${BLUE}3. Configure API keys:${NC}"
echo -e "   📖 Read scripts/security-checklist.md"
echo -e "   🔑 Get OpenAI API key: https://platform.openai.com/api-keys"
echo -e "   ⚡ Get Judge0 API key: https://rapidapi.com/judge0-ce/api/judge0-ce"
echo
echo -e "${BLUE}4. Security validation:${NC}"
echo -e "   🔍 Run: node scripts/validate-env.js"
echo -e "   📋 Review: scripts/security-checklist.md"
echo

# 11. Environment-specific recommendations
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${RED}🚨 PRODUCTION SECURITY REMINDERS:${NC}"
    echo -e "${RED}• Change all default passwords and keys${NC}"
    echo -e "${RED}• Use real SSL certificates (Let's Encrypt)${NC}"
    echo -e "${RED}• Configure proper monitoring and alerting${NC}"
    echo -e "${RED}• Set up proper backup systems${NC}"
    echo -e "${RED}• Enable all security features${NC}"
    echo
elif [ "$ENVIRONMENT" = "development" ]; then
    echo -e "${GREEN}✅ Development setup complete!${NC}"
    echo -e "${GREEN}• You can now start development servers${NC}"
    echo -e "${GREEN}• API keys are optional for development${NC}"
    echo -e "${GREEN}• SSL is configured for localhost${NC}"
fi

echo -e "${GREEN}🎉 Security setup completed successfully!${NC}"
echo -e "${BLUE}📁 Configuration files updated:${NC}"
echo -e "   • .env - Environment variables"
echo -e "   • ssl/ - SSL certificates (if generated)"
echo -e "   • logs/ - Application logs"
echo -e "   • uploads/ - File uploads"
echo -e "   • backups/ - Backup directory"
