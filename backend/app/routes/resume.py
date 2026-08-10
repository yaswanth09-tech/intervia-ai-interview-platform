from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.core.deps import get_current_user
from app.db import resumes_collection
from app.models.resume import ParsedResume, ResumeOut
from app.models.user import UserOut
from app.services.resume_parser import parse_resume_pdf

router = APIRouter(prefix="/resume", tags=["resume"])

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/upload", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile,
    current_user: UserOut = Depends(get_current_user),
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is too large. Max size is 5MB.",
        )

    try:
        parsed = parse_resume_pdf(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse resume. Please try a different file.",
        )

    resume_doc = {
        "user_id": current_user.id,
        "filename": file.filename,
        "parsed": parsed,
        "created_at": datetime.now(timezone.utc),
    }
    result = await resumes_collection.insert_one(resume_doc)

    return ResumeOut(
        id=str(result.inserted_id),
        user_id=current_user.id,
        filename=file.filename,
        parsed=ParsedResume(**parsed),
        created_at=resume_doc["created_at"],
    )


@router.get("/{resume_id}", response_model=ResumeOut)
async def get_resume(resume_id: str, current_user: UserOut = Depends(get_current_user)):
    try:
        object_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    doc = await resumes_collection.find_one({"_id": object_id, "user_id": current_user.id})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    return ResumeOut(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        filename=doc["filename"],
        parsed=ParsedResume(**doc["parsed"]),
        created_at=doc["created_at"],
    )
