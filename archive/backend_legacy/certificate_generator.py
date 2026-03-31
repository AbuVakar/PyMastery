from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.units import inch
from reportlab.lib.colors import black, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from datetime import datetime
import os

class CertificateGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_styles()

    def _setup_styles(self):
        """Setup custom styles for certificate"""
        self.title_style = ParagraphStyle(
            'CertificateTitle',
            parent=self.styles['Heading1'],
            fontSize=36,
            textColor=Color(0.2, 0.2, 0.2),
            alignment=1,  # Center alignment
            spaceAfter=30,
        )

        self.subtitle_style = ParagraphStyle(
            'CertificateSubtitle',
            parent=self.styles['Heading2'],
            fontSize=24,
            textColor=Color(0.3, 0.3, 0.3),
            alignment=1,
            spaceAfter=40,
        )

        self.body_style = ParagraphStyle(
            'CertificateBody',
            parent=self.styles['Normal'],
            fontSize=16,
            textColor=black,
            alignment=1,
            spaceAfter=20,
        )

        self.name_style = ParagraphStyle(
            'CertificateName',
            parent=self.styles['Heading1'],
            fontSize=32,
            textColor=Color(0.1, 0.1, 0.5),
            alignment=1,
            spaceAfter=40,
        )

    def generate_certificate_pdf(self, user_name: str, course_name: str,
                               completion_date: datetime, verification_id: str) -> BytesIO:
        """Generate certificate PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []

        # Certificate Title
        elements.append(Paragraph("CERTIFICATE OF COMPLETION", self.title_style))
        elements.append(Spacer(1, 20))

        # Subtitle
        elements.append(Paragraph("This is to certify that", self.subtitle_style))

        # User Name
        elements.append(Paragraph(user_name, self.name_style))

        # Course Completion Text
        completion_text = f"has successfully completed the course"
        elements.append(Paragraph(completion_text, self.body_style))

        # Course Name
        elements.append(Paragraph(f"<b>{course_name}</b>", self.body_style))
        elements.append(Spacer(1, 30))

        # Completion Date
        date_str = completion_date.strftime("%B %d, %Y")
        elements.append(Paragraph(f"Completed on: {date_str}", self.body_style))
        elements.append(Spacer(1, 30))

        # Verification ID
        elements.append(Paragraph(f"Verification ID: {verification_id}", self.body_style))
        elements.append(Spacer(1, 20))

        # Footer
        elements.append(Paragraph("PyMastery Learning Platform", self.body_style))
        elements.append(Paragraph("www.pymastery.com", self.body_style))

        # Build PDF
        doc.build(elements)
        buffer.seek(0)

        return buffer
