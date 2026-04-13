from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_LEFT
import io
from datetime import datetime


def generate_pdf_report(scan_data, patient_data=None):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=30 * mm, bottomMargin=20 * mm,
        leftMargin=25 * mm, rightMargin=25 * mm
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Heading1'],
        fontSize=24, textColor=HexColor('#0EA5E9'), spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'Subtitle', parent=styles['Normal'],
        fontSize=10, textColor=HexColor('#9CA3AF'), spaceAfter=16
    )
    heading_style = ParagraphStyle(
        'CustomHeading', parent=styles['Heading2'],
        fontSize=14, textColor=HexColor('#111827'), spaceAfter=8, spaceBefore=16
    )
    body_style = ParagraphStyle(
        'CustomBody', parent=styles['Normal'],
        fontSize=10, textColor=HexColor('#4B5563'), leading=14
    )
    disclaimer_style = ParagraphStyle(
        'Disclaimer', parent=styles['Normal'],
        fontSize=8, textColor=HexColor('#9CA3AF'), leading=11, alignment=TA_LEFT
    )

    elements = []

    # Header
    elements.append(Paragraph("NeuroScan AI", title_style))
    elements.append(Paragraph("Stroke Detection Report - Automated MRI Analysis", subtitle_style))
    elements.append(Spacer(1, 10))

    # Scan Date
    scan_date = scan_data.get('created_at', datetime.now().isoformat())
    if isinstance(scan_date, str):
        try:
            scan_date = datetime.fromisoformat(scan_date).strftime('%B %d, %Y at %I:%M %p')
        except Exception:
            scan_date = str(scan_date)
    elements.append(Paragraph(f"<b>Scan Date:</b> {scan_date}", body_style))
    elements.append(Spacer(1, 12))

    # Patient Info
    elements.append(Paragraph("Patient Information", heading_style))
    if patient_data:
        pt_rows = [
            ["Name:", patient_data.get('name', 'N/A')],
            ["Age:", str(patient_data.get('age', 'N/A'))],
            ["Gender:", patient_data.get('gender', 'N/A')],
        ]
        if patient_data.get('medical_history'):
            pt_rows.append(["Medical History:", patient_data.get('medical_history', '')])
    else:
        pt_name = scan_data.get('patient_name', 'Not specified')
        pt_rows = [["Patient:", pt_name]]

    t = Table(pt_rows, colWidths=[120, 350])
    t.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (0, -1), HexColor('#6B7280')),
        ('TEXTCOLOR', (1, 0), (1, -1), HexColor('#111827')),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)

    # Classification
    classification = scan_data.get('classification', 'unknown')
    confidence = scan_data.get('confidence', 0)
    stroke_info = scan_data.get('stroke_info', {})
    name = stroke_info.get('name', classification.title())

    color_map = {'hemorrhagic': '#E11D48', 'ischemic': '#F59E0B', 'normal': '#10B981'}
    result_color = color_map.get(classification, '#6B7280')

    elements.append(Paragraph("Classification Result", heading_style))

    result_style = ParagraphStyle(
        'Result', parent=styles['Normal'],
        fontSize=18, textColor=HexColor(result_color),
        fontName='Helvetica-Bold', spaceAfter=8
    )
    elements.append(Paragraph(name, result_style))
    elements.append(Paragraph(f"Confidence: {confidence * 100:.1f}%", body_style))
    elements.append(Spacer(1, 12))

    # Probabilities
    probs = scan_data.get('probabilities', {})
    if probs:
        prob_data = [
            ["Type", "Probability"],
            ["Hemorrhagic Stroke", f"{probs.get('hemorrhagic', 0) * 100:.1f}%"],
            ["Ischemic Stroke", f"{probs.get('ischemic', 0) * 100:.1f}%"],
            ["No Stroke", f"{probs.get('normal', 0) * 100:.1f}%"],
        ]
        prob_table = Table(prob_data, colWidths=[250, 200])
        prob_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#F3F4F6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#111827')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#E5E7EB')),
        ]))
        elements.append(prob_table)

    # Description
    if stroke_info.get('description'):
        elements.append(Paragraph("Analysis Details", heading_style))
        elements.append(Paragraph(stroke_info['description'], body_style))

    # Symptoms
    if stroke_info.get('symptoms'):
        elements.append(Paragraph("Associated Symptoms", heading_style))
        for s in stroke_info['symptoms']:
            elements.append(Paragraph(f"&bull; {s}", body_style))

    # Treatment
    if stroke_info.get('treatment'):
        elements.append(Paragraph("Treatment Options", heading_style))
        for item in stroke_info['treatment']:
            elements.append(Paragraph(f"&bull; {item}", body_style))

    # Risk Factors
    if stroke_info.get('risk_factors'):
        elements.append(Paragraph("Risk Factors", heading_style))
        for r in stroke_info['risk_factors']:
            elements.append(Paragraph(f"&bull; {r}", body_style))

    # Recommendations
    if stroke_info.get('recommendations'):
        elements.append(Paragraph("Recommendations", heading_style))
        for r in stroke_info['recommendations']:
            elements.append(Paragraph(f"&bull; {r}", body_style))

    # Feature Analysis
    feats = scan_data.get('features', {})
    if feats:
        elements.append(Paragraph("Image Feature Analysis", heading_style))
        feat_rows = [["Feature", "Value"]]
        feature_labels = {
            'mean_intensity': 'Mean Intensity',
            'std_intensity': 'Std Deviation',
            'high_intensity_ratio': 'High Intensity Ratio',
            'low_intensity_ratio': 'Low Intensity Ratio',
            'asymmetry_score': 'Asymmetry Score',
            'edge_density': 'Edge Density',
            'symmetry_index': 'Symmetry Index',
        }
        for key, label in feature_labels.items():
            if key in feats:
                feat_rows.append([label, str(feats[key])])

        feat_table = Table(feat_rows, colWidths=[250, 200])
        feat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#F3F4F6')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#E5E7EB')),
        ]))
        elements.append(feat_table)

    # Disclaimer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(
        "DISCLAIMER: This report is generated by an automated AI-based screening tool for "
        "educational and research purposes only. It should NOT be used as a substitute for "
        "professional medical diagnosis. Always consult with a qualified healthcare professional "
        "for medical advice, diagnosis, and treatment.",
        disclaimer_style
    ))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f"Report generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
        disclaimer_style
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer
