"""
Service to generate comprehensive feedback and personalized learning roadmaps
based on candidate performance in MCQ and Descriptive rounds using Gemini API.
"""

from app.services.gemini_service import GeminiError, generate_json


def _build_feedback_prompt(
    difficulty: str,
    mcq_summary: str,
    mcq_mistakes_summary: str,
    descriptive_summary: str,
    skipped_summary: str,
) -> str:
    return f"""You are an expert technical career mentor and interviewer analyzing a candidate's complete technical interview results.

INTERVIEW DIFFICULTY: {difficulty}

MCQ PERFORMANCE SUMMARY:
{mcq_summary}

MCQ QUESTIONS THE CANDIDATE GOT WRONG (this is the real signal for weak topics — use it):
{mcq_mistakes_summary}

DESCRIPTIVE INTERVIEW EVALUATION:
{descriptive_summary}

SKIPPED QUESTIONS / TOPICS:
{skipped_summary}

Analyze the candidate's performance and provide:
1. Strengths: 3-5 specific technical skills or topics where the candidate performed well.
2. Weak Topics: 3-5 specific technical topics where the candidate struggled or gave incomplete
   answers. Each weak topic must be traceable to a specific MCQ mistake or a low-scoring
   descriptive answer above — do not invent weak topics that aren't backed by the data given.
3. Skipped Topics: Topics of skipped questions.
4. Suggestions: 3-4 actionable pieces of advice to improve their interview performance, tied
   directly to the actual mistakes listed above (e.g. if they picked the wrong answer about X,
   the suggestion should address X specifically, not generic advice).
5. Learning Roadmap: A 4 to 6 step structured learning roadmap. Each step should target one of
   the specific weak topics identified from their real mistakes above, in rough priority order
   (topics behind the most/most fundamental mistakes first). Do not include a roadmap step for
   a topic the candidate already answered correctly or scored well on.

Respond with ONLY valid JSON, no markdown fences, no commentary, in this exact structure:
{{
  "strengths": ["...", "..."],
  "weak_topics": ["...", "..."],
  "skipped_topics": ["...", "..."],
  "suggestions": ["...", "..."],
  "roadmap": [
    {{
      "step": 1,
      "topic": "Topic Name",
      "description": "Clear explanation of what to study and practice",
      "target_skill_level": "Intermediate",
      "recommended_resources": ["Resource or concept 1", "Resource or concept 2"]
    }}
  ]
}}"""


def _summarize_mcq_mistakes(mcq_results: dict | None, mcq_questions: list[dict] | None) -> str:
    """
    Build a human-readable summary of exactly which MCQs the candidate got wrong,
    including the question text, what they picked, and the correct answer.

    Without this, the feedback prompt only ever saw an aggregate percentage
    (e.g. "6/10 correct") with no way to know *which* concepts the wrong answers
    came from — so weak topics and the roadmap were effectively guesses.
    """
    if not mcq_results:
        return "No MCQ results recorded."

    question_results = mcq_results.get("question_results", [])
    wrong_results = [r for r in question_results if not r.get("correct")]

    if not wrong_results:
        return "None — the candidate answered all MCQs correctly."

    questions_by_id = {q["id"]: q for q in (mcq_questions or [])}

    lines = []
    for r in wrong_results:
        q = questions_by_id.get(r.get("question_id"))
        question_text = q["question"] if q else "(question text unavailable)"
        selected = r.get("selected") or "(not answered)"
        correct_answer = r.get("correct_answer", "unknown")
        lines.append(
            f"- Question: {question_text}\n"
            f"  Candidate answered: {selected}\n"
            f"  Correct answer: {correct_answer}"
        )

    return "\n".join(lines)


async def generate_feedback_and_roadmap(
    difficulty: str,
    mcq_results: dict | None,
    evaluations: list[dict],
    mcq_questions: list[dict] | None = None,
) -> dict:
    """
    Generates structured feedback & roadmap dictionary from Gemini.

    `mcq_questions` should be the session's full MCQ bank (id, question, options,
    correct_answer) so wrong answers can be traced back to what was actually
    asked, not just an aggregate score.
    """
    # 1. Summarize MCQ performance
    if mcq_results:
        correct_count = mcq_results.get("correct_count", 0)
        total_questions = mcq_results.get("total_questions", 1)
        mcq_pct = round((correct_count / total_questions) * 100, 1)
        mcq_summary = f"Scored {correct_count}/{total_questions} ({mcq_pct}%) on MCQs."
    else:
        mcq_pct = 0.0
        mcq_summary = "MCQ round results not recorded."

    mcq_mistakes_summary = _summarize_mcq_mistakes(mcq_results, mcq_questions)

    # 2. Summarize Descriptive evaluations
    desc_summaries = []
    skipped_topics = []
    desc_scores_list = []

    # Total number of descriptive questions the candidate was actually given
    # (answered + skipped). Used below so a fully- or partially-skipped round
    # is scored against the full question count, not just the attempted ones —
    # otherwise skipping every descriptive question costs nothing.
    total_descriptive_questions = len(evaluations)

    for ev in evaluations:
        q_text = ev.get("question", "")
        if ev.get("was_skipped"):
            skipped_topics.append(q_text)
            continue

        scores = ev.get("scores") or {}
        c = scores.get("correctness", 0)
        r = scores.get("relevance", 0)
        comp = scores.get("completeness", 0)
        comm = scores.get("communication", 0)
        avg = (c + r + comp + comm) / 4.0
        desc_scores_list.append(avg)

        just = scores.get("justification", "")
        ans_text = ev.get("answer_text") or "(No answer)"
        desc_summaries.append(
            f"- Question: {q_text}\n  Answer: {ans_text[:150]}...\n  Scores (0-10): Correctness={c}, Relevance={r}, Completeness={comp}, Communication={comm}\n  Notes: {just}"
        )

    # Score skipped questions as 0 rather than excluding them, so the
    # descriptive percentage reflects the whole round the candidate was
    # given — not just the subset they chose to answer.
    if total_descriptive_questions:
        desc_pct = round((sum(desc_scores_list) / (total_descriptive_questions * 10)) * 100, 1)
    else:
        desc_pct = 0.0

    # Distinguish "scored 0% because they answered and did badly" from
    # "no descriptive round happened at all" — the latter should not drag
    # overall_score down, the former should.
    had_descriptive_round = total_descriptive_questions > 0

    desc_text = "\n".join(desc_summaries) if desc_summaries else "No descriptive questions answered."
    skipped_text = "\n".join(f"- {t}" for t in skipped_topics) if skipped_topics else "None."

    # 3. Call Gemini
    prompt = _build_feedback_prompt(difficulty, mcq_summary, mcq_mistakes_summary, desc_text, skipped_text)

    try:
        raw_result = await generate_json(prompt)
    except GeminiError as e:
        # Fallback response in case Gemini API fails
        raw_result = {
            "strengths": ["Completed technical interview session"],
            "weak_topics": ["General technical depth"],
            "skipped_topics": skipped_topics,
            "suggestions": ["Review fundamental concepts and practice descriptive answers."],
            "roadmap": [
                {
                    "step": 1,
                    "topic": "Core Fundamentals",
                    "description": "Review core theoretical concepts and practice explaining them clearly.",
                    "target_skill_level": "Intermediate",
                    "recommended_resources": ["Official Documentation", "MDN / LeetCode"]
                }
            ]
        }

    # 4. Calculate overall score (40% MCQ, 60% Descriptive)
    #
    # Previously this branched on `desc_scores_list` (only populated by
    # *answered* descriptive questions), so a fully-skipped descriptive round
    # made `desc_scores_list == []` and silently fell through to
    # `overall_score = mcq_pct` — i.e. skipping every descriptive question
    # was completely free and Overall Score just mirrored the MCQ score.
    #
    # Now it branches on whether a descriptive round existed at all
    # (`had_descriptive_round`), and `desc_pct` already treats skipped
    # questions as 0 (see above), so a skipped round correctly drags the
    # composite score down instead of being ignored.
    if mcq_results and had_descriptive_round:
        overall_score = round((mcq_pct * 0.4) + (desc_pct * 0.6), 1)
    elif mcq_results:
        overall_score = mcq_pct
    elif had_descriptive_round:
        overall_score = desc_pct
    else:
        overall_score = 0.0

    return {
        "overall_score": overall_score,
        "mcq_score_percentage": mcq_pct,
        "descriptive_score_percentage": desc_pct,
        "strengths": raw_result.get("strengths", []),
        "weak_topics": raw_result.get("weak_topics", []),
        "skipped_topics": raw_result.get("skipped_topics", skipped_topics),
        "suggestions": raw_result.get("suggestions", []),
        "roadmap": raw_result.get("roadmap", []),
    }