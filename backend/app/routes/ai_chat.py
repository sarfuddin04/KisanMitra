from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.ai_assistant import ask_agronomist_ai
from app.core.deps import get_optional_user
from app.models.user import User

router = APIRouter(prefix="/ai-assistant", tags=["AI Farming Assistant"])

class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    reply: str
    disclaimer: str = "This AI assistant provides general educational information and should not replace professional agricultural advice."

@router.post("/chat", response_model=ChatResponse)
def chat_with_agronomist(
    req: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user)
):
    history_dict = [{"sender": m.sender, "text": m.text} for m in req.history] if req.history else []
    reply = ask_agronomist_ai(user_message=req.message, chat_history=history_dict)
    return ChatResponse(reply=reply)
