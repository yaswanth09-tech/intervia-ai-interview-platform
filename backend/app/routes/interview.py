import json
import os
import tempfile
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.core.deps import get_current_user
from app.db import resumes_collection, sessions_collection
from app.models.answer import (
    AnswerType,
    DescriptiveAnswerOut,
    SkipQuestionRequest,
    SubmitTextAnswerRequest,
)
from app.models.interview import (
    DIFFICULTY_CONFIG,
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
)
from app.models.mcq import MCQAnswer, MCQRoundResults, MCQScore, SubmitMCQAnswersRequest
from app.models.user import UserOut
from app.services.gemini_service import GeminiError, generate_json
from app.services.stt_service import transcribe_audio

from app.models.evaluation import (
    EvaluateSessionRequest,
    EvaluateSessionResponse,
    EvaluationScores,
    QuestionEvaluation,
)
from app.models.feedback import FeedbackSection, FullInterviewReport, RoadmapItem
from app.services.evaluation_service import evaluate_answer, keyword_overlap_ratio
from app.services.feedback_service import generate_feedback_and_roadmap

router = APIRouter(prefix="/interview", tags=["interview"])

MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB


def _build_question_prompt(resume: dict, difficulty: str, mcq_count: int, descriptive_count: int) -> str:
    skills_list = resume.get("skills", [])
    projects_list = resume.get("projects", [])

    # Numbered so the model treats each skill as an individually addressable item
    # rather than a single blob of text it can skim past in favor of the more
    # narrative project descriptions.
    skills = "\n".join(f"  {i+1}. {s}" for i, s in enumerate(skills_list)) or "  not specified"
    projects = "; ".join(projects_list) or "not specified"

    experience_summaries = []
    for exp in resume.get("experience", []):
        org = exp.get("organization") or "an organization"
        details = "; ".join(exp.get("details", [])[:3])
        experience_summaries.append(f"{org}: {details}")
    experience_text = " | ".join(experience_summaries) or "not specified"

    total_questions = mcq_count + descriptive_count
    # Aim for roughly half the question set testing skills directly, so a resume
    # with a long project write-up doesn't crowd out the skills list entirely.
    min_skill_questions = max(1, round(total_questions * 0.5))

    return f"""You are a senior engineer at a tech company, sitting across from a candidate in a
real technical interview. You ask sharp, specific questions because you actually want to know
how they think and what they've built — not because you're running through a checklist.

CANDIDATE BACKGROUND

Skills (each one is a distinct, individually testable topic):
{skills}

Experience: {experience_text}

Projects: {projects}

DIFFICULTY: {difficulty}

Generate exactly {mcq_count} multiple-choice questions and exactly {descriptive_count}
open-ended descriptive questions, for a total of {total_questions} questions.

QUESTION SOURCE BALANCE — this is important, follow it strictly:
- At least {min_skill_questions} of the {total_questions} questions must be SKILL questions:
  they test the candidate's understanding of a specific listed skill/technology/concept on
  its own merits (e.g. "How does X handle Y", "What's the difference between A and B",
  "When would you choose X over Z"). A skill question does NOT need to reference any
  specific project by name.
- Spread skill questions across DIFFERENT skills from the list above — do not write more
  than 1-2 questions about the same skill. If there are more skills than questions allow,
  prioritize the skills most central to the candidate's apparent role.
- The remaining questions may be PROJECT or EXPERIENCE questions that dig into a specific
  project/role by name (e.g. "In your X project, why did you choose...").
- Do not let project-specific questions dominate the set. If projects are detailed but
  skills are sparse, still prioritize hitting distinct skills before writing a second
  question about the same project.
- If the resume gives little to work with, fall back to solid general questions for the
  candidate's apparent field, but prefer resume-specific questions whenever possible.

CODE QUESTIONS — do not skip this if any programming language is listed as a skill:
- If the skills list includes one or more programming languages (e.g. Python, JavaScript,
  Java, C++, SQL, etc.), a meaningful portion of the SKILL questions must involve actual
  code, not just talking about the language in the abstract.
- For MCQs based on a programming language: write a short, real code snippet (a few lines)
  directly inside the "question" text, and ask what it outputs, what's wrong with it, what it
  evaluates to, or which option correctly completes it. Format the snippet clearly on its own
  lines within the question string so it's readable.
- For descriptive questions based on a programming language: ask the candidate to write a
  short function/query, fix a bug in a given snippet, explain what a given piece of code does
  and why, or compare two ways of solving the same small problem in that language.
- Match difficulty to the requested level: {difficulty} should mean beginner-friendly syntax
  and common patterns for "easy", real-world edge cases and moderate algorithms for "medium",
  and non-trivial logic, performance tradeoffs, or subtle bugs for "hard".
- Don't let every code question be about the same language if multiple are listed — spread
  them across the different programming languages/technologies the candidate knows.
- Questions about non-language skills (frameworks, tools, concepts, cloud services, etc.) can
  stay conceptual as before — this section only applies when the skill itself is a language.

VOICE — write like a human interviewer, not a quiz generator:
- Sound like something a real person would actually say out loud in an interview room, not
  a textbook definition or an exam prompt. Read each question back to yourself and ask: would
  a senior engineer actually phrase it this way in conversation?
- Vary your sentence openers. Do NOT start every project question with the same template
  (e.g. "In your X project, how did you..."). Mix in phrasings like "Walk me through...",
  "Say your team asked you to...", "What made you choose...", "You mentioned X — what
  happened when...", "Suppose you had to...", "What would you do differently if...".
- Reference project names naturally, the way a person glancing at a resume would — not in
  a rigid "In your 'ProjectName' project" formula every single time. It's fine to just say
  the project name plainly, or describe what it does instead of naming it every time.
- Avoid stiff, generic interview-textbook phrasing like "Explain the concept of X" or
  "Describe the process of Y." Ask the way someone curious and specific would ask.
- For MCQs, write options that sound like plausible real answers a candidate might guess or
  reason toward — not a random grab-bag of unrelated terms. Wrong options should be
  believable enough to actually test understanding, not obviously fake.
- Keep it natural, not padded — no throat-clearing like "As you may know" or "It is
  important to understand that" before getting to the actual question.

Respond with ONLY valid JSON matching this exact shape, no markdown fences, no commentary:
{{
  "mcqs": [
    {{"question": "...", "options": ["...", "...", "...", "..."], "correct_answer": "..."}}
  ],
  "descriptive": [
    {{"question": "...", "topic": "..."}}
  ]
}}

Rules:
- Each MCQ must have exactly 4 options, and correct_answer must exactly match one of them.
- Descriptive questions should be answerable in 2-5 sentences, not one-word answers.
- Do not repeat the same concept across multiple questions.
- Do not reuse the same sentence opener or question template more than twice across the
  whole set.
- If a "question" value contains a code snippet, it must still be a single valid JSON string
  (use \\n for line breaks within the snippet, no unescaped quotes) — do not break the JSON
  structure to make code "look nicer"."""


@router.post("/generate-questions", response_model=GenerateQuestionsResponse, status_code=status.HTTP_201_CREATED)
async def generate_questions(
    payload: GenerateQuestionsRequest,
    current_user: UserOut = Depends(get_current_user),
):
    try:
        resume_object_id = ObjectId(payload.resume_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    resume_doc = await resumes_collection.find_one(
        {"_id": resume_object_id, "user_id": current_user.id}
    )
    if resume_doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    config = DIFFICULTY_CONFIG[payload.difficulty]
    prompt = _build_question_prompt(
        resume_doc["parsed"], payload.difficulty.value, config["mcq_count"], config["descriptive_count"]
    )

    try:
        result = await generate_json(prompt)
    except GeminiError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Question generation failed: {e}",
        )

    mcqs_raw = result.get("mcqs", [])
    descriptive_raw = result.get("descriptive", [])

    if len(mcqs_raw) == 0 or len(descriptive_raw) == 0:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini returned an incomplete question set. Please try again.",
        )

    mcqs = [
        {
            "id": str(uuid.uuid4()),
            "question": q["question"],
            "options": q["options"],
            "correct_answer": q["correct_answer"],
        }
        for q in mcqs_raw
    ]
    descriptive = [
        {"id": str(uuid.uuid4()), "question": q["question"], "topic": q.get("topic", "")}
        for q in descriptive_raw
    ]

    session_doc = {
        "user_id": current_user.id,
        "resume_id": payload.resume_id,
        "difficulty": payload.difficulty.value,
        "mcqs": mcqs,
        "descriptive": descriptive,
        "created_at": datetime.now(timezone.utc),
    }
    result_insert = await sessions_collection.insert_one(session_doc)

    return GenerateQuestionsResponse(
        session_id=str(result_insert.inserted_id),
        difficulty=payload.difficulty,
        mcq_count=len(mcqs),
        descriptive_count=len(descriptive),
        created_at=session_doc["created_at"],
    )


@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    current_user: UserOut = Depends(get_current_user),
):
    """Retrieve session details (MCQs and Descriptive questions) for the candidate."""
    session_doc = await _get_owned_session(session_id, current_user.id)
    mcqs_public = [
        {
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
        }
        for q in session_doc.get("mcqs", [])
    ]
    return {
        "session_id": str(session_doc["_id"]),
        "difficulty": session_doc.get("difficulty"),
        "mcqs": mcqs_public,
        "descriptive": session_doc.get("descriptive", []),
        "created_at": session_doc.get("created_at"),
    }


