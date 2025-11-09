"""
Resource Manager - Gerenciamento centralizado de recursos
Evita conflitos entre agentes e capabilities
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, Optional
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


class ResourceManager:
    """
    Gerenciador de recursos centralizado
    Evita conflitos usando locks e pools
    """
    
    def __init__(self):
        self.locks: Dict[str, asyncio.Lock] = {}
        self.resources: Dict[str, Any] = {}
        self.usage_count: Dict[str, int] = {}
        self._lock = asyncio.Lock()
    
    @asynccontextmanager
    async def acquire(self, resource_id: str):
        """
        Adquire lock para recurso
        
        Args:
            resource_id: ID do recurso
        
        Yields:
            Lock adquirido
        """
        # Criar lock se não existir
        async with self._lock:
            if resource_id not in self.locks:
                self.locks[resource_id] = asyncio.Lock()
                self.usage_count[resource_id] = 0
        
        # Adquirir lock
        lock = self.locks[resource_id]
        await lock.acquire()
        
        try:
            self.usage_count[resource_id] += 1
            logger.debug(f"Recurso '{resource_id}' adquirido (uso: {self.usage_count[resource_id]})")
            yield lock
        finally:
            lock.release()
            self.usage_count[resource_id] -= 1
            logger.debug(f"Recurso '{resource_id}' liberado (uso: {self.usage_count[resource_id]})")
    
    async def register_resource(self, resource_id: str, resource: Any):
        """
        Registrar recurso
        
        Args:
            resource_id: ID do recurso
            resource: Recurso a registrar
        """
        async with self._lock:
            self.resources[resource_id] = resource
            logger.debug(f"Recurso '{resource_id}' registrado")
    
    async def get_resource(self, resource_id: str) -> Optional[Any]:
        """
        Obter recurso
        
        Args:
            resource_id: ID do recurso
        
        Returns:
            Recurso ou None
        """
        async with self._lock:
            return self.resources.get(resource_id)
    
    async def release_resource(self, resource_id: str):
        """
        Liberar recurso
        
        Args:
            resource_id: ID do recurso
        """
        async with self._lock:
            if resource_id in self.resources:
                del self.resources[resource_id]
                logger.debug(f"Recurso '{resource_id}' liberado")
    
    def get_status(self) -> Dict[str, Any]:
        """Obter status do resource manager"""
        return {
            "locks": len(self.locks),
            "resources": len(self.resources),
            "usage": dict(self.usage_count),
        }
    
    async def cleanup(self):
        """Limpar recursos"""
        async with self._lock:
            self.locks.clear()
            self.resources.clear()
            self.usage_count.clear()
            logger.info("Resource Manager limpo")

