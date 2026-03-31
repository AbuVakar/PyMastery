#!/bin/bash

# SSL Certificate Generator for PyMastery
# This script generates self-signed SSL certificates for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 PyMastery SSL Certificate Generator${NC}"
echo -e "${BLUE}======================================${NC}"

# Configuration
SSL_DIR="./ssl"
CERT_FILE="$SSL_DIR/pymastery.crt"
KEY_FILE="$SSL_DIR/pymastery.key"
CSR_FILE="$SSL_DIR/pymastery.csr"
CONFIG_FILE="$SSL_DIR/openssl.cnf"

# Default values
COUNTRY="US"
STATE="California"
CITY="San Francisco"
ORGANIZATION="PyMastery"
ORGANIZATIONAL_UNIT="Development"
COMMON_NAME="localhost"
EMAIL="admin@pymastery.com"
DAYS=365

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --country)
      COUNTRY="$2"
      shift 2
      ;;
    --state)
      STATE="$2"
      shift 2
      ;;
    --city)
      CITY="$2"
      shift 2
      ;;
    --org)
      ORGANIZATION="$2"
      shift 2
      ;;
    --common-name)
      COMMON_NAME="$2"
      shift 2
      ;;
    --email)
      EMAIL="$2"
      shift 2
      ;;
    --days)
      DAYS="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --country COUNTRY       Country name (default: US)"
      echo "  --state STATE          State or province (default: California)"
      echo "  --city CITY            City (default: San Francisco)"
      echo "  --org ORGANIZATION    Organization name (default: PyMastery)"
      echo "  --common-name NAME     Common name (default: localhost)"
      echo "  --email EMAIL         Email address (default: admin@pymastery.com)"
      echo "  --days DAYS           Validity days (default: 365)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Create SSL directory
echo -e "${YELLOW}📁 Creating SSL directory...${NC}"
mkdir -p "$SSL_DIR"

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ OpenSSL is not installed or not in PATH${NC}"
    echo -e "${RED}Please install OpenSSL: apt-get install openssl (Ubuntu/Debian)${NC}"
    exit 1
fi

# Create OpenSSL configuration
echo -e "${YELLOW}⚙️  Creating OpenSSL configuration...${NC}"
cat > "$CONFIG_FILE" << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
[req_distinguished_name]
C = $COUNTRY
ST = $STATE
L = $CITY
O = $ORGANIZATION
OU = $ORGANIZATIONAL_UNIT
CN = $COMMON_NAME
emailAddress = $EMAIL
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = $COMMON_NAME
DNS.2 = localhost
DNS.3 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate private key
echo -e "${YELLOW}🔑 Generating private key...${NC}"
openssl genrsa -out "$KEY_FILE" 2048

# Generate certificate signing request
echo -e "${YELLOW}📋 Generating certificate signing request...${NC}"
openssl req -new -key "$KEY_FILE" -out "$CSR_FILE" -config "$CONFIG_FILE" -batch

# Generate self-signed certificate
echo -e "${YELLOW}📜 Generating self-signed certificate...${NC}"
openssl x509 -req -days "$DAYS" -in "$CSR_FILE" -signkey "$KEY_FILE" -out "$CERT_FILE" -extensions v3_req -extfile "$CONFIG_FILE"

# Set appropriate permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

# Clean up CSR file
rm -f "$CSR_FILE"

# Display certificate information
echo -e "${GREEN}✅ SSL certificate generated successfully!${NC}"
echo -e "${BLUE}Certificate Information:${NC}"
echo -e "  📁 Files: $CERT_FILE, $KEY_FILE"
echo -e "  📅 Valid for: $DAYS days"
echo -e "  🌐 Common Name: $COMMON_NAME"
echo -e "  🏢 Organization: $ORGANIZATION"
echo -e "  📧 Email: $EMAIL"

# Display certificate details
echo -e "${BLUE}Certificate Details:${NC}"
openssl x509 -in "$CERT_FILE" -text -noout | grep -A 2 "Subject:"

# Update .env file with SSL paths
echo -e "${YELLOW}📝 Updating .env file with SSL paths...${NC}"
if [ -f ".env" ]; then
    # Backup original .env
    cp .env .env.backup
    
    # Update SSL configuration
    sed -i.bak '/SSL_ENABLED/d' .env
    sed -i.bak '/SSL_CERT_PATH/d' .env
    sed -i.bak '/SSL_KEY_PATH/d' .env
    
    echo "" >> .env
    echo "# SSL Configuration" >> .env
    echo "SSL_ENABLED=true" >> .env
    echo "SSL_CERT_PATH=$CERT_FILE" >> .env
    echo "SSL_KEY_PATH=$KEY_FILE" >> .env
    
    echo -e "${GREEN}✅ .env file updated with SSL configuration${NC}"
else
    echo -e "${YELLOW}⚠️  .env file not found. Manual configuration required:${NC}"
    echo -e "${YELLOW}SSL_ENABLED=true${NC}"
    echo -e "${YELLOW}SSL_CERT_PATH=$CERT_FILE${NC}"
    echo -e "${YELLOW}SSL_KEY_PATH=$KEY_FILE${NC}"
fi

# Security warnings
echo -e "${YELLOW}⚠️  SECURITY WARNINGS:${NC}"
echo -e "${YELLOW}• This is a self-signed certificate for development only${NC}"
echo -e "${YELLOW}• Browsers will show security warnings${NC}"
echo -e "${YELLOW}• For production, use certificates from a trusted CA${NC}"

# Test certificate
echo -e "${BLUE}🧪 Testing certificate...${NC}"
if openssl x509 -in "$CERT_FILE" -noout -checkend 2>/dev/null; then
    echo -e "${GREEN}✅ Certificate is valid${NC}"
else
    echo -e "${RED}❌ Certificate validation failed${NC}"
fi

# Display next steps
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo -e "${BLUE}1. Update your application to use the SSL certificate${NC}"
echo -e "${BLUE}2. Configure your web server (Nginx/Apache) to use HTTPS${NC}"
echo -e "${BLUE}3. Test your application with https://$COMMON_NAME${NC}"
echo -e "${BLUE}4. For production, obtain certificates from Let's Encrypt or a trusted CA${NC}"

echo -e "${GREEN}🎉 SSL certificate generation completed!${NC}"
