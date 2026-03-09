"""LLM model listing endpoint"""
from fastapi import APIRouter
from app.services.llm_service import LLMService

router = APIRouter()


@router.get("/models")
async def list_models():
    llm = LLMService()
    models = await llm.get_available_models()
    return models
