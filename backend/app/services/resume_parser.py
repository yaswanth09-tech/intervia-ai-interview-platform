"""
Resume parsing service.

Strategy (hybrid, not pure NLP): resumes are wildly inconsistent in formatting,
so pure NER-over-the-whole-document parsing is unreliable. Instead:

  1. Extract raw text with PyMuPDF.
  2. Split the text into sections using common resume headings (regex).
  3. Run lightweight parsing *within* each section - simple line/bullet
     splitting for skills/certifications/projects, and spaCy NER (for
     organizations) plus date-range regex for education/experience.

This is far more robust in practice than asking spaCy to classify an entire
resume in one pass.
"""

import re

import fitz  # PyMuPDF
import spacy

_nlp = None


def get_nlp():
    """Load the spaCy model once and reuse it (loading is slow)."""
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


# Section headings we look for, mapped to a canonical key.
# Order matters only for readability; matching is done independently per heading.
SECTION_HEADINGS = {
    "skills": [r"skills", r"technical skills", r"core competencies"],
    "education": [r"education", r"academic background"],
    "experience": [r"experience", r"work experience", r"professional experience", r"employment history"],
    "projects": [r"projects", r"personal projects", r"academic projects"],
    "certifications": [r"certifications", r"certificates", r"licenses"],
}

_MONTHS = (
    r"Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
    r"Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?"
)
DATE_RANGE_PATTERN = re.compile(
    rf"(?:(?:{_MONTHS})\s+)?(?P<start>\d{{4}})\s*(?:-|–|to)\s*"
    rf"(?:(?:(?:{_MONTHS})\s+)?(?P<end>\d{{4}})|(?P<present>present|current))",
    re.IGNORECASE,
)

_BULLET_PREFIXES = ("-", "•", "*", "▪", "●")


def _split_entry_blocks(section_text: str) -> list[str]:
    """Split a section into individual entries (jobs/degrees).

    Prefers blank-line separation. Falls back to detecting the transition
    from bullet-point detail lines back to a plain title line, which is how
    most single-spaced resumes separate consecutive entries.
    """
    blank_line_blocks = [b.strip() for b in re.split(r"\n{2,}", section_text) if b.strip()]
    if len(blank_line_blocks) > 1:
        return blank_line_blocks

    lines = [l for l in section_text.splitlines() if l.strip()]
    if not lines:
        return []

    blocks: list[list[str]] = []
    current: list[str] = []
    for line in lines:
        is_bullet = line.strip().startswith(_BULLET_PREFIXES)
        prev_was_bullet = current and current[-1].strip().startswith(_BULLET_PREFIXES)
        if current and prev_was_bullet and not is_bullet:
            blocks.append(current)
            current = []
        current.append(line)
    if current:
        blocks.append(current)

    return ["\n".join(b) for b in blocks]


def extract_text_from_pdf(file_bytes: bytes) -> str:
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        # sort=True reorders extracted text into visual top-to-bottom,
        # left-to-right reading order. Without it, PyMuPDF can emit text
        # in internal PDF content-stream order, which scrambles resumes
        # that mix left-aligned body text with right-aligned dates/labels
        # (a very common resume layout) -- headings end up bunched
        # together before any of their actual content.
        pages_text = [page.get_text(sort=True) for page in doc]
    return "\n".join(pages_text)


def _clean_heading_candidate(line: str) -> str:
    """Strip leading icon/bullet glyphs so a heading is still recognized even
    when the PDF embeds a small icon character right before the heading text
    (common in resume templates with icon-labelled section headers, which
    PyMuPDF often extracts as a stray non-letter character glued to the
    start of the line)."""
    cleaned = re.sub(r"^[^A-Za-z]+", "", line)
    return cleaned.strip().rstrip(":").strip()


def split_into_sections(text: str) -> dict[str, str]:
    """Split resume text into {canonical_section_key: raw_section_text}.

    Matches heading candidates line-by-line (rather than with a single
    whole-text regex) so a stray leading character on the heading line
    doesn't prevent the whole line from matching.
    """
    lines = text.splitlines()
    heading_positions: list[tuple[str, int]] = []

    for i, line in enumerate(lines):
        candidate = _clean_heading_candidate(line)
        # Heading lines are short and alone on a line; skip anything longer
        # (avoids false-matches on body text that happens to contain a
        # heading word mid-sentence).
        if not candidate or len(candidate) > 40:
            continue
        canonical_key = next(
            (key for key, patterns in SECTION_HEADINGS.items()
             if any(re.fullmatch(p, candidate, re.IGNORECASE) for p in patterns)),
            None,
        )
        if canonical_key is not None:
            heading_positions.append((canonical_key, i))

    sections: dict[str, str] = {}
    for idx, (canonical_key, line_idx) in enumerate(heading_positions):
        start_line = line_idx + 1
        end_line = heading_positions[idx + 1][1] if idx + 1 < len(heading_positions) else len(lines)
        section_body = "\n".join(lines[start_line:end_line]).strip()

        # If a section heading repeats, append rather than overwrite.
        if canonical_key in sections:
            sections[canonical_key] += "\n" + section_body
        else:
            sections[canonical_key] = section_body

    return sections


def _lines_to_list(section_text: str) -> list[str]:
    """Turn a section's raw text into a clean list of non-empty lines/items."""
    items = []
    for raw_line in section_text.splitlines():
        line = raw_line.strip().lstrip("•-*▪●").strip()
        if line:
            items.append(line)
    return items


def parse_skills(section_text: str) -> list[str]:
    if not section_text:
        return []
    # Skills sections are often comma or bullet separated rather than one-per-line.
    raw_items = re.split(r"[,\n•▪●]", section_text)
    skills = [s.strip().strip("-").strip() for s in raw_items]
    return [s for s in skills if s and len(s) < 60]


def _header_lines_list(block: str) -> list[str]:
    """The non-bullet lines of a block, where role/company/institution usually live."""
    return [l.strip() for l in block.splitlines() if not l.strip().startswith(_BULLET_PREFIXES)]


def _guess_org_name(header_lines: list[str], nlp) -> str | None:
    """Guess the company/institution name for one entry.

    Resumes are structurally consistent even when NER isn't reliable on short
    fragments: the org/institution name is almost always the line immediately
    before the line containing the date range, or on the same line as the
    date range with the date stripped out. Fall back to spaCy ORG detection
    only if that structural guess comes up empty.
    """
    date_line_idx = next(
        (i for i, l in enumerate(header_lines) if DATE_RANGE_PATTERN.search(l)), None
    )

    if date_line_idx is not None:
        # Same line as the date, with the date text removed (e.g. "Acme Corp | 2022 - Present")
        line_without_date = DATE_RANGE_PATTERN.sub("", header_lines[date_line_idx]).strip(" |,-")
        if line_without_date:
            return line_without_date
        # Otherwise, the line just before the date line.
        if date_line_idx > 0:
            return header_lines[date_line_idx - 1]

    # Fallback: NER over the full header block.
    doc = nlp(" ".join(header_lines))
    orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
    return orgs[0] if orgs else None


def parse_education(section_text: str, nlp) -> list[dict]:
    if not section_text:
        return []
    entries = []
    for block in _split_entry_blocks(section_text):
        header_lines = _header_lines_list(block)
        date_match = DATE_RANGE_PATTERN.search(block)
        entries.append({
            "raw_text": " ".join(block.split()),
            "institution": _guess_org_name(header_lines, nlp),
            "date_range": date_match.group(0) if date_match else None,
        })
    return entries


def parse_experience(section_text: str, nlp) -> list[dict]:
    if not section_text:
        return []
    entries = []
    for block in _split_entry_blocks(section_text):
        header_lines = _header_lines_list(block)
        date_match = DATE_RANGE_PATTERN.search(block)
        lines = _lines_to_list(block)
        entries.append({
            "organization": _guess_org_name(header_lines, nlp),
            "date_range": date_match.group(0) if date_match else None,
            "details": lines,
        })
    return entries


def parse_resume_text(text: str) -> dict:
    nlp = get_nlp()
    sections = split_into_sections(text)

    return {
        "skills": parse_skills(sections.get("skills", "")),
        "education": parse_education(sections.get("education", ""), nlp),
        "experience": parse_experience(sections.get("experience", ""), nlp),
        "projects": _lines_to_list(sections.get("projects", "")),
        "certifications": _lines_to_list(sections.get("certifications", "")),
        "raw_text_length": len(text),
    }


def parse_resume_pdf(file_bytes: bytes) -> dict:
    text = extract_text_from_pdf(file_bytes)
    if not text.strip():
        raise ValueError("Could not extract any text from this PDF. It may be a scanned image.")
    return parse_resume_text(text)