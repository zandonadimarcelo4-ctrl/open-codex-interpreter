"""
Ollama Adapter for Open Interpreter
Adapta o Open Interpreter para usar Ollama em vez de OpenAI
"""
import os
import json
import requests
from typing import List, Dict, Optional, Any

# IMPORTANTE: Usar a mesma URL base que o AutoGen (llm_client.py)
# OLLAMA_BASE_URL deve ser "http://localhost:11434" (sem /v1 ou /api)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/").rstrip("/v1").rstrip("/api")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")


class OllamaAdapter:
    """
    Adaptador para usar Ollama com Open Interpreter
    """
    
    def __init__(self, model: str = None, base_url: str = None):
        self.model = model or DEFAULT_MODEL
        self.base_url = (base_url or OLLAMA_BASE_URL).rstrip('/').rstrip("/v1").rstrip("/api")
        self.api_url = f"{self.base_url}/api"
        
        # Log de confirmação (apenas se logging estiver configurado)
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"✅ OllamaAdapter inicializado")
        logger.info(f"   Modelo: {self.model}")
        logger.info(f"   Base URL: {self.base_url}")
        logger.info(f"   API URL: {self.api_url}")
        logger.info(f"   ✅ Mesma instância que AutoGen (llm_client.py)")
        
    def chat_completion(self, messages: List[Dict[str, str]], functions: Optional[List[Dict]] = None, **kwargs) -> Dict[str, Any]:
        """
        Envia mensagens para Ollama e retorna resposta no formato OpenAI
        """
        try:
            # Preparar mensagens para Ollama
            ollama_messages = []
            system_message = None
            
            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                
                if role == "system":
                    system_message = content
                else:
                    ollama_messages.append({
                        "role": role,
                        "content": content
                    })
            
            # Preparar payload para Ollama
            payload = {
                "model": self.model,
                "messages": ollama_messages,
                "stream": False,
                "options": {
                    "temperature": kwargs.get("temperature", 0.7),
                    "top_p": kwargs.get("top_p", 0.9),
                    "top_k": kwargs.get("top_k", 40),
                }
            }
            
            # Adicionar system message se houver
            if system_message:
                payload["system"] = system_message
            
            # Fazer requisição para Ollama
            response = requests.post(
                f"{self.api_url}/chat",
                json=payload,
                timeout=kwargs.get("timeout", 120)
            )
            
            if response.status_code != 200:
                error_msg = response.text or f"HTTP {response.status_code}"
                raise Exception(f"Erro ao chamar Ollama: {error_msg}")
            
            result = response.json()
            
            # Converter resposta do Ollama para formato OpenAI
            ollama_response = {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": result.get("message", {}).get("content", ""),
                        "function_call": None  # Ollama não suporta function calling nativamente
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": result.get("prompt_eval_count", 0),
                    "completion_tokens": result.get("eval_count", 0),
                    "total_tokens": result.get("prompt_eval_count", 0) + result.get("eval_count", 0)
                }
            }
            
            # Se há functions e o modelo retornou código, tentar parsear como function call
            if functions and ollama_response["choices"][0]["message"]["content"]:
                # Tentar extrair código da resposta
                content = ollama_response["choices"][0]["message"]["content"]
                function_call = self._parse_function_call(content, functions)
                if function_call:
                    ollama_response["choices"][0]["message"]["function_call"] = function_call
                    ollama_response["choices"][0]["message"]["content"] = None
            
            return ollama_response
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Erro de conexão com Ollama: {e}")
        except Exception as e:
            raise Exception(f"Erro ao processar resposta do Ollama: {e}")
    
    def _parse_function_call(self, content: str, functions: List[Dict]) -> Optional[Dict]:
        """
        Tenta parsear código da resposta do Ollama como function call
        Ollama não suporta function calling nativo, então tentamos extrair código dos blocos de código markdown
        """
        import re
        
        # Procurar por blocos de código markdown
        code_block_pattern = r'```(\w+)?\n(.*?)```'
        matches = re.findall(code_block_pattern, content, re.DOTALL)
        
        if matches:
            # Pegar o primeiro bloco de código
            language, code = matches[0]
            
            # Se há uma função run_code, usar ela
            for func in functions:
                if func.get("name") == "run_code":
                    return {
                        "name": "run_code",
                        "arguments": json.dumps({
                            "language": language or "python",
                            "code": code.strip()
                        })
                    }
        
        return None
    
    def verify_connection(self) -> bool:
        """
        Verifica se Ollama está disponível
        """
        try:
            response = requests.get(f"{self.api_url}/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def list_models(self) -> List[str]:
        """
        Lista modelos disponíveis no Ollama
        """
        try:
            response = requests.get(f"{self.api_url}/tags", timeout=5)
            if response.status_code == 200:
                data = response.json()
                return [model["name"] for model in data.get("models", [])]
            return []
        except:
            return []

