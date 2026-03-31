"""
Certificate Generation and Verification System
"""
import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import uuid
import hashlib
import base64
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.exceptions import InvalidSignature
import qrcode
from PIL import Image

logger = logging.getLogger(__name__)

class CertificateTemplate:
    """Certificate template configuration"""
    
    def __init__(self):
        self.templates = {
            "course_completion": {
                "title": "Course Completion Certificate",
                "description": "This certifies that the student has successfully completed the course",
                "background_color": "#ffffff",
                "text_color": "#1a1a1a",
                "accent_color": "#3b82f6",
                "border_color": "#d1d5db"
            },
            "achievement": {
                "title": "Achievement Certificate",
                "description": "This certifies outstanding achievement in",
                "background_color": "#fef3c7",
                "text_color": "#92400e",
                "accent_color": "#f59e0b",
                "border_color": "#f59e0b"
            },
            "competition": {
                "title": "Competition Certificate",
                "description": "This certifies participation in the",
                "background_color": "#dbeafe",
                "text_color": "#1e3a8a",
                "accent_color": "#3b82f6",
                "border_color": "#3b82f6"
            }
        }
    
    def get_template(self, template_type: str) -> Dict[str, str]:
        """Get template configuration"""
        return self.templates.get(template_type, self.templates["course_completion"])

class CertificateGenerator:
    """Certificate PDF generator"""
    
    def __init__(self):
        self.template_manager = CertificateTemplate()
        self.private_key = None
        self.public_key = None
        self._generate_keys()
    
    def _generate_keys(self):
        """Generate RSA keys for certificate signing"""
        try:
            self.private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048
            )
            self.public_key = self.private_key.public_key()
            logger.info("Certificate signing keys generated")
        except Exception as e:
            logger.error(f"Failed to generate keys: {str(e)}")
    
    async def generate_certificate(
        self,
        user_id: str,
        user_name: str,
        course_name: str,
        completion_date: datetime,
        template_type: str = "course_completion",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate a certificate PDF"""
        try:
            # Create certificate data
            certificate_data = {
                "certificate_id": str(uuid.uuid4()),
                "user_id": user_id,
                "user_name": user_name,
                "course_name": course_name,
                "completion_date": completion_date.isoformat(),
                "template_type": template_type,
                "metadata": metadata or {},
                "issued_at": datetime.utcnow().isoformat()
            }
            
            # Generate PDF
            pdf_bytes = await self._create_pdf_certificate(certificate_data)
            
            # Sign certificate
            signature = self._sign_certificate(certificate_data)
            
            # Create verification QR code
            qr_code = await self._create_verification_qr(certificate_data["certificate_id"])
            
            # Save certificate record
            certificate_record = {
                **certificate_data,
                "signature": signature,
                "qr_code": qr_code,
                "pdf_data": base64.b64encode(pdf_bytes).decode(),
                "status": "issued"
            }
            
            logger.info(f"Certificate generated for user {user_id}")
            return certificate_record
            
        except Exception as e:
            logger.error(f"Certificate generation failed: {str(e)}")
            raise
    
    async def _create_pdf_certificate(self, certificate_data: Dict[str, Any]) -> bytes:
        """Create PDF certificate"""
        buffer = BytesIO()
        template = self.template_manager.get_template(certificate_data["template_type"])
        
        # Create PDF canvas
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # Background
        c.setFillColor(HexColor(template["background_color"]))
        c.rect(0, 0, width, height, fill=True, stroke=False)
        
        # Border
        c.setStrokeColor(HexColor(template["border_color"]))
        c.setLineWidth(3)
        c.rect(50, 50, width - 100, height - 100, fill=False)
        
        # Inner border
        c.setLineWidth(1)
        c.rect(60, 60, width - 120, height - 120, fill=False)
        
        # Title
        c.setFillColor(HexColor(template["accent_color"]))
        c.setFont("Helvetica-Bold", 36)
        title = template["title"]
        title_width = c.stringWidth(title, "Helvetica-Bold", 36)
        c.drawString((width - title_width) / 2, height - 120, title)
        
        # Description
        c.setFillColor(HexColor(template["text_color"]))
        c.setFont("Helvetica", 18)
        description = template["description"]
        desc_width = c.stringWidth(description, "Helvetica", 18)
        c.drawString((width - desc_width) / 2, height - 180, description)
        
        # Course name
        c.setFillColor(HexColor(template["accent_color"]))
        c.setFont("Helvetica-Bold", 28)
        course_name = certificate_data["course_name"]
        course_width = c.stringWidth(course_name, "Helvetica-Bold", 28)
        c.drawString((width - course_width) / 2, height - 250, course_name)
        
        # Student name
        c.setFillColor(HexColor(template["text_color"]))
        c.setFont("Helvetica", 24)
        student_text = f"This is to certify that"
        student_width = c.stringWidth(student_text, "Helvetica", 24)
        c.drawString((width - student_width) / 2, height - 320, student_text)
        
        # Name in larger font
        c.setFillColor(HexColor(template["accent_color"]))
        c.setFont("Helvetica-Bold", 32)
        name = certificate_data["user_name"]
        name_width = c.stringWidth(name, "Helvetica-Bold", 32)
        c.drawString((width - name_width) / 2, height - 380, name)
        
        # Completion date
        c.setFillColor(HexColor(template["text_color"]))
        c.setFont("Helvetica", 16)
        date_text = f"Completed on: {certificate_data['completion_date'][:10]}"
        date_width = c.stringWidth(date_text, "Helvetica", 16)
        c.drawString((width - date_width) / 2, height - 440, date_text)
        
        # Certificate ID
        c.setFont("Helvetica", 12)
        cert_id_text = f"Certificate ID: {certificate_data['certificate_id']}"
        cert_id_width = c.stringWidth(cert_id_text, "Helvetica", 12)
        c.drawString((width - cert_id_width) / 2, height - 480, cert_id_text)
        
        # Signature line
        c.setStrokeColor(HexColor(template["text_color"]))
        c.setLineWidth(1)
        c.line(width - 300, 120, width - 100, 120)
        
        # Signature text
        c.setFillColor(HexColor(template["text_color"]))
        c.setFont("Helvetica", 12)
        c.drawString(width - 280, 100, "Authorized Signature")
        
        # Date
        c.drawString(width - 280, 80, datetime.utcnow().strftime("%B %d, %Y"))
        
        # Save PDF
        c.save()
        buffer.seek(0)
        
        return buffer.getvalue()
    
    def _sign_certificate(self, certificate_data: Dict[str, Any]) -> str:
        """Sign certificate with private key"""
        try:
            # Create certificate hash
            cert_string = json.dumps(certificate_data, sort_keys=True)
            cert_hash = hashlib.sha256(cert_string.encode()).digest()
            
            # Sign hash
            signature = self.private_key.sign(
                cert_hash,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            return base64.b64encode(signature).decode()
            
        except Exception as e:
            logger.error(f"Certificate signing failed: {str(e)}")
            raise
    
    async def _create_verification_qr(self, certificate_id: str) -> str:
        """Create QR code for certificate verification"""
        try:
            # Create QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            
            verification_url = f"https://pymastery.com/verify/{certificate_id}"
            qr.add_data(verification_url)
            qr.make(fit=True)
            
            # Create QR code image
            qr_img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = BytesIO()
            qr_img.save(buffer, format="PNG")
            qr_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            return qr_base64
            
        except Exception as e:
            logger.error(f"QR code generation failed: {str(e)}")
            return ""
    
    async def verify_certificate(self, certificate_id: str, signature: str, certificate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Verify certificate authenticity"""
        try:
            # Create certificate hash
            cert_string = json.dumps(certificate_data, sort_keys=True)
            cert_hash = hashlib.sha256(cert_string.encode()).digest()
            
            # Decode signature
            signature_bytes = base64.b64decode(signature)
            
            # Verify signature
            self.public_key.verify(
                signature_bytes,
                cert_hash,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            # Check if certificate exists in database (simplified)
            # In a real implementation, check against database
            
            return {
                "valid": True,
                "certificate_id": certificate_id,
                "verified_at": datetime.utcnow().isoformat(),
                "message": "Certificate is valid and authentic"
            }
            
        except InvalidSignature:
            return {
                "valid": False,
                "certificate_id": certificate_id,
                "verified_at": datetime.utcnow().isoformat(),
                "message": "Certificate signature is invalid"
            }
        except Exception as e:
            logger.error(f"Certificate verification failed: {str(e)}")
            return {
                "valid": False,
                "certificate_id": certificate_id,
                "verified_at": datetime.utcnow().isoformat(),
                "message": f"Verification error: {str(e)}"
            }

class CertificateService:
    """Certificate management service"""
    
    def __init__(self):
        self.generator = CertificateGenerator()
        self.certificates: Dict[str, Dict[str, Any]] = {}  # In-memory storage
    
    async def issue_certificate(
        self,
        user_id: str,
        user_name: str,
        course_name: str,
        completion_date: datetime,
        template_type: str = "course_completion",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Issue a new certificate"""
        try:
            # Generate certificate
            certificate_record = await self.generator.generate_certificate(
                user_id, user_name, course_name, completion_date, template_type, metadata
            )
            
            # Store certificate
            self.certificates[certificate_record["certificate_id"]] = certificate_record
            
            logger.info(f"Certificate issued: {certificate_record['certificate_id']}")
            return certificate_record
            
        except Exception as e:
            logger.error(f"Certificate issuance failed: {str(e)}")
            raise
    
    async def verify_certificate(self, certificate_id: str) -> Dict[str, Any]:
        """Verify certificate"""
        try:
            # Get certificate record
            if certificate_id not in self.certificates:
                return {
                    "valid": False,
                    "message": "Certificate not found"
                }
            
            certificate_record = self.certificates[certificate_id]
            
            # Verify with generator
            verification_result = await self.generator.verify_certificate(
                certificate_id,
                certificate_record["signature"],
                {
                    "certificate_id": certificate_record["certificate_id"],
                    "user_id": certificate_record["user_id"],
                    "user_name": certificate_record["user_name"],
                    "course_name": certificate_record["course_name"],
                    "completion_date": certificate_record["completion_date"],
                    "template_type": certificate_record["template_type"],
                    "issued_at": certificate_record["issued_at"]
                }
            )
            
            return verification_result
            
        except Exception as e:
            logger.error(f"Certificate verification failed: {str(e)}")
            return {
                "valid": False,
                "message": f"Verification error: {str(e)}"
            }
    
    async def get_user_certificates(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all certificates for a user"""
        user_certificates = []
        
        for cert_id, cert_record in self.certificates.items():
            if cert_record["user_id"] == user_id:
                user_certificates.append({
                    "certificate_id": cert_id,
                    "course_name": cert_record["course_name"],
                    "completion_date": cert_record["completion_date"],
                    "template_type": cert_record["template_type"],
                    "issued_at": cert_record["issued_at"],
                    "status": cert_record["status"]
                })
        
        return user_certificates
    
    async def revoke_certificate(self, certificate_id: str, reason: str) -> Dict[str, Any]:
        """Revoke a certificate"""
        try:
            if certificate_id not in self.certificates:
                return {
                    "success": False,
                    "message": "Certificate not found"
                }
            
            # Update certificate status
            self.certificates[certificate_id]["status"] = "revoked"
            self.certificates[certificate_id]["revoked_at"] = datetime.utcnow().isoformat()
            self.certificates[certificate_id]["revocation_reason"] = reason
            
            logger.info(f"Certificate revoked: {certificate_id}")
            
            return {
                "success": True,
                "message": "Certificate revoked successfully",
                "revoked_at": self.certificates[certificate_id]["revoked_at"]
            }
            
        except Exception as e:
            logger.error(f"Certificate revocation failed: {str(e)}")
            return {
                "success": False,
                "message": f"Revocation error: {str(e)}"
            }
    
    async def get_certificate_pdf(self, certificate_id: str) -> Optional[bytes]:
        """Get certificate PDF data"""
        try:
            if certificate_id not in self.certificates:
                return None
            
            pdf_data = self.certificates[certificate_id]["pdf_data"]
            return base64.b64decode(pdf_data)
            
        except Exception as e:
            logger.error(f"Failed to get certificate PDF: {str(e)}")
            return None

# Global certificate service instance
certificate_service = CertificateService()
