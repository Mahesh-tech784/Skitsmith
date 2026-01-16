from fpdf import FPDF
from io import BytesIO


def generate_pdf_bytes(text: str, title: str = "SkitSmith Export") -> BytesIO:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, title, ln=True, align='C')
    pdf.ln(5)
    pdf.set_font("Arial", size=12)

    for line in text.splitlines():
        pdf.multi_cell(0, 8, line)

    pdf_bytes = pdf.output(dest='S').encode('latin-1')
    buf = BytesIO(pdf_bytes)
    buf.seek(0)
    return buf
