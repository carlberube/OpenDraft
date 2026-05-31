"""
AI generation request/response schemas
"""
from pydantic import BaseModel
from typing import Optional


class ScreenplayContext(BaseModel):
    """Context information from the screenplay editor"""
    selectedText: Optional[str] = None
    currentSceneText: Optional[str] = None
    nearbyText: Optional[str] = None
    documentTitle: Optional[str] = None


class GenerateScreenplayContentRequest(BaseModel):
    """Request to generate screenplay content"""
    prompt: str
    context: Optional[ScreenplayContext] = None


class GenerateScreenplayContentResponse(BaseModel):
    """Response containing generated screenplay content"""
    fountain: str
    explanation: Optional[str] = None
    warnings: Optional[list[str]] = None
