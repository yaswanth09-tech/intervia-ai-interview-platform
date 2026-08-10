"""
Evaluates descriptive interview answers.

Primary signal: Gemini scores each answer on correctness, relevance,
completeness, and communication (0-10 each) with a short justification.

Secondary signal: a lightweight spaCy keyword-overlap ratio between the
question and the answer. This is NOT a replacement for the LLM judgment -
it's a cheap sanity check (e.g. to catch a wildly off-topic or empty-ish
answer even if the Gemini call happens to fail) and is surfaced separately
rather than blended into the main score.
"""

import spacy

from app.services.gemini_service import GeminiError, generate_json

_nlp = None


def get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


def keyword_overlap_ratio(question: str, answer: str) -> float:
    """Fraction of the question's key terms (nouns/verbs/proper nouns,
    lemmatized, stopwords removed) that also appear in the answer."""
    nlp = get_nlp()
    if not answer.strip():
        return 0.0

    q_doc = nlp(question)
    a_doc = nlp(answer)

    q_terms = {
        tok.lemma_.lower()
        for tok in q_doc
        if not tok.is_stop and not tok.is_punct and tok.pos_ in ("NOUN", "PROPN", "VERB")
    }
    a_terms = {
        tok.lemma_.lower()
        for tok in a_doc
        if not tok.is_stop and not tok.is_punct
    }

    if not q_terms:
        return 1.0  # nothing meaningful to compare against; don't penalize

    overlap = q_terms & a_terms
    return round(len(overlap) / len(q_terms), 2)


def _build_evaluation_prompt(question: str, answer: str) -> str:
    return f"""You are an experienced technical interviewer scoring a candidate's answer.

QUESTION: {question}

CANDIDATE'S ANSWER: {answer}

Score the answer on these four dimensions, each from 0 to 10:
- correctness: is the technical content accurate?
- relevance: does it actually address the question asked?
- completeness: does it cover the key points a strong answer would include?
- communication: is it clearly structured and easy to follow?

Respond with ONLY valid JSON, no markdown fences, no commentary, in this exact shape:
{{
  "correctness": <0-10>,
  "relevance": <0-10>,
  "completeness": <0-10>,
  "communication": <0-10>,
  "justification": "one or two sentences explaining the scores"
}}"""


async def evaluate_answer(question: str, answer: str) -> dict:
    """Returns a dict matching EvaluationScores. Raises GeminiError on failure."""
    prompt = _build_evaluation_prompt(question, answer)
    result = await generate_json(prompt)

    required_keys = {"correctness", "relevance", "completeness", "communication", "justification"}
    if not required_keys.issubset(result.keys()):
        raise GeminiError(f"Evaluation response missing expected fields: {result}")

    for key in ("correctness", "relevance", "completeness", "communication"):
        result[key] = max(0, min(10, int(result[key])))

    return result