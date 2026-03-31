# PyMastery SSL Certificate Setup Guide

## Overview
This guide explains how to set up SSL certificates for PyMastery in production.

## SSL Certificate Options

### Option 1: Let's Encrypt (Free, Recommended)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

### Option 2: Self-Signed Certificate (Development)
```bash
# Generate private key
openssl genrsa -out key.pem 2048

# Generate certificate
openssl req -new -x509 -key key.pem -out cert.pem -days 365

# Copy to SSL directory
cp key.pem ssl/
cp cert.pem ssl/
```

### Option 3: Commercial Certificate
1. Purchase SSL certificate from provider (Comodo, DigiCert, etc.)
2. Generate CSR (Certificate Signing Request)
3. Submit CSR to provider
4. Download certificate files
5. Copy to ssl/ directory

## Certificate Files Location
```
ssl/
├── cert.pem          # SSL certificate
├── key.pem           # Private key
├── chain.pem         # Certificate chain (if provided)
└── fullchain.pem     # Full certificate chain (if provided)
```

## Nginx Configuration
Update `config/nginx/nginx.conf` with SSL paths:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
}
```

## Environment Variables
Update `.env` file:
```env
SSL_ENABLED=true
SSL_CERT_PATH=./ssl/cert.pem
SSL_KEY_PATH=./ssl/key.pem
```

## Certificate Renewal (Let's Encrypt)
```bash
# Test renewal
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew

# Setup auto-renewal (crontab)
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## Security Best Practices
- Use TLS 1.2 and 1.3 only
- Implement strong cipher suites
- Enable HSTS (HTTP Strict Transport Security)
- Use OCSP stapling
- Regular certificate renewal
- Monitor certificate expiration

## Troubleshooting
- Check certificate validity: `openssl x509 -in cert.pem -text -noout`
- Test SSL configuration: `nginx -t`
- Check certificate chain: `openssl s_client -connect yourdomain.com:443`
- Monitor SSL logs: `tail -f /var/log/nginx/error.log`
