from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from app.services.ai_assistant import ask_agronomist_ai
from app.core.deps import get_optional_user
from app.models.user import User

router = APIRouter(prefix="/ai-assistant", tags=["AI Farming Assistant"])


class ChatMessage(BaseModel):
    sender: str = Field(..., description="'user' or 'bot'")
    text: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    message: str = Field(..., description="Current user message", min_length=1)
    history: Optional[List[ChatMessage]] = Field(
        default=[],
        description="Previous conversation messages for context continuity"
    )


class ChatResponse(BaseModel):
    reply: str
    disclaimer: str = (
        "AI सलाहकार सामान्य शैक्षिक जानकारी देता है। रासायनिक दवाओं और खाद की "
        "सही मात्रा के लिए अपने नज़दीकी KVK (Krishi Vigyan Kendra) से ज़रूर सलाह लें।"
    )


@router.post("/chat", response_model=ChatResponse)
def chat_with_agronomist(
    req: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Conversational AI agriculture advisor endpoint.
    Accepts user message + chat history for context-aware responses.
    """
    history_dict = (
        [{"sender": m.sender, "text": m.text} for m in req.history]
        if req.history
        else []
    )
    reply = ask_agronomist_ai(
        user_message=req.message,
        chat_history=history_dict
    )
    return ChatResponse(reply=reply)