@router.post("/mcq/submit", response_model=MCQRoundResults)
async def submit_mcq_answers(
    payload: SubmitMCQAnswersRequest,
    current_user: UserOut = Depends(get_current_user),
):
    """Submit MCQ answers, score them, and store results in session document."""
    session_doc = await _get_owned_session(payload.session_id, current_user.id)
    mcqs = {q["id"]: q for q in session_doc.get("mcqs", [])}

    results = []
    correct_count = 0

    for user_ans in payload.answers:
        q_id = user_ans.question_id
        q_obj = mcqs.get(q_id)
        if not q_obj:
            continue

        is_correct = (user_ans.selected_option == q_obj["correct_answer"])
        if is_correct:
            correct_count += 1

        results.append({
            "question_id": q_id,
            "selected": user_ans.selected_option,
            "correct_answer": q_obj["correct_answer"],
            "correct": is_correct,
        })

    total_questions = len(mcqs)
    pct = (correct_count / total_questions * 100) if total_questions > 0 else 0.0

    mcq_results_dict = {
        "score_percentage": pct,
        "correct_count": correct_count,
        "total_questions": total_questions,
        "question_results": results,
    }

    await sessions_collection.update_one(
        {"_id": ObjectId(payload.session_id)},
        {"$set": {"mcq_results": mcq_results_dict}},
    )

    return MCQRoundResults(**mcq_results_dict)


async def _get_owned_session(session_id: str, user_id: str) -> dict:
    try:
        session_object_id = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session_doc = await sessions_collection.find_one(
        {"_id": session_object_id, "user_id": user_id}
    )
    if session_doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session_doc


def _validate_question_belongs_to_session(session_doc: dict, question_id: str) -> None:
    descriptive_ids = {q["id"] for q in session_doc.get("descriptive", [])}
    if question_id not in descriptive_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This question does not belong to the given session.",
        )


async def _store_descriptive_answer(
    session_id: str, question_id: str, answer_type: AnswerType, answer_text: str | None
) -> DescriptiveAnswerOut:
    answered_at = datetime.now(timezone.utc)
    await sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                f"descriptive_answers.{question_id}": {
                    "answer_type": answer_type.value,
                    "answer_text": answer_text,
                    "answered_at": answered_at,
                }
            }
        },
    )
    return DescriptiveAnswerOut(
        question_id=question_id,
        answer_type=answer_type,
        answer_text=answer_text,
        answered_at=answered_at,
    )


@router.post("/answer/text", response_model=DescriptiveAnswerOut)
async def submit_text_answer(
    payload: SubmitTextAnswerRequest,
    current_user: UserOut = Depends(get_current_user),
):
    session_doc = await _get_owned_session(payload.session_id, current_user.id)
    _validate_question_belongs_to_session(session_doc, payload.question_id)

    if not payload.answer_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Answer cannot be empty.")

    return await _store_descriptive_answer(
        payload.session_id, payload.question_id, AnswerType.text, payload.answer_text.strip()
    )


@router.post("/answer/voice", response_model=DescriptiveAnswerOut)
async def submit_voice_answer(
    session_id: str,
    question_id: str,
    file: UploadFile,
    current_user: UserOut = Depends(get_current_user),
):
    session_doc = await _get_owned_session(session_id, current_user.id)
    _validate_question_belongs_to_session(session_doc, question_id)

    audio_bytes = await file.read()
    if len(audio_bytes) > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audio file too large (max 15MB).")
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty audio file.")

    suffix = os.path.splitext(file.filename or "")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        transcript = transcribe_audio(tmp_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Transcription failed: {e}",
        )
    finally:
        os.unlink(tmp_path)

    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not transcribe any speech from that recording. Try again.",
        )

    return await _store_descriptive_answer(session_id, question_id, AnswerType.voice, transcript)


@router.post("/answer/skip", response_model=DescriptiveAnswerOut)
async def skip_question(
    payload: SkipQuestionRequest,
    current_user: UserOut = Depends(get_current_user),
):
    session_doc = await _get_owned_session(payload.session_id, current_user.id)
    _validate_question_belongs_to_session(session_doc, payload.question_id)

    return await _store_descriptive_answer(
        payload.session_id, payload.question_id, AnswerType.skip, None
    )  
