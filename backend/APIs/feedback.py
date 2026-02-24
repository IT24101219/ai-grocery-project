from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models.feedback import Feedback

router = APIRouter()

# Get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create feedback
@router.post("/feedback/")
def create_feedback(user_name: str, message: str, rating: int, db: Session = Depends(get_db)):
    feedback = Feedback(
        user_name=user_name,
        message=message,
        rating=rating
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


# Get all feedbacks
@router.get("/feedback/")
def get_feedbacks(db: Session = Depends(get_db)):
    return db.query(Feedback).all()


# Update feedback (only owner)
@router.put("/feedback/{feedback_id}")
def update_feedback(feedback_id: int, user_name: str, message: str, rating: int, db: Session = Depends(get_db)):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()

    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    if feedback.user_name != user_name:
        raise HTTPException(status_code=403, detail="Not allowed")

    feedback.message = message
    feedback.rating = rating

    db.commit()
    return feedback


# Delete feedback (owner or admin)
@router.delete("/feedback/{feedback_id}")
def delete_feedback(feedback_id: int, user_name: str, role: str, db: Session = Depends(get_db)):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()

    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    if feedback.user_name != user_name and role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    db.delete(feedback)
    db.commit()
    return {"message": "Deleted successfully"}


# Admin reply
@router.put("/feedback/reply/{feedback_id}")
def reply_feedback(feedback_id: int, reply: str, role: str, db: Session = Depends(get_db)):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can reply")

    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()

    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    feedback.reply = reply
    db.commit()
    return feedback