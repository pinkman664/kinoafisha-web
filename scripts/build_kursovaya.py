"""
Генерация курсового проекта «Киноафиша» по СТП БГТУ 001-2019.
Создаёт единый файл /app/Курсовая.docx, в который далее будут
дописываться разделы.
"""
from docx import Document
from docx.shared import Pt, Mm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


def set_page_setup(doc: Document) -> None:
    """Поля по СТП БГТУ: правое 10 мм, верхнее 20 мм, левое 23 мм,
    нижнее 15 мм. Номер страницы — 10 мм от верхнего края."""
    for section in doc.sections:
        section.top_margin = Mm(20)
        section.bottom_margin = Mm(15)
        section.left_margin = Mm(23)
        section.right_margin = Mm(10)
        section.header_distance = Mm(10)
        section.footer_distance = Mm(10)


def add_page_number_header(doc: Document) -> None:
    """Номер страницы в правом верхнем углу через автополе PAGE."""
    section = doc.sections[0]
    header = section.header
    p = header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    run = p.add_run()
    run.font.name = "Times New Roman"
    run.font.size = Pt(14)

    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")

    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = "PAGE"

    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")

    run._r.append(fld_char1)
    run._r.append(instr_text)
    run._r.append(fld_char2)


def set_default_style(doc: Document) -> None:
    """Times New Roman 14 пт, одинарный межстрочный интервал."""
    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(14)

    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:eastAsia"), "Times New Roman")
    rfonts.set(qn("w:cs"), "Times New Roman")

    pf = style.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    pf.space_before = Pt(0)
    pf.space_after = Pt(0)


def add_heading_special(doc: Document, text: str) -> None:
    """Специальный заголовок (Введение, Заключение, Содержание и т.п.):
    строчные кроме первой прописной, полужирный, симметрично тексту,
    без точки, интервал 18 пт после заголовка."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(18)
    p.paragraph_format.first_line_indent = Mm(0)
    run = p.add_run(text)
    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(14)


def add_body_paragraph(doc: Document, text: str) -> None:
    """Обычный абзац: красная строка 12,5 мм, выравнивание по ширине."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.first_line_indent = Mm(12.5)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(14)


def main() -> None:
    doc = Document()

    set_page_setup(doc)
    set_default_style(doc)
    add_page_number_header(doc)

    # ────────────────────────────────────────────────────────────────────
    # ВВЕДЕНИЕ
    # ────────────────────────────────────────────────────────────────────
    add_heading_special(doc, "Введение")

    add_body_paragraph(
        doc,
        "Кинематограф является одним из самых востребованных видов досуга в "
        "современном обществе, объединяющим зрителей разных возрастов и "
        "интересов. В современных условиях организация работы кинотеатров и "
        "взаимодействие с посетителями всё чаще осуществляются с "
        "использованием цифровых технологий, позволяющих автоматизировать "
        "продажу билетов, управление расписанием сеансов и координацию работы "
        "сети кинотеатров."
    )

    add_body_paragraph(
        doc,
        "Разрабатываемое web-приложение представляет собой систему для "
        "поиска фильмов в прокате и приобретения билетов на киносеансы. "
        "Система предоставляет пользователям возможность просматривать "
        "афишу действующих и будущих фильмов, изучать детальную информацию "
        "о картинах, выбирать сеансы и места в зале, оплачивать билеты в "
        "режиме онлайн с получением электронного билета в виде QR-кода, "
        "оставлять комментарии и оценивать просмотренные фильмы. "
        "Дополнительно приложение поддерживает распределение ролей между "
        "гостями, клиентами и администраторами, что позволяет разграничить "
        "доступ к функциональным возможностям системы и обеспечить "
        "управление платформой."
    )

    add_body_paragraph(
        doc,
        "Целью данного курсового проекта является разработка современного "
        "web-приложения для поиска фильмов и онлайн-бронирования билетов на "
        "киносеансы, обеспечивающего удобное взаимодействие пользователей, "
        "автоматизацию управления репертуаром кинотеатров и приём "
        "электронных платежей в режиме реального времени. Для достижения "
        "поставленной цели необходимо выполнить анализ предметной области и "
        "обзор аналогичных решений, что рассматривается в главе 1, "
        "разработать архитектуру приложения, модель базы данных и программную "
        "реализацию функциональных возможностей системы, представленные в "
        "главе 2, а также выполнить тестирование и проверку работоспособности "
        "приложения и составить руководство пользователя, рассмотренные в "
        "главе 3."
    )

    add_body_paragraph(
        doc,
        "Целевой аудиторией приложения являются зрители, интересующиеся "
        "посещением кинотеатров, администраторы кинопрокатных сетей, а также "
        "пользователи, заинтересованные в удобной платформе для выбора "
        "фильмов, бронирования мест и оплаты билетов через единый онлайн-"
        "сервис."
    )

    add_body_paragraph(
        doc,
        "В качестве программной платформы используются Node.js 22, React "
        "18.3, Oracle Database 21c, TypeORM 0.3, Docker 27 и Nginx 1.27, "
        "обеспечивающие разработку современной клиент-серверной web-системы."
    )

    output_path = "/app/Курсовая.docx"
    doc.save(output_path)
    print(f"Документ сохранён: {output_path}")


if __name__ == "__main__":
    main()