@router.post("/evaluate", response_model=EvaluateSessionResponse)
async def evaluate_session(
    payload: EvaluateSessionRequest,
    current_user: UserOut = Depends(get_current_user),
):
    """Evaluate every answered (non-skipped) descriptive answer in a session."""
    session_doc = await _get_owned_session(payload.session_id, current_user.id)

    descriptive_questions = {q["id"]: q for q in session_doc.get("descriptive", [])}
    stored_answers = session_doc.get("descriptive_answers", {})

    evaluations: list[QuestionEvaluation] = []

    for question_id, question in descriptive_questions.items():
        answer_record = stored_answers.get(question_id)

        if answer_record is None:
            evaluations.append(QuestionEvaluation(
                question_id=question_id,
                question=question["question"],
                answer_text=None,
                was_skipped=True,
                scores=None,
                keyword_overlap_ratio=None,
            ))
            continue

        if answer_record.get("answer_type") == "skip":
            evaluations.append(QuestionEvaluation(
                question_id=question_id,
                question=question["question"],
                answer_text=None,
                was_skipped=True,
                scores=None,
                keyword_overlap_ratio=None,
            ))
            continue

        answer_text = answer_record.get("answer_text", "")
        overlap = keyword_overlap_ratio(question["question"], answer_text)

        try:
            score_dict = await evaluate_answer(question["question"], answer_text)
        except GeminiError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Evaluation failed for a question: {e}",
            )

        evaluations.append(QuestionEvaluation(
            question_id=question_id,
            question=question["question"],
            answer_text=answer_text,
            was_skipped=False,
            scores=EvaluationScores(**score_dict),
            keyword_overlap_ratio=overlap,
        ))

    evaluated_at = datetime.now(timezone.utc)

    await sessions_collection.update_one(
        {"_id": ObjectId(payload.session_id)},
        {
            "$set": {
                "evaluations": [e.model_dump() for e in evaluations],
                "evaluated_at": evaluated_at,
            }
        },
    )

    return EvaluateSessionResponse(
        session_id=payload.session_id,
        evaluations=evaluations,
        evaluated_at=evaluated_at,
    )


@router.get("/results-full/{session_id}", response_model=FullInterviewReport)
async def get_full_interview_report(
    session_id: str,
    current_user: UserOut = Depends(get_current_user),
):
    """Retrieve or generate the complete interview report including overall score, feedback, and learning roadmap."""
    session_doc = await _get_owned_session(session_id, current_user.id)

    # Check if report is already generated and cached
    if "full_report" in session_doc:
        rep = session_doc["full_report"]
        return FullInterviewReport(
            session_id=session_id,
            user_id=current_user.id,
            difficulty=session_doc.get("difficulty", "medium"),
            feedback=FeedbackSection(**rep["feedback"]),
            roadmap=[RoadmapItem(**r) for r in rep["roadmap"]],
            generated_at=rep.get("generated_at", datetime.now(timezone.utc)),
        )

    # If evaluations don't exist yet, evaluate descriptive session now
    evaluations = session_doc.get("evaluations")
    if not evaluations:
        eval_resp = await evaluate_session(
            EvaluateSessionRequest(session_id=session_id), current_user=current_user
        )
        evaluations = [e.model_dump() for e in eval_resp.evaluations]

    mcq_results = session_doc.get("mcq_results")
    difficulty = session_doc.get("difficulty", "medium")

    feedback_data = await generate_feedback_and_roadmap(
        difficulty=difficulty,
        mcq_results=mcq_results,
        evaluations=evaluations,
        mcq_questions=session_doc.get("mcqs", []),
    )

    feedback_section = FeedbackSection(
        overall_score=feedback_data["overall_score"],
        mcq_score_percentage=feedback_data["mcq_score_percentage"],
        descriptive_score_percentage=feedback_data["descriptive_score_percentage"],
        strengths=feedback_data["strengths"],
        weak_topics=feedback_data["weak_topics"],
        skipped_topics=feedback_data["skipped_topics"],
        suggestions=feedback_data["suggestions"],
    )

    roadmap_items = [RoadmapItem(**r) for r in feedback_data["roadmap"]]

    generated_at = datetime.now(timezone.utc)
    report_dict = {
        "feedback": feedback_section.model_dump(),
        "roadmap": [r.model_dump() for r in roadmap_items],
        "generated_at": generated_at,
    }

    # Save cached report to MongoDB session doc
    await sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"full_report": report_dict}},
    )

    return FullInterviewReport(
        session_id=session_id,
        user_id=current_user.id,
        difficulty=difficulty,
        feedback=feedback_section,
        roadmap=roadmap_items,
        generated_at=generated_at,
    )


@router.get("/history")
async def get_interview_history(
    current_user: UserOut = Depends(get_current_user),
):
    """List recent interview sessions for the logged-in candidate."""
    cursor = sessions_collection.find({"user_id": current_user.id}).sort("created_at", -1).limit(10)
    docs = await cursor.to_list(length=10)

    history = []
    for d in docs:
        full_rep = d.get("full_report", {})
        overall_score = full_rep.get("feedback", {}).get("overall_score")
        history.append({
            "session_id": str(d["_id"]),
            "difficulty": d.get("difficulty", "medium"),
            "created_at": d.get("created_at"),
            "overall_score": overall_score,
            "status": "Completed" if full_rep else "In Progress",
        })

    return history