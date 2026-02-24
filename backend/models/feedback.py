from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False)
    reply = Column(Text, nullable=True)
    role = Column(String, default="user")  # user or admin