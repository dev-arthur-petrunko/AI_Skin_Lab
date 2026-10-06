"""AI consultant chat endpoint (RAG)."""
from fastapi import APIRouter

from .. import ai_assistant
from ..models import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest):
    reply, products = ai_assistant.chat(payload.message, payload.lang, payload.history)
    return ChatResponse(reply=reply, products=products)
