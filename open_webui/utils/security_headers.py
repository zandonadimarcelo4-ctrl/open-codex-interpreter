"""
Security Headers Middleware - Middleware de Cabeçalhos de Segurança
Adiciona cabeçalhos de segurança HTTP
"""
from __future__ import annotations

import logging
import sys
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from open_webui.env import SRC_LOG_LEVELS, GLOBAL_LOG_LEVEL

logging.basicConfig(stream=sys.stdout, level=GLOBAL_LOG_LEVEL)
log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS.get("MAIN", logging.INFO))


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware para adicionar cabeçalhos de segurança"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Adicionar cabeçalhos de segurança
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response

