"""
PDF Prescription Generator
Creates professional-looking prescription PDFs using reportlab.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from datetime import datetime
import os
from io import BytesIO


def create_prescription_pdf(
    doctor_name: str,
    specialization: str,
    qualification: str,
    patient_name: str,
    appointment_date: str,
    prescription_notes: str,
    clinic_address: str = None
) -> BytesIO:
    """
    Generate a professional prescription PDF.
    Returns BytesIO object for direct download.
    """
    
    buffer = BytesIO()
    
    # Create document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
        title="Prescription"
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    styles.add(ParagraphStyle(
        name='ClinicHeader',
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#2563eb'),
        alignment=TA_CENTER,
        spaceAfter=5
    ))
    
    styles.add(ParagraphStyle(
        name='DoctorInfo',
        fontName='Helvetica',
        fontSize=12,
        textColor=colors.HexColor('#4b5563'),
        alignment=TA_CENTER,
        spaceAfter=3
    ))
    
    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#1f2937'),
        spaceBefore=15,
        spaceAfter=10
    ))
    
    styles.add(ParagraphStyle(
        name='PatientInfo',
        fontName='Helvetica',
        fontSize=12,
        textColor=colors.HexColor('#374151'),
        spaceAfter=5
    ))
    
    styles.add(ParagraphStyle(
        name='PrescriptionText',
        fontName='Helvetica',
        fontSize=11,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=8,
        leading=16
    ))
    
    styles.add(ParagraphStyle(
        name='Footer',
        fontName='Helvetica-Oblique',
        fontSize=9,
        textColor=colors.HexColor('#9ca3af'),
        alignment=TA_CENTER,
        spaceBefore=20
    ))
    
    # Build content
    story = []
    
    # Header - Clinic/Doctor Info
    story.append(Paragraph("Medical Prescription", styles['ClinicHeader']))
    story.append(Spacer(1, 10))
    
    # Horizontal line
    story.append(HRFlowable(width="100%", thickness=2, lineCap='round', color=colors.HexColor('#2563eb')))
    story.append(Spacer(1, 15))
    
    # Doctor details
    doctor_data = [
        [Paragraph(f"<b>Dr. {doctor_name}</b>", styles['DoctorInfo'])],
        [Paragraph(f"{qualification} - {specialization}", styles['DoctorInfo'])],
    ]
    
    if clinic_address:
        doctor_data.append([Paragraph(clinic_address, styles['DoctorInfo'])])
    
    doctor_table = Table(doctor_data, colWidths=[6*inch])
    doctor_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(doctor_table)
    
    story.append(Spacer(1, 20))
    
    # Prescription details header
    story.append(HRFlowable(width="100%", thickness=1, lineCap='round', color=colors.HexColor('#d1d5db')))
    story.append(Spacer(1, 10))
    
    # Patient Info Table
    patient_info_data = [
        [Paragraph("<b>Patient Information</b>", styles['SectionTitle'])],
        [Paragraph(f"<b>Name:</b> {patient_name}", styles['PatientInfo'])],
        [Paragraph(f"<b>Date:</b> {appointment_date}", styles['PatientInfo'])],
    ]
    
    patient_table = Table(patient_info_data, colWidths=[6*inch])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
    ]))
    story.append(patient_table)
    
    story.append(Spacer(1, 20))
    
    # Prescription Notes
    story.append(Paragraph("Prescription / Medical Notes", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, lineCap='round', color=colors.HexColor('#d1d5db')))
    story.append(Spacer(1, 15))
    
    # Convert newlines to paragraphs
    notes_lines = prescription_notes.split('\n')
    for line in notes_lines:
        if line.strip():
            story.append(Paragraph(line, styles['PrescriptionText']))
    
    story.append(Spacer(1, 30))
    
    # Signature area
    story.append(HRFlowable(width="40%", thickness=1, lineCap='round', color=colors.black))
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        f"<b>Dr. {doctor_name}</b><br/>{qualification}<br/><br/><i>Date: {appointment_date}</i>",
        ParagraphStyle('Signature', fontName='Helvetica', fontSize=10, alignment=TA_RIGHT)
    ))
    
    story.append(Spacer(1, 30))
    
    # Footer
    story.append(HRFlowable(width="100%", thickness=1, lineCap='round', color=colors.HexColor('#d1d5db')))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "This is a computer-generated prescription. Please consult your healthcare provider for medical advice.",
        styles['Footer']
    ))
    story.append(Paragraph(
        f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        styles['Footer']
    ))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer


def save_prescription_to_file(
    doctor_name: str,
    specialization: str,
    qualification: str,
    patient_name: str,
    appointment_date: str,
    prescription_notes: str,
    clinic_address: str = None,
    filename: str = None
) -> str:
    """
    Generate and save prescription PDF to file.
    Returns file path.
    """
    
    buffer = create_prescription_pdf(
        doctor_name, specialization, qualification,
        patient_name, appointment_date, prescription_notes,
        clinic_address
    )
    
    # Create uploads/prescriptions directory
    upload_dir = os.path.join("uploads", "prescriptions")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate filename if not provided
    if not filename:
        filename = f"prescription_{patient_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    # Save file
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, "wb") as f:
        f.write(buffer.getvalue())
    
    return file_path
