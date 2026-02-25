from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models.feedback import Feedback

router = APIRouter()

# DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



# Create Feedback (Customer)

@router.post("/feedback/")
def create_feedback(user_name: str, message: str, rating: int, role: str = "user", db: Session = Depends(get_db)):
    # Only customer can create feedback
    if role != "user":
        raise HTTPException(status_code=403, detail="Only customers can create feedback")

    new_feedback = Feedback(
        user_name=user_name,
        message=message,
        rating=rating,
        role=role
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    return new_feedback



# Get All Feedbacks (Everyone can view)

@router.get("/feedback/")
def get_feedbacks(db: Session = Depends(get_db)):
    return db.query(Feedback).all()

# Update Feedback (Only owner)

@router.put("/feedback/{feedback_id}")
def update_feedback(feedback_id: int, user_name: str, message: str, rating: int, role: str = "user", db: Session = Depends(get_db)):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    # Only the customer who created the feedback can update it
    if feedback.user_name != user_name or role != "user":
        raise HTTPException(status_code=403, detail="Not allowed to update this feedback")

    feedback.message = message
    feedback.rating = rating
    db.commit()
    return feedback

# Delete Feedback

@router.delete("/feedback/{feedback_id}")
def delete_feedback(feedback_id: int, user_name: str, role: str = "user", db: Session = Depends(get_db)):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    if role == "user":
        # Customer can delete only their own feedback
        if feedback.user_name != user_name:
            raise HTTPException(status_code=403, detail="Customers can delete only their own feedback")
    elif role == "admin":
        # Admin can delete only offensive feedbacks
        if not feedback.offensive:
            raise HTTPException(status_code=403, detail="Admin can delete only offensive feedbacks")
    else:
        # Anyone else not allowed
        raise HTTPException(status_code=403, detail="Not allowed to delete this feedback")

    db.delete(feedback)
    db.commit()
    return {"message": "Deleted successfully"}



# Admin Reply

@router.put("/feedback/reply/{feedback_id}")
def reply_feedback(feedback_id: int, reply: str, role: str, db: Session = Depends(get_db)):
    # Only admin can reply
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can reply")

    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    feedback.reply = reply
    db.commit()
    return feedback