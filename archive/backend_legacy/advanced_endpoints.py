"""
Advanced Features API Endpoints
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from pydantic import BaseModel

from ai_integration import ai_service, CodeAnalysisRequest, AIMentorRequest
from voice_features import voice_service
from realtime_sync import websocket_manager, realtime_sync
from certificate_system import certificate_service

router = APIRouter(prefix="/api/v1/advanced", tags=["Advanced Features"])

# AI Integration Endpoints
@router.post("/ai/analyze-code")
async def analyze_code(request: CodeAnalysisRequest):
    """Analyze code with AI"""
    try:
        result = await ai_service.analyze_code(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code analysis failed: {str(e)}"
        )

@router.post("/ai/mentor")
async def get_ai_mentor(request: AIMentorRequest):
    """Get AI mentor assistance"""
    try:
        result = await ai_service.get_ai_mentor(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI mentor failed: {str(e)}"
        )

@router.post("/ai/generate-code")
async def generate_code_suggestion(problem: str, language: str = "python"):
    """Generate code suggestion"""
    try:
        suggestion = await ai_service.generate_code_suggestion(problem, language)
        return {"suggestion": suggestion}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code generation failed: {str(e)}"
        )

@router.post("/ai/explain-code")
async def explain_code(code: str, language: str = "python"):
    """Explain code"""
    try:
        explanation = await ai_service.explain_code(code, language)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code explanation failed: {str(e)}"
        )

# Voice Features Endpoints
@router.post("/voice/speech-to-text")
async def speech_to_text(audio_data: bytes, language: str = "en-US"):
    """Convert speech to text"""
    try:
        result = await voice_service.speech_to_text(audio_data, language)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech to text failed: {str(e)}"
        )

@router.post("/voice/text-to-speech")
async def text_to_speech(text: str, language: str = "en-US", voice: str = "female"):
    """Convert text to speech"""
    try:
        audio_data = await voice_service.text_to_speech(text, language, voice)
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text to speech failed: {str(e)}"
        )

@router.post("/voice/pronunciation-analysis")
async def analyze_pronunciation(audio_data: bytes, reference_text: str, language: str = "en-US"):
    """Analyze speech pronunciation"""
    try:
        result = await voice_service.analyze_speech_pronunciation(audio_data, reference_text, language)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pronunciation analysis failed: {str(e)}"
        )

@router.post("/voice/translate-speech")
async def translate_speech(audio_data: bytes, source_language: str, target_language: str):
    """Translate speech from one language to another"""
    try:
        result = await voice_service.translate_speech(audio_data, source_language, target_language)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech translation failed: {str(e)}"
        )

@router.get("/voice/languages")
async def get_supported_languages():
    """Get supported languages"""
    try:
        return voice_service.get_language_info()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get language info: {str(e)}"
        )

# Certificate System Endpoints
@router.post("/certificates/issue")
async def issue_certificate(
    user_id: str,
    user_name: str,
    course_name: str,
    completion_date: datetime,
    template_type: str = "course_completion"
):
    """Issue a new certificate"""
    try:
        certificate = await certificate_service.issue_certificate(
            user_id, user_name, course_name, completion_date, template_type
        )
        return certificate
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Certificate issuance failed: {str(e)}"
        )

@router.post("/certificates/{certificate_id}/verify")
async def verify_certificate(certificate_id: str):
    """Verify certificate authenticity"""
    try:
        verification = await certificate_service.verify_certificate(certificate_id)
        return verification
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Certificate verification failed: {str(e)}"
        )

@router.get("/certificates/{certificate_id}/pdf")
async def get_certificate_pdf(certificate_id: str):
    """Get certificate PDF"""
    try:
        pdf_data = await certificate_service.get_certificate_pdf(certificate_id)
        if pdf_data is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certificate not found"
            )
        
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=certificate_{certificate_id}.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get certificate PDF: {str(e)}"
        )

@router.get("/certificates/user/{user_id}")
async def get_user_certificates(user_id: str):
    """Get all certificates for a user"""
    try:
        certificates = await certificate_service.get_user_certificates(user_id)
        return {"certificates": certificates}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user certificates: {str(e)}"
        )

@router.post("/certificates/{certificate_id}/revoke")
async def revoke_certificate(certificate_id: str, reason: str):
    """Revoke a certificate"""
    try:
        result = await certificate_service.revoke_certificate(certificate_id, reason)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Certificate revocation failed: {str(e)}"
        )

# WebSocket endpoint for real-time features
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time features"""
    await websocket_manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle message
            await websocket_manager.handle_message(user_id, message)
            
    except WebSocketDisconnect:
        await websocket_manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {str(e)}")
        await websocket_manager.disconnect(user_id)

# Real-time sync endpoints
@router.post("/sync/data")
async def sync_data(key: str, data: dict, room_id: Optional[str] = None):
    """Sync data across clients"""
    try:
        await realtime_sync.sync_data(key, data, room_id)
        return {"success": True, "message": "Data synced successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data sync failed: {str(e)}"
        )

@router.get("/sync/data/{key}")
async def get_sync_data(key: str):
    """Get synced data"""
    try:
        data = await realtime_sync.get_sync_data(key)
        if data is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sync data not found"
            )
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sync data: {str(e)}"
        )

@router.post("/sync/collaboration/create")
async def create_collaboration_session(session_id: str, creator_id: str, metadata: Optional[dict] = None):
    """Create collaboration session"""
    try:
        room_id = await realtime_sync.create_collaboration_session(session_id, creator_id, metadata)
        return {"success": True, "room_id": room_id, "session_id": session_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create collaboration session: {str(e)}"
        )

@router.post("/sync/collaboration/{session_id}/join")
async def join_collaboration_session(session_id: str, user_id: str):
    """Join collaboration session"""
    try:
        room_id = await realtime_sync.join_collaboration_session(session_id, user_id)
        return {"success": True, "room_id": room_id, "session_id": session_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to join collaboration session: {str(e)}"
        )

@router.post("/sync/collaboration/{session_id}/leave")
async def leave_collaboration_session(session_id: str, user_id: str):
    """Leave collaboration session"""
    try:
        await realtime_sync.leave_collaboration_session(session_id, user_id)
        return {"success": True, "message": "Left collaboration session"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to leave collaboration session: {str(e)}"
        )

@router.post("/sync/collaboration/{session_id}/update")
async def broadcast_collaboration_update(session_id: str, user_id: str, update_data: dict):
    """Broadcast collaboration update"""
    try:
        await realtime_sync.broadcast_collaboration_update(session_id, user_id, update_data)
        return {"success": True, "message": "Update broadcasted"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to broadcast update: {str(e)}"
        )
