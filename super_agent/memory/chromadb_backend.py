"""
ChromaDB Backend - Backend de Memória Vetorial
Usando ChromaDB para memória persistente
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class ChromaDBBackend:
    """Backend de memória vetorial usando ChromaDB"""
    
    def __init__(self, persist_directory: str = "./super_agent/memory"):
        """
        Inicializar backend ChromaDB
        
        Args:
            persist_directory: Diretório para persistência
        """
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        
        self.collection = None
        self._initialize_chromadb()
    
    def _initialize_chromadb(self):
        """Inicializar ChromaDB"""
        try:
            import chromadb
            from chromadb.config import Settings
            
            # Criar cliente ChromaDB
            self.client = chromadb.PersistentClient(
                path=str(self.persist_directory),
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Criar ou obter coleção
            self.collection = self.client.get_or_create_collection(
                name="super_agent_memory",
                metadata={"description": "Memória persistente do Super Agent"}
            )
            
            logger.info(f"ChromaDB inicializado em {self.persist_directory}")
        except ImportError:
            logger.warning("ChromaDB não instalado. Memória vetorial desabilitada.")
            self.client = None
            self.collection = None
        except Exception as e:
            logger.error(f"Falha ao inicializar ChromaDB: {e}")
            self.client = None
            self.collection = None
    
    def store(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Armazenar texto na memória
        
        Args:
            text: Texto a armazenar
            metadata: Metadados adicionais
        
        Returns:
            ID do documento armazenado
        """
        if not self.collection:
            logger.warning("ChromaDB não disponível")
            return ""
        
        try:
            import uuid
            
            doc_id = str(uuid.uuid4())
            self.collection.add(
                documents=[text],
                ids=[doc_id],
                metadatas=[metadata or {}]
            )
            logger.info(f"Texto armazenado na memória: {doc_id}")
            return doc_id
        except Exception as e:
            logger.error(f"Falha ao armazenar texto: {e}")
            return ""
    
    def search(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Buscar textos similares
        
        Args:
            query: Consulta de busca
            n_results: Número de resultados
        
        Returns:
            Lista de resultados
        """
        if not self.collection:
            logger.warning("ChromaDB não disponível")
            return []
        
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            
            # Formatar resultados
            formatted_results = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    formatted_results.append({
                        "id": results["ids"][0][i] if results["ids"] else "",
                        "text": doc,
                        "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                        "distance": results["distances"][0][i] if results["distances"] else 0.0
                    })
            
            logger.info(f"Busca retornou {len(formatted_results)} resultados")
            return formatted_results
        except Exception as e:
            logger.error(f"Falha ao buscar textos: {e}")
            return []
    
    def delete(self, doc_id: str) -> bool:
        """
        Deletar documento
        
        Args:
            doc_id: ID do documento
        
        Returns:
            True se deletado com sucesso
        """
        if not self.collection:
            logger.warning("ChromaDB não disponível")
            return False
        
        try:
            self.collection.delete(ids=[doc_id])
            logger.info(f"Documento deletado: {doc_id}")
            return True
        except Exception as e:
            logger.error(f"Falha ao deletar documento: {e}")
            return False
    
    def get_all(self) -> List[Dict[str, Any]]:
        """
        Obter todos os documentos
        
        Returns:
            Lista de todos os documentos
        """
        if not self.collection:
            logger.warning("ChromaDB não disponível")
            return []
        
        try:
            results = self.collection.get()
            
            # Formatar resultados
            formatted_results = []
            if results["documents"]:
                for i, doc in enumerate(results["documents"]):
                    formatted_results.append({
                        "id": results["ids"][i] if results["ids"] else "",
                        "text": doc,
                        "metadata": results["metadatas"][i] if results["metadatas"] else {}
                    })
            
            return formatted_results
        except Exception as e:
            logger.error(f"Falha ao obter documentos: {e}")
            return []
    
    async def add_task(self, task: str, context: Dict[str, Any]) -> str:
        """
        Adicionar tarefa à memória (método compatível com código existente)
        
        Args:
            task: Descrição da tarefa
            context: Contexto adicional
            
        Returns:
            ID do documento armazenado
        """
        metadata = {
            "type": "task",
            "context": context,
        }
        return self.store(task, metadata)
    
    async def cleanup(self):
        """Limpar recursos (método compatível)"""
        # ChromaDB não precisa de limpeza explícita
        # A persistência é automática
        logger.info("ChromaDB: Limpeza não necessária (persistência automática)")

