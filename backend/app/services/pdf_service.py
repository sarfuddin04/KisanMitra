import os
import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.core.config import settings

def generate_crop_pdf_report(farmer_name: str, farm_location: str, crop_data: dict, inputs: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Brand Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#059669'), # Emerald-600
        alignment=0
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4B5563')
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#065F46'),
        spaceBefore=8,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1F2937')
    )
    highlight_box_style = ParagraphStyle(
        'HighlightText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#047857'),
        alignment=1
    )
    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#6B7280')
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("🌾 KisanMitra AI", title_style))
    story.append(Paragraph("Your Intelligent Farming Companion • Soil & Agronomic Intelligence", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#10B981'), spaceBefore=2, spaceAfter=10))

    # 2. Farmer & Report Meta Table
    now_str = datetime.datetime.now().strftime("%d %b %Y, %I:%M %p")
    meta_data = [
        [Paragraph("<b>Farmer Name:</b>", body_style), Paragraph(farmer_name, body_style),
         Paragraph("<b>Report Date:</b>", body_style), Paragraph(now_str, body_style)],
        [Paragraph("<b>Farm Location:</b>", body_style), Paragraph(farm_location or "National Agronomy Grid", body_style),
         Paragraph("<b>Report Type:</b>", body_style), Paragraph("Crop Suitability Evaluation", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[100, 170, 100, 170])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0FDF4')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#BBF7D0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # 3. Primary Prediction Box
    crop_name = crop_data.get("recommended_crop", "Recommended Crop")
    conf = crop_data.get("confidence", 0.95)
    story.append(Paragraph("AI RECOMMENDATION RESULT", section_heading))
    
    result_data = [
        [Paragraph(f"Recommended Crop: <b>{crop_name.upper()}</b>", highlight_box_style)],
        [Paragraph(f"Model Confidence: <b>{conf * 100:.1f}%</b> | Agro-Climatic Suitability: <b>Optimal</b>", body_style)]
    ]
    result_table = Table(result_data, colWidths=[540])
    result_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ECFDF5')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#10B981')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(result_table)
    story.append(Spacer(1, 14))

    # 4. Tested Soil & Climate Input Parameters
    story.append(Paragraph("TESTED SOIL & CLIMATE PARAMETERS", section_heading))
    param_data = [
        [Paragraph("<b>Parameter</b>", body_style), Paragraph("<b>Observed Value</b>", body_style), Paragraph("<b>Standard Optimum</b>", body_style)],
        [Paragraph("Nitrogen (N)", body_style), Paragraph(f"{inputs.get('n', 'N/A')} kg/ha", body_style), Paragraph("60 - 120 kg/ha", body_style)],
        [Paragraph("Phosphorus (P)", body_style), Paragraph(f"{inputs.get('p', 'N/A')} kg/ha", body_style), Paragraph("35 - 80 kg/ha", body_style)],
        [Paragraph("Potassium (K)", body_style), Paragraph(f"{inputs.get('k', 'N/A')} kg/ha", body_style), Paragraph("20 - 60 kg/ha", body_style)],
        [Paragraph("Soil pH Level", body_style), Paragraph(f"{inputs.get('ph', 'N/A')}", body_style), Paragraph("6.0 - 7.5 (Neutral)", body_style)],
        [Paragraph("Temperature", body_style), Paragraph(f"{inputs.get('temperature', 'N/A')} °C", body_style), Paragraph("20 - 32 °C", body_style)],
        [Paragraph("Relative Humidity", body_style), Paragraph(f"{inputs.get('humidity', 'N/A')} %", body_style), Paragraph("60 - 85 %", body_style)],
        [Paragraph("Rainfall", body_style), Paragraph(f"{inputs.get('rainfall', 'N/A')} mm", body_style), Paragraph("80 - 250 mm", body_style)]
    ]
    param_table = Table(param_data, colWidths=[180, 180, 180])
    param_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')])
    ]))
    story.append(param_table)
    story.append(Spacer(1, 14))

    # 5. Agronomic Advisory
    story.append(Paragraph("RECOMMENDED CULTIVATION GUIDANCE", section_heading))
    tips = crop_data.get("cultivation_tips", "Follow standard good agricultural practices.")
    story.append(Paragraph(tips, body_style))
    story.append(Spacer(1, 8))

    alternatives = crop_data.get("alternative_crops", [])
    if alternatives:
        alt_str = ", ".join(alternatives)
        story.append(Paragraph(f"<b>Viable Alternative Crops:</b> {alt_str}", body_style))
        story.append(Spacer(1, 12))

    # 6. Disclaimer Footer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E5E7EB'), spaceBefore=10, spaceAfter=8))
    disclaimer = (
        "<b>Important Notice & Disclaimer:</b> This agronomic report is generated by KisanMitra AI using machine learning models "
        "trained on agricultural research datasets. Soil health and climate parameters may vary locally. Farmers are advised to "
        "corroborate results with local Krishi Vigyan Kendra (KVK) extension officers before making substantial financial investments."
    )
    story.append(Paragraph(disclaimer, disclaimer_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

def generate_disease_pdf_report(farmer_name: str, farm_location: str, disease_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#DC2626') if disease_data.get("severity") in ["High", "Critical"] else colors.HexColor('#059669'),
        alignment=0
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4B5563')
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#111827'),
        spaceBefore=8,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1F2937')
    )
    highlight_box_style = ParagraphStyle(
        'HighlightText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#991B1B') if disease_data.get("severity") in ["High", "Critical"] else colors.HexColor('#065F46'),
        alignment=1
    )
    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#6B7280')
    )

    story = []

    # 1. Header
    story.append(Paragraph("🌿 KisanMitra AI • Plant Pathology Diagnostic Report", title_style))
    story.append(Paragraph("AI-Assisted Crop Disease Detection & Integrated Pest Management Advisory", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#EF4444') if disease_data.get("severity") in ["High", "Critical"] else colors.HexColor('#10B981'), spaceBefore=2, spaceAfter=10))

    # 2. Meta Table
    now_str = datetime.datetime.now().strftime("%d %b %Y, %I:%M %p")
    meta_data = [
        [Paragraph("<b>Farmer Name:</b>", body_style), Paragraph(farmer_name, body_style),
         Paragraph("<b>Report Date:</b>", body_style), Paragraph(now_str, body_style)],
        [Paragraph("<b>Target Crop:</b>", body_style), Paragraph(disease_data.get("crop", "General Crop"), body_style),
         Paragraph("<b>Pathogen Class:</b>", body_style), Paragraph(disease_data.get("pathogen_type", "Fungal"), body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[100, 170, 100, 170])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEF2F2') if disease_data.get("severity") in ["High", "Critical"] else colors.HexColor('#F0FDF4')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#FECACA') if disease_data.get("severity") in ["High", "Critical"] else colors.HexColor('#BBF7D0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # 3. Diagnostic Summary
    disease_name = disease_data.get("predicted_disease") or disease_data.get("name", "Unknown Disease")
    conf = disease_data.get("confidence", 0.92)
    severity = disease_data.get("severity", "Moderate")

    story.append(Paragraph("PATHOLOGY DIAGNOSIS RESULT", section_heading))
    diag_data = [
        [Paragraph(f"Detected Condition: <b>{disease_name.upper()}</b>", highlight_box_style)],
        [Paragraph(f"Diagnostic Confidence: <b>{conf * 100:.1f}%</b> | Severity Level: <b>{severity}</b>", body_style)]
    ]
    diag_table = Table(diag_data, colWidths=[540])
    diag_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFF1F2') if severity in ["High", "Critical"] else colors.HexColor('#ECFDF5')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#F43F5E') if severity in ["High", "Critical"] else colors.HexColor('#10B981')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(diag_table)
    story.append(Spacer(1, 14))

    # 4. Symptoms & Causes
    story.append(Paragraph("SYMPTOMS & ETIOLOGY", section_heading))
    symptoms = disease_data.get("symptoms", "Necrotic spotting observed on leaf surface.")
    causes = disease_data.get("causes", "Pathogen proliferation in favorable weather.")
    story.append(Paragraph(f"<b>Key Symptoms:</b> {symptoms}", body_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"<b>Causative Conditions:</b> {causes}", body_style))
    story.append(Spacer(1, 14))

    # 5. Treatment and Remediation Plan
    story.append(Paragraph("RECOMMENDED REMEDIATION & TREATMENT", section_heading))
    treatments = disease_data.get("treatment")
    if isinstance(treatments, list):
        for t in treatments:
            story.append(Paragraph(f"• {t}", body_style))
    else:
        story.append(Paragraph(str(treatments or "Apply registered bio-fungicide or copper spray."), body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("PREVENTION & CULTURAL PRACTICES", section_heading))
    preventions = disease_data.get("prevention")
    if isinstance(preventions, list):
        for p in preventions:
            story.append(Paragraph(f"• {p}", body_style))
    else:
        story.append(Paragraph(str(preventions or "Ensure crop rotation and avoid overhead water splashing."), body_style))
    story.append(Spacer(1, 14))

    # 6. Disclaimer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E5E7EB'), spaceBefore=10, spaceAfter=8))
    disclaimer = (
        "<b>AI Diagnostic Disclaimer:</b> This report is generated by KisanMitra AI computer vision algorithms for educational "
        "and preliminary screening purposes only. Chemical dosage and pesticide application must comply with local agricultural regulations. "
        "For severe or spreading crop epidemics, immediately consult a certified agricultural officer."
    )
    story.append(Paragraph(disclaimer, disclaimer_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
