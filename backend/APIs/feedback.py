from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import get_db
from models.feedback import Feedback

import joblib
import re
from pathlib import Path

# Load AI model (already trained)

model = joblib.load("feedback_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

def detect_offensive(message: str) -> str:
    """Return 'offensive' or 'normal'"""
    cleaned = message.lower()
    cleaned = re.sub(r"[^a-z0-9 ]", "", cleaned)
    vector = vectorizer.transform([cleaned])
    prediction = model.predict(vector)
    return prediction[0]

# Request / Response Schemas

class FeedbackCreate(BaseModel):
    user_name: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    rating: int = Field(..., ge=1, le=5)

class FeedbackUpdate(BaseModel):
    user_name: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    rating: int = Field(..., ge=1, le=5)

class FeedbackReply(BaseModel):
    reply: str = Field(..., min_length=1)

# Router

router = APIRouter(prefix="", tags=["Feedback Management"])

# Create Feedback (Customer)

@router.post("/feedback")
def create_feedback(payload: FeedbackCreate, role: str = Query("user"), db: Session = Depends(get_db)):
    # Only customers can create feedback
    if role != "user":
        raise HTTPException(status_code=403, detail="Only customers can create feedback")

    result = detect_offensive(payload.message)
    offensive_flag = (result == "offensive")

    new_feedback = Feedback(
        user_name=payload.user_name,
        message=payload.message,      #  keep original message in DB
        rating=payload.rating,
        offensive=offensive_flag
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    return new_feedback

# Get All Feedbacks (User/Admin)

@router.get("/feedback")
def get_feedbacks(db: Session = Depends(get_db)):
    return db.query(Feedback).order_by(Feedback.id.desc()).all()


# Update Feedback (Only Owner)

@router.put("/feedback/{feedback_id}")
def update_feedback(
    feedback_id: int,
    payload: FeedbackUpdate,
    role: str = Query("user"),
    db: Session = Depends(get_db)
):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    # Only owner + role=user can update
    if role != "user" or feedback.user_name != payload.user_name:
        raise HTTPException(status_code=403, detail="Not allowed to update this feedback")

    result = detect_offensive(payload.message)
    feedback.offensive = (result == "offensive")
    feedback.message = payload.message
    feedback.rating = payload.rating

    db.commit()
    db.refresh(feedback)
    return feedback


# Delete Feedback
# - customer: can delete only own feedback
# - admin: can delete only offensive feedback

@router.delete("/feedback/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    user_name: str = Query(""),    # user must send name
    role: str = Query("user"),
    db: Session = Depends(get_db)
):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    if role == "user":
        if feedback.user_name != user_name:
            raise HTTPException(status_code=403, detail="You can delete only your own feedback")
    elif role == "admin":
        if not feedback.offensive:
            raise HTTPException(status_code=403, detail="Admin can delete only offensive feedback")
    else:
        raise HTTPException(status_code=403, detail="Not allowed")

    db.delete(feedback)
    db.commit()
    return {"message": "Deleted successfully"}

#
# Admin Reply (optional)

@router.put("/feedback/{feedback_id}/reply")
def reply_feedback(
    feedback_id: int,
    payload: FeedbackReply,
    role: str = Query("admin"),
    db: Session = Depends(get_db)
):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can reply")

    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    feedback.reply = payload.reply
    db.commit()
    db.refresh(feedback)
    return feedback

#  AI Model Loading (Docker safe) + Backup Rule Detector

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/ (Docker: /app)
MODEL_PATH = BASE_DIR / "feedback_model.pkl"
VEC_PATH = BASE_DIR / "vectorizer.pkl"

model = None
vectorizer = None

try:
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VEC_PATH)
    print(f"✅ AI model loaded: {MODEL_PATH}")
    print(f"✅ Vectorizer loaded: {VEC_PATH}")
except Exception as e:
    print("❌ AI model/vectorizer load failed. Using backup detector.")
    print("Reason:", e)
    model = None
    vectorizer = None

# ✅ Backup bad word list (you can add more words)
BAD_WORDS = [
    "fuck", "shit", "bitch", "asshole", "stupid", "idiot", "bastard", "dumb"
]

def detect_offensive(message: str) -> str:
    """
    Returns: 'offensive' or 'normal'
    1) Use ML model if loaded
    2) Otherwise use backup bad-word detection
    """
    cleaned = message.lower()
    cleaned = re.sub(r"[^a-z0-9 ]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    #  1) ML model detection
    if model is not None and vectorizer is not None:
        try:
            vec = vectorizer.transform([cleaned])
            pred = model.predict(vec)[0]

            # Supports both "offensive"/"normal" or 1/0 output
            if pred == 1:
                return "offensive"
            if pred == 0:
                return "normal"
            if isinstance(pred, str):
                return pred.lower()

            return "normal"
        except Exception as e:
            print("❌ Prediction failed, using backup detector:", e)

    #  2) Backup detection (always works)
    for w in BAD_WORDS:
        if w in cleaned.split():
            return "offensive"

    return "normal"
