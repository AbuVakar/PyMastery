# Advanced Security & Compliance Guide

## Overview

PyMastery now includes enterprise-grade advanced security and compliance features to meet the highest standards of data protection, regulatory compliance, and security monitoring. This guide covers all implemented features, their usage, and integration points.

## Table of Contents

1. [Single Sign-On (SSO)](#single-sign-on-sso)
2. [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
3. [Comprehensive Audit Logging](#comprehensive-audit-logging)
4. [Compliance Management](#compliance-management)
5. [End-to-End Encryption](#end-to-end-encryption)
6. [Integration Guide](#integration-guide)
7. [API Reference](#api-reference)
8. [Security Best Practices](#security-best-practices)
9. [Compliance Standards](#compliance-standards)
10. [Troubleshooting](#troubleshooting)

## Single Sign-On (SSO)

### Overview

The SSO service provides enterprise-grade single sign-on integration with multiple identity providers, enabling seamless authentication across the platform while maintaining security and compliance standards.

### Supported Identity Providers

#### Major Providers
- **Google Workspace**: OAuth2 integration with Google accounts
- **Microsoft Azure AD**: Enterprise Azure Active Directory integration
- **Okta**: Enterprise identity and access management
- **Auth0**: Developer-friendly identity platform

#### Additional Providers
- **SAML 2.0**: Generic SAML identity provider support
- **LDAP**: Active Directory and LDAP integration
- **Keycloak**: Open-source identity and access management
- **Custom OIDC**: Custom OpenID Connect providers

### Key Features

#### Multi-Provider Support
- **Concurrent Providers**: Support for multiple SSO providers simultaneously
- **Provider Selection**: Users can choose their preferred identity provider
- **Fallback Options**: Automatic fallback if primary provider is unavailable
- **Provider Switching**: Users can switch between connected providers

#### Security Features
- **JWT Token Management**: Secure token generation and validation
- **Token Refresh**: Automatic token refresh with proper expiration
- **Session Management**: Secure session tracking and cleanup
- **Security Headers**: Comprehensive security header implementation

#### User Management
- **Account Linking**: Link SSO accounts to existing PyMastery accounts
- **Profile Synchronization**: Automatic profile information sync
- **Role Mapping**: Map SSO groups to PyMastery roles
- **User Provisioning**: Automatic user account creation and updates

### Implementation

#### Provider Configuration
```python
# Google Workspace Configuration
google_config = SSOProviderConfig(
    id="google",
    provider=SSOProvider.GOOGLE,
    name="Google Workspace",
    auth_method=AuthenticationMethod.OAUTH2,
    client_id="your-google-client-id",
    client_secret="your-google-client-secret",
    redirect_uri="https://pymastery.com/auth/google/callback",
    scopes=["openid", "email", "profile"],
    is_active=True
)
```

#### Authentication Flow
```python
# 1. Generate authorization URL
auth_url = sso_service.generate_auth_url("google", state="random_state")

# 2. Exchange authorization code for tokens
tokens = await sso_service.exchange_code_for_tokens("google", code, state)

# 3. Get user information
user_info = await sso_service.get_user_info("google", tokens["access_token"])

# 4. Authenticate user
result = await sso_service.authenticate_user("google", code, state)
```

#### Session Management
```python
# Validate session
session = await sso_service.validate_session(session_id)

# Refresh token
new_tokens = await sso_service.refresh_token(session_id)

# Logout user
await sso_service.logout(session_id)
```

### API Endpoints

#### Provider Management
```
GET /api/v1/security/sso/providers              # Get available SSO providers
POST /api/v1/security/sso/{provider}/auth-url   # Generate authorization URL
```

#### Authentication
```
POST /api/v1/security/sso/{provider}/authenticate # Authenticate user
POST /api/v1/security/sso/{session}/refresh      # Refresh session token
POST /api/v1/security/sso/{session}/logout         # Logout user
```

#### Audit & Monitoring
```
GET /api/v1/security/sso/audit-logs               # Get SSO audit logs
```

### Security Considerations

#### Token Security
- **Short-Lived Tokens**: Access tokens expire in 1 hour
- **Secure Storage**: Tokens encrypted at rest
- **Token Rotation**: Automatic token refresh
- **Revocation**: Immediate token revocation on logout

#### Provider Security
- **HTTPS Required**: All communications over HTTPS
- **State Parameter**: CSRF protection with state parameter
- **PKCE Support**: Proof Key for Code Exchange (optional)
- **Certificate Validation**: Proper SSL certificate validation

## Two-Factor Authentication (2FA)

### Overview

The two-factor authentication service provides multiple 2FA methods to enhance security beyond traditional passwords, supporting both time-based and event-based authentication.

### Supported 2FA Methods

#### Time-Based Methods
- **TOTP (Time-based One-Time Password)**: Google Authenticator, Authy, etc.
- **HOTP (HMAC-based One-Time Password)**: Counter-based authentication

#### Event-Based Methods
- **SMS Verification**: SMS-based verification codes
- **Email Verification**: Email-based verification codes
- **Push Notifications**: Mobile app push notifications

#### Backup Methods
- **Backup Codes**: One-time backup recovery codes
- **Hardware Tokens**: YubiKey, hardware security keys
- **Biometric**: Fingerprint, Face ID (future enhancement)

### Key Features

#### Multi-Method Support
- **Method Selection**: Users can choose preferred 2FA method
- **Backup Methods**: Multiple backup authentication methods
- **Method Switching**: Easy switching between 2FA methods
- **Fallback Options**: Automatic fallback if primary method fails

#### Security Features
- **Rate Limiting**: Prevent brute force attacks
- **Attempt Tracking**: Track failed authentication attempts
- **Session Management**: Secure 2FA session management
- **Code Expiration**: Time-limited verification codes

#### User Experience
- **Easy Setup**: Simple setup process for all methods
- **QR Code Support**: QR code generation for TOTP setup
- **Backup Code Generation**: Automatic backup code generation
- **Recovery Options**: Multiple account recovery options

### Implementation

#### TOTP Setup
```python
# Generate TOTP secret and QR code
totp_setup = await two_factor_service.setup_totp(
    user_id="user123",
    user_email="user@example.com"
)

# Verify TOTP setup
verification = await two_factor_service.verify_totp_setup(
    user_id="user123",
    code="123456"
)
```

#### SMS Setup
```python
# Setup SMS 2FA
sms_setup = await two_factor_service.setup_sms(
    user_id="user123",
    phone_number="+1234567890"
)

# Verify SMS code
verification = await two_factor_service.verify_code(
    session_id=sms_setup["session_id"],
    code="123456"
)
```

#### Email Setup
```python
# Setup Email 2FA
email_setup = await two_factor_service.setup_email(
    user_id="user123",
    email_address="user@example.com"
)

# Verify email code
verification = await two_factor_service.verify_code(
    session_id=email_setup["session_id"],
    code="123456"
)
```

#### Authentication Flow
```python
# Initiate 2FA authentication
auth_result = await two_factor_service.authenticate(
    user_id="user123",
    method=TwoFactorMethod.TOTP
)

# Verify TOTP code
totp_result = await two_factor_service.verify_totp_code(
    user_id="user123",
    code="123456"
)
```

### API Endpoints

#### TOTP Management
```
POST /api/v1/security/2fa/setup-totp           # Setup TOTP
POST /api/v1/security/2fa/verify-totp-setup    # Verify TOTP setup
```

#### SMS & Email Management
```
POST /api/v1/security/2fa/setup-sms            # Setup SMS 2FA
POST /api/v1/security/2fa/setup-email          # Setup Email 2FA
```

#### Authentication
```
POST /api/v1/security/2fa/authenticate         # Initiate 2FA
POST /api/v1/security/2fa/verify-code         # Verify 2FA code
POST /api/v1/security/2fa/verify-totp          # Verify TOTP code
```

#### Management
```
POST /api/v1/security/2fa/disable              # Disable 2FA
GET /api/v1/security/2fa/methods/{user_id}    # Get user's 2FA methods
```

#### Audit & Monitoring
```
GET /api/v1/security/2fa/audit-logs             # Get 2FA audit logs
```

### Security Best Practices

#### Code Security
- **Short Lifespan**: Verification codes expire in 10 minutes
- **Single Use**: Codes can only be used once
- **Secure Generation**: Cryptographically secure code generation
- **Rate Limiting**: Prevent brute force attacks

#### Backup Security
- **Encrypted Storage**: Backup codes encrypted at rest
- **Limited Usage**: Each backup code can only be used once
- **Secure Generation**: Secure backup code generation
- **Recovery Limits**: Limited recovery attempts

## Comprehensive Audit Logging

### Overview

The comprehensive audit logging service provides enterprise-grade audit trails for all system activities, ensuring compliance with regulatory requirements and security monitoring needs.

### Audit Event Types

#### Authentication Events
- **User Login/Logout**: User authentication events
- **Login Failures**: Failed login attempts
- **Password Changes**: Password modification events
- **2FA Events**: Two-factor authentication events
- **SSO Events**: Single sign-on authentication events

#### User Management Events
- **User Creation/Deletion**: User account lifecycle events
- **Role Changes**: User role modification events
- **Profile Updates**: User profile modification events
- **Account Suspension**: Account suspension events

#### Data Access Events
- **Data Access**: Data access and retrieval events
- **Data Modification**: Data modification events
- **Data Deletion**: Data deletion events
- **Data Export**: Data export events
- **Sensitive Data Access**: Sensitive data access events

#### System Events
- **System Startup/Shutdown**: System lifecycle events
- **Configuration Changes**: System configuration events
- **Security Events**: Security-related events
- **Compliance Events**: Compliance-related events

### Key Features

#### Comprehensive Logging
- **Event Coverage**: Complete coverage of all system events
- **Structured Logging**: JSON-formatted structured logs
- **Metadata Support**: Rich metadata for context
- **Correlation IDs**: Request and session correlation

#### Compliance Support
- **GDPR Compliance**: GDPR-compliant audit trails
- **SOC2 Compliance**: SOC2-compliant logging
- **ISO27001 Compliance**: ISO27001-compliant audit trails
- **HIPAA Compliance**: HIPAA-compliant logging (if applicable)

#### Security Features
- **Integrity Verification**: Cryptographic integrity verification
- **Tamper Detection**: Tamper detection and alerting
- **Secure Storage**: Encrypted audit log storage
- **Access Control**: Role-based access to audit logs

#### Performance & Scalability
- **High Performance**: Efficient logging with minimal overhead
- **Scalable Storage**: Scalable audit log storage
- **Compression**: Automatic log compression
- **Archival**: Automatic log archival and cleanup

### Implementation

#### Event Logging
```python
# Log authentication event
audit_service.log_event(
    event_type=AuditEventType.USER_LOGIN,
    severity=AuditSeverity.MEDIUM,
    user_id="user123",
    user_email="user@example.com",
    ip_address="192.168.1.1",
    user_agent="Mozilla/5.0...",
    action="user_login",
    result="success",
    data_classification="personal"
)
```

#### Event Search
```python
# Search audit events
events = await audit_service.search_events(
    query={
        "event_type": "user_login",
        "start_date": "2024-03-01",
        "end_date": "2024-03-31",
        "user_id": "user123"
    },
    limit=100
)
```

#### Compliance Reporting
```python
# Generate compliance report
report = await audit_service.generate_compliance_report(
    standard=ComplianceStandard.GDPR,
    report_type="monthly"
)
```

### API Endpoints

#### Event Management
```
POST /api/v1/security/audit/log                # Log audit event
GET /api/v1/security/audit/events              # Search audit events
```

#### Reporting & Analytics
```
GET /api/v1/security/audit/statistics           # Get audit statistics
```

### Compliance Standards

#### GDPR Requirements
- **Lawful Processing**: Record of legal basis for processing
- **Data Subject Rights**: Audit trail for data subject requests
- **Data Breach Reporting**: Security breach logging and reporting
- **Retention Policies**: Compliant data retention policies

#### SOC2 Requirements
- **Security Controls**: Security control implementation logging
- **Access Management**: Access control and management logging
- **System Monitoring**: System security monitoring logs
- **Incident Response**: Security incident response logging

#### ISO27001 Requirements
- **ISMS Logging**: Information security management system logging
- **Risk Assessment**: Risk assessment and treatment logging
- **Business Continuity**: Business continuity planning logs
- **Supplier Management**: Supplier relationship management logs

## Compliance Management

### Overview

The compliance management service provides comprehensive compliance management for multiple regulatory standards, including GDPR, SOC2, ISO27001, and others.

### Supported Standards

#### Data Protection Standards
- **GDPR**: General Data Protection Regulation
- **CCPA**: California Consumer Privacy Act
- **HIPAA**: Health Insurance Portability and Accountability Act

#### Security Standards
- **SOC2**: Service Organization Control 2
- **ISO27001**: ISO 27001 Information Security Management
- **NIST**: NIST Cybersecurity Framework

#### Industry Standards
- **PCI DSS**: Payment Card Industry Data Security Standard
- **Industry-Specific**: Custom industry compliance frameworks

### Key Features

#### Data Subject Rights
- **Right to Access**: Provide access to personal data
- **Right to Rectification**: Correct inaccurate personal data
- **Right to Erasure**: Delete personal data ("right to be forgotten")
- **Right to Portability**: Provide data in portable format
- **Right to Object**: Object to data processing
- **Right to Restrict**: Restrict data processing

#### Data Processing Records
- **Processing Register**: Comprehensive data processing register
- **Legal Basis**: Record of legal basis for processing
- **Data Categories**: Classification of data categories
- **Data Recipients**: Record of data recipients
- **Retention Periods**: Data retention period records

#### Compliance Assessments
- **Automated Assessments**: Automated compliance assessments
- **Manual Assessments**: Manual compliance assessment support
- **Gap Analysis**: Compliance gap analysis
- **Remediation Tracking**: Track compliance remediation efforts

#### Reporting & Analytics
- **Compliance Dashboard**: Comprehensive compliance dashboard
- **Compliance Score**: Overall compliance scoring
- **Trend Analysis**: Compliance trend analysis
- **Violation Tracking**: Compliance violation tracking

### Implementation

#### Data Subject Request
```python
# Create data subject request
request = await compliance_service.create_data_subject_request(
    request_type=DataSubjectRights.RIGHT_TO_ACCESS,
    user_id="user123",
    user_email="user@example.com",
    description="Request for copy of my personal data"
)

# Process request
result = await compliance_service.process_data_subject_request(request["request_id"])
```

#### Processing Record
```python
# Create data processing record
record = await compliance_service.create_processing_record(
    process_name="User Authentication",
    description="Processing of user authentication data",
    data_categories=["email", "password_hash", "ip_address"],
    data_subjects=["users"],
    processing_purpose="User authentication and authorization",
    legal_basis=DataProcessingBasis.CONSENT
)
```

#### Compliance Assessment
```python
# Run compliance assessment
assessment = await compliance_service.run_compliance_assessment(
    standard=ComplianceStandard.GDPR,
    assessment_type="automated"
)
```

### API Endpoints

#### Data Subject Rights
```
POST /api/v1/security/compliance/data-subject-request     # Create data subject request
PUT /api/v1/security/compliance/data-subject-request/{id} # Update request
POST /api/v1/security/compliance/data-subject-request/{id}/process # Process request
GET /api/v1/security/compliance/download/{id}              # Download data package
```

#### Processing Records
```
POST /api/v1/security/compliance/processing-record        # Create processing record
```

#### Compliance Assessment
```
POST /api/v1/security/compliance/assessment              # Run compliance assessment
```

#### Dashboard & Analytics
```
GET /api/v1/security/compliance/dashboard               # Get compliance dashboard
```

### Data Protection Impact Assessment (DPIA)

#### DPIA Process
1. **Identify Processing**: Identify high-risk data processing
2. **Assess Necessity**: Assess necessity and proportionality
3. **Identify Risks**: Identify risks to data subjects
4. **Mitigate Risks**: Implement risk mitigation measures
5. **Document Process**: Document DPIA process and outcomes

#### DPIA Templates
- **Standard DPIA**: Standard DPIA template for common processing
- **High-Risk DPIA**: DPIA for high-risk processing activities
- **International Transfer**: DPIA for international data transfers

## End-to-End Encryption

### Overview

The end-to-end encryption service provides comprehensive encryption capabilities for data at rest and in transit, ensuring the highest level of data protection across the platform.

### Encryption Algorithms

#### Symmetric Encryption
- **AES-256-GCM**: Advanced Encryption Standard with Galois/Counter Mode
- **AES-256-CBC**: Advanced Encryption Standard with Cipher Block Chaining
- **ChaCha20-Poly1305**: Modern stream cipher with authentication

#### Asymmetric Encryption
- **RSA-4096**: RSA encryption with 4096-bit keys
- **RSA-2048**: RSA encryption with 2048-bit keys
- **ECDSA**: Elliptic Curve Digital Signature Algorithm

#### Key Management
- **Key Generation**: Secure key generation using cryptographically secure random numbers
- **Key Rotation**: Automatic key rotation based on policies
- **Key Escrow**: Secure key escrow for recovery purposes
- **Key Destruction**: Secure key destruction

### Key Features

#### Data Classification
- **Classification Levels**: Public, Internal, Confidential, Restricted, Top Secret
- **Policy-Based Encryption**: Automatic encryption based on data classification
- **Key Management**: Different keys for different classification levels
- **Access Control**: Role-based access to encrypted data

#### Encryption Policies
- **Default Policies**: Default encryption policies for each classification
- **Custom Policies**: Custom encryption policies for specific needs
- **Rotation Policies**: Key rotation policies based on security requirements
- **Retention Policies**: Data retention policies for encrypted data

#### Performance & Scalability
- **High Performance**: Optimized encryption for high throughput
- **Scalable Key Management**: Scalable key management system
- **Efficient Storage**: Efficient encrypted data storage
- **Fast Retrieval**: Fast encrypted data retrieval

### Implementation

#### Data Encryption
```python
# Encrypt data
result = await encryption_service.encrypt_data(
    data="Sensitive user data",
    classification=DataClassification.CONFIDENTIAL,
    user_id="user123",
    resource_id="resource456"
)

encrypted_data = result["encrypted_data"]
iv = result["iv"]
tag = result["tag"]
key_id = result["key_id"]
```

#### Data Decryption
```python
# Decrypt data
result = await encryption_service.decrypt_data(
    encrypted_data=encrypted_data,
    key_id=key_id,
    iv=iv,
    tag=tag,
    classification=DataClassification.CONFIDENTIAL
)

decrypted_data = result["decrypted_data"]
```

#### Key Generation
```python
# Generate encryption key
key = await encryption_service.generate_key(
    key_name="Confidential Data Key",
    key_type=KeyType.SYMMETRIC,
    algorithm=EncryptionAlgorithm.AES_256_GCM,
    key_size=256,
    classification=DataClassification.CONFIDENTIAL,
    rotation_period_days=90
)
```

### API Endpoints

#### Data Encryption/Decryption
```
POST /api/v1/security/encryption/encrypt           # Encrypt data
POST /api/v1/security/encryption/decrypt           # Decrypt data
```

#### Key Management
```
POST /api/v1/security/encryption/generate-key       # Generate encryption key
```

### Security Considerations

#### Key Security
- **Master Key Encryption**: Keys encrypted with master key
- **Key Rotation**: Regular key rotation based on policies
- **Key Escrow**: Secure key escrow for recovery
- **Key Destruction**: Secure key destruction

#### Data Security
- **End-to-End Encryption**: Data encrypted end-to-end
- **Integrity Protection**: Data integrity protection with HMAC
- **Access Control**: Role-based access to encrypted data
- **Secure Storage**: Encrypted data stored securely

## Integration Guide

### Backend Integration

#### Service Initialization
```python
# In main.py
from services.sso_service import start_sso_service
from services.two_factor_service import start_two_factor_service
from services.audit_service import start_audit_service
from services.compliance_service import start_compliance_service
from services.encryption_service import start_encryption_service

@app.on_event("startup")
async def startup_event():
    # Start all security services
    await start_sso_service(sso_config)
    await start_two_factor_service(two_factor_config)
    await start_audit_service(audit_config)
    await start_compliance_service(compliance_config)
    await start_encryption_service(encryption_config)
```

#### Router Registration
```python
# In main.py
from routers.security_router import router as security_router

app.include_router(security_router)
```

#### Database Integration
```python
# Security-related collections
security_collections = [
    "sso_sessions",
    "sso_users",
    "two_factor_configs",
    "two_factor_sessions",
    "audit_events",
    "compliance_requests",
    "encryption_keys"
]
```

### Frontend Integration

#### API Service Setup
```typescript
// In frontend/src/services/securityApi.ts
const securityApi = {
  sso: {
    getProviders: () => api.get('/security/sso/providers'),
    generateAuthUrl: (providerId, state) => api.post(`/security/sso/${providerId}/auth-url`, { state }),
    authenticate: (providerId, code, state) => api.post(`/security/sso/${providerId}/authenticate`, { code, state }),
    refreshToken: (sessionId) => api.post(`/security/sso/${sessionId}/refresh`),
    logout: (sessionId) => api.post(`/security/sso/${sessionId}/logout`),
    getAuditLogs: (params) => api.get('/security/sso/audit-logs', { params })
  },
  twoFactor: {
    setupTotp: (data) => api.post('/security/2fa/setup-totp', data),
    verifyTotpSetup: (data) => api.post('/security/2fa/verify-totp-setup', data),
    setupSms: (data) => api.post('/security/2fa/setup-sms', data),
    setupEmail: (data) => api.post('/security/2fa/setup-email', data),
    verifyCode: (data) => api.post('/security/2fa/verify-code', data),
    authenticate: (data) => api.post('/security/2fa/authenticate', data),
    verifyTotp: (data) => api.post('/security/2fa/verify-totp', data),
    disable: (data) => api.post('/security/2fa/disable', data),
    getMethods: (userId) => api.get(`/security/2fa/methods/${userId}`),
    getAuditLogs: (params) => api.get('/security/2fa/audit-logs', { params })
  },
  audit: {
    logEvent: (data) => api.post('/security/audit/log', data),
    searchEvents: (params) => api.get('/security/audit/events', { params }),
    getStatistics: () => api.get('/security/audit/statistics')
  },
  compliance: {
    createDataSubjectRequest: (data) => api.post('/security/compliance/data-subject-request', data),
    updateDataSubjectRequest: (requestId, data) => api.put(`/security/compliance/data-subject-request/${requestId}`, data),
    processDataSubjectRequest: (requestId) => api.post(`/security/compliance/data-subject-request/${requestId}/process`),
    createProcessingRecord: (data) => api.post('/security/compliance/processing-record', data),
    runAssessment: (data) => api.post('/security/compliance/assessment', data),
    getDashboard: () => api.get('/security/compliance/dashboard')
  },
  encryption: {
    encrypt: (data) => api.post('/security/encryption/encrypt', data),
    decrypt: (data) => api.post('/security/encryption/decrypt', data),
    generateKey: (data) => api.post('/security/encryption/generate-key', data)
  }
};
```

#### React Components
```typescript
// SSO Login Component
const SSOLogin: React.FC = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadProviders();
  }, []);
  
  const loadProviders = async () => {
    try {
      const response = await securityApi.sso.getProviders();
      setProviders(response.data.providers);
    } catch (error) {
      console.error('Failed to load SSO providers:', error);
    }
  };
  
  const handleProviderLogin = async (providerId: string) => {
    setLoading(true);
    try {
      const response = await securityApi.sso.generateAuthUrl(providerId, 'random_state');
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('SSO login failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Sign In with SSO</h2>
      {providers.map(provider => (
        <button
          key={provider.id}
          onClick={() => handleProviderLogin(provider.id)}
          disabled={loading}
        >
          Sign in with {provider.name}
        </button>
      ))}
    </div>
  );
};

// 2FA Setup Component
const TwoFactorSetup: React.FC = () => {
  const [method, setMethod] = useState('totp');
  const [setupData, setSetupData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleSetup = async () => {
    setLoading(true);
    try {
      let response;
      if (method === 'totp') {
        response = await securityApi.twoFactor.setupTotp({
          user_id: userId,
          user_email: userEmail
        });
      } else if (method === 'sms') {
        response = await securityApi.twoFactor.setupSms({
          user_id: userId,
          phone_number: phoneNumber
        });
      }
      
      if (response.success) {
        setSetupData(response.data);
      }
    } catch (error) {
      console.error('2FA setup failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Setup Two-Factor Authentication</h2>
      <select value={method} onChange={(e) => setMethod(e.target.value)}>
        <option value="totp">Authenticator App</option>
        <option value="sms">SMS</option>
        <option value="email">Email</option>
      </select>
      
      <button onClick={handleSetup} disabled={loading}>
        Setup {method.toUpperCase()}
      </button>
      
      {setupData && (
        <div>
          {method === 'totp' && (
            <div>
              <p>Scan this QR code with your authenticator app:</p>
              <img src={setupData.qr_code} alt="QR Code" />
              <p>Or enter this code manually: {setupData.secret}</p>
            </div>
          )}
          {method === 'sms' && (
            <div>
              <p>Verification code sent to your phone</p>
              <p>Session ID: {setupData.session_id}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Environment Configuration

#### Environment Variables
```bash
# SSO Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://pymastery.com/auth/google/callback

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=https://pymastery.com/auth/microsoft/callback

OKTA_CLIENT_ID=your-okta-client-id
OKTA_CLIENT_SECRET=your-okta-client-secret
OKTA_DOMAIN=your-okta-domain.okta.com
OKTA_REDIRECT_URI=https://pymastery.com/auth/okta/callback

# 2FA Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890

EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USERNAME=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password

# Audit Configuration
AUDIT_LOG_LEVEL=INFO
AUDIT_MAX_EVENTS_PER_SECOND=1000
AUDIT_RETENTION_DAYS=2555

# Compliance Configuration
COMPLIANCE_DEFAULT_RETENTION_DAYS=2555
COMPLIANCE_KEY_ROTATION_DAYS=90

# Encryption Configuration
ENCRYPTION_DEFAULT_ALGORITHM=aes-256-gcm
ENCRYPTION_DEFAULT_KEY_SIZE=256
ENCRYPTION_KEY_ROTATION_DAYS=90
ENCRYPTION_STORAGE_PATH=/data/encryption
```

## API Reference

### Common Response Format

All API endpoints follow a consistent response format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2024-03-15T10:30:00Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-03-15T10:30:00Z"
}
```

### Authentication

All security endpoints require JWT authentication:
```http
Authorization: Bearer <jwt_token>
```

### Rate Limiting

Endpoints are rate-limited to prevent abuse:
- **SSO endpoints**: 10 requests per minute
- **2FA endpoints**: 20 requests per minute
- **Audit endpoints**: 50 requests per minute
- **Compliance endpoints**: 15 requests per minute
- **Encryption endpoints**: 100 requests per minute

## Security Best Practices

### Authentication Security

#### Password Security
- **Strong Passwords**: Minimum 12 characters with complexity requirements
- **Password Hashing**: Bcrypt with 12 salt rounds
- **Password Expiration**: Regular password expiration policies
- **Password History**: Prevent password reuse

#### Session Security
- **Secure Sessions**: Secure session management
- **Session Timeout**: Automatic session timeout
- **Session Revocation**: Immediate session revocation on logout
- **Multi-Device Sessions**: Support for multiple device sessions

#### Token Security
- **JWT Tokens**: Secure JWT token implementation
- **Token Expiration**: Short-lived access tokens
- **Token Refresh**: Secure token refresh mechanism
- **Token Revocation**: Token revocation on logout

### Data Protection

#### Encryption Best Practices
- **Data Classification**: Classify data by sensitivity
- **Encryption at Rest**: Encrypt all sensitive data at rest
- **Encryption in Transit**: Encrypt all data in transit
- **Key Management**: Secure key management practices

#### Access Control
- **Principle of Least Privilege**: Minimum necessary access
- **Role-Based Access**: Role-based access control
- **Access Reviews**: Regular access reviews
- **Access Logging**: Comprehensive access logging

### Monitoring & Logging

#### Security Monitoring
- **Real-time Monitoring**: Real-time security monitoring
- **Anomaly Detection**: Anomaly detection and alerting
- **Threat Intelligence**: Threat intelligence integration
- **Security Analytics**: Security analytics and reporting

#### Incident Response
- **Incident Detection**: Rapid incident detection
- **Incident Response**: Structured incident response
- **Incident Reporting**: Comprehensive incident reporting
- **Incident Prevention**: Incident prevention measures

## Compliance Standards

### GDPR (General Data Protection Regulation)

#### Key Requirements
- **Lawful Processing**: Process data lawfully, fairly, and transparently
- **Purpose Limitation**: Process data for specified purposes
- **Data Minimization**: Process only necessary data
- **Accuracy**: Maintain accurate and up-to-date data
- **Storage Limitation**: Retain data only as long as necessary
- **Integrity & Confidentiality**: Ensure data security
- **Accountability**: Demonstrate compliance

#### Implementation
- **Data Processing Register**: Comprehensive data processing register
- **Data Subject Rights**: Implement all data subject rights
- **Data Protection Impact Assessment**: Conduct DPIA for high-risk processing
- **Data Breach Notification**: Implement breach notification procedures
- **Privacy by Design**: Implement privacy by design and default

### SOC2 (Service Organization Control 2)

#### Key Requirements
- **Security**: Implement security controls
- **Availability**: Ensure service availability
- **Processing Integrity**: Maintain processing integrity
- **Confidentiality**: Protect confidential information
- **Privacy**: Protect personal information

#### Implementation
- **Control Framework**: Implement comprehensive control framework
- **Security Monitoring**: Continuous security monitoring
- **Incident Response**: Structured incident response
- **Access Management**: Comprehensive access management
- **Vendor Management**: Vendor risk management

### ISO27001 (Information Security Management)

#### Key Requirements
- **ISMS**: Implement information security management system
- **Risk Management**: Implement risk management process
- **Security Controls**: Implement comprehensive security controls
- **Business Continuity**: Implement business continuity planning
- **Continuous Improvement**: Continuously improve security

#### Implementation
- **ISMS Framework**: Implement ISMS framework
- **Risk Assessment**: Conduct regular risk assessments
- **Security Awareness**: Implement security awareness training
- **Audit & Review**: Regular security audits and reviews
- **Compliance Monitoring**: Continuous compliance monitoring

## Troubleshooting

### Common Issues and Solutions

#### SSO Issues
**Problem**: SSO authentication fails
**Solution**: 
- Verify provider configuration
- Check redirect URI configuration
- Verify client credentials
- Check network connectivity

**Problem**: Token refresh fails
**Solution**:
- Check token expiration
- Verify refresh token validity
- Check provider API status
- Verify client credentials

#### 2FA Issues
**Problem**: TOTP verification fails
**Solution**:
- Check time synchronization
- Verify secret key
- Check algorithm configuration
- Verify user input

**Problem**: SMS verification fails
**Solution**:
- Verify phone number format
- Check SMS provider configuration
- Verify Twilio credentials
- Check message delivery

#### Audit Issues
**Problem**: Audit events not logging
**Solution**:
- Check service status
- Verify configuration
- Check storage permissions
- Check rate limiting

#### Compliance Issues
**Problem**: Compliance assessment fails
**Solution**:
- Check assessment configuration
- Verify standard requirements
- Check policy configuration
- Verify data availability

#### Encryption Issues
**Problem**: Data encryption fails
**Solution**:
- Check key availability
- Verify algorithm configuration
- Check data format
- Verify classification

### Debugging Tools

#### Service Status Check
```python
# Check all security services status
GET /api/v1/security/health
```

#### Dashboard Overview
```python
# Get comprehensive security dashboard
GET /api/v1/security/dashboard
```

#### Service-Specific Status
```python
# Check individual service status
GET /api/v1/security/sso/audit-logs
GET /api/v1/security/2fa/audit-logs
GET /api/v1/security/audit/statistics
GET /api/v1/security/compliance/dashboard
```

### Support Resources

#### Documentation
- Complete API reference
- Integration guides
- Best practices documentation
- Troubleshooting guides

#### Monitoring
- Service health monitoring
- Performance metrics tracking
- Error logging and alerting
- Security analytics and reporting

#### Community Support
- Developer forums and discussions
- Knowledge base and FAQs
- Video tutorials and guides
- Direct support contact information

## Conclusion

The advanced security and compliance features provide comprehensive enterprise-grade security and compliance capabilities for PyMastery. The system includes:

- **Single Sign-On**: Multi-provider SSO integration with comprehensive security
- **Two-Factor Authentication**: Multiple 2FA methods with robust security
- **Comprehensive Audit Logging**: Complete audit trails for compliance and security
- **Compliance Management**: Multi-standard compliance management with automation
- **End-to-End Encryption**: Comprehensive encryption for data protection

All features are production-ready with comprehensive APIs, monitoring, and compliance support. The system is designed to meet the highest security and compliance standards while maintaining excellent performance and user experience.

## Next Steps

### Implementation
1. **Configure Services**: Set up environment variables and dependencies
2. **Initialize Services**: Start all security services
3. **Test Integration**: Verify API endpoints and functionality
4. **Frontend Integration**: Implement UI components and user flows
5. **Monitoring Setup**: Configure monitoring and alerting

### Optimization
1. **Performance Testing**: Load testing for security services
2. **Security Auditing**: Regular security audits and penetration testing
3. **Compliance Auditing**: Regular compliance audits and assessments
4. **User Training**: Security awareness training for users

### Scaling
1. **Load Testing**: Test system performance under load
2. **Database Optimization**: Optimize database queries and indexes
3. **Service Scaling**: Scale individual services as needed
4. **Monitoring Enhancement**: Add advanced monitoring and alerting

The advanced security and compliance features are now ready for production deployment and provide enterprise-grade security and compliance capabilities for PyMastery.
