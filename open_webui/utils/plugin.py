"""
Plugin Utilities - Utilitários para Plugins
Gerencia carregamento de módulos de funções e ferramentas
"""
from __future__ import annotations

import os
import sys
import types
import tempfile
import logging
import subprocess
from typing import Any, Dict, List, Optional, Tuple

try:
    from open_webui.models.functions import Functions
except ImportError:
    Functions = None

try:
    from open_webui.models.tools import Tools
except ImportError:
    Tools = None

from open_webui.env import SRC_LOG_LEVELS, GLOBAL_LOG_LEVEL

logging.basicConfig(stream=sys.stdout, level=GLOBAL_LOG_LEVEL)
log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS.get("MAIN", logging.INFO))


def extract_frontmatter(content: str) -> Dict[str, Any]:
    """
    Extrair frontmatter do conteúdo
    
    Args:
        content: Conteúdo com frontmatter
    
    Returns:
        Dicionário com frontmatter
    """
    frontmatter = {}
    
    if not content or not content.strip().startswith("---"):
        return frontmatter
    
    try:
        lines = content.split("\n")
        if lines[0].strip() == "---":
            i = 1
            while i < len(lines) and lines[i].strip() != "---":
                line = lines[i].strip()
                if ":" in line:
                    key, value = line.split(":", 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    frontmatter[key] = value
                i += 1
    except Exception as e:
        log.warning(f"Erro ao extrair frontmatter: {e}")
    
    return frontmatter


def replace_imports(content: str) -> str:
    """
    Substituir imports no conteúdo
    
    Args:
        content: Conteúdo com imports
    
    Returns:
        Conteúdo com imports substituídos
    """
    # Por enquanto, retornar conteúdo sem modificações
    # Implementação completa pode ser adicionada depois
    return content


def install_frontmatter_requirements(requirements: str):
    """
    Instalar requirements do frontmatter
    
    Args:
        requirements: String com requirements separados por vírgula ou nova linha
    """
    if not requirements:
        return
    
    try:
        # Separar requirements
        reqs = []
        for req in requirements.replace(",", "\n").split("\n"):
            req = req.strip()
            if req:
                reqs.append(req)
        
        if reqs:
            log.info(f"Instalando requirements: {reqs}")
            # Por enquanto, apenas logar
            # Implementação completa pode instalar via pip
            # subprocess.run([sys.executable, "-m", "pip", "install"] + reqs)
    except Exception as e:
        log.warning(f"Erro ao instalar requirements: {e}")


def install_tool_and_function_dependencies():
    """
    Instalar dependências de ferramentas e funções
    """
    try:
        log.info("Instalando dependências de ferramentas e funções...")
        # Por enquanto, apenas logar
        # Implementação completa pode instalar dependências
    except Exception as e:
        log.warning(f"Erro ao instalar dependências: {e}")


def load_function_module_by_id(function_id: str, content: Optional[str] = None) -> Tuple[Any, str, Dict[str, Any]]:
    """
    Carregar módulo de função por ID
    
    Args:
        function_id: ID da função
        content: Conteúdo opcional (se None, carrega do banco)
    
    Returns:
        Tupla (objeto_função, tipo, frontmatter)
    """
    if Functions is None:
        raise Exception("Functions não disponível")
    
    if content is None:
        try:
            function = Functions.get_function_by_id(function_id)
            if not function:
                raise Exception(f"Function not found: {function_id}")
            content = function.content if hasattr(function, "content") else ""
        except Exception as e:
            log.error(f"Erro ao obter função {function_id}: {e}")
            raise Exception(f"Function not found: {function_id}")
    
    # Extrair frontmatter
    frontmatter = extract_frontmatter(content)
    install_frontmatter_requirements(frontmatter.get("requirements", ""))
    
    # Substituir imports
    content = replace_imports(content)
    
    # Criar módulo
    module_name = f"function_{function_id}"
    module = types.ModuleType(module_name)
    sys.modules[module_name] = module
    
    # Criar arquivo temporário
    temp_file = tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".py", encoding="utf-8")
    temp_file.close()
    
    try:
        # Escrever conteúdo no arquivo temporário
        with open(temp_file.name, "w", encoding="utf-8") as f:
            f.write(content)
        
        module.__dict__["__file__"] = temp_file.name
        
        # Executar conteúdo no namespace do módulo
        exec(content, module.__dict__)
        
        log.info(f"Loaded module: {module.__name__}")
        
        # Retornar objeto apropriado baseado no tipo de classe no módulo
        if hasattr(module, "Pipe"):
            return module.Pipe(), "pipe", frontmatter
        elif hasattr(module, "Filter"):
            return module.Filter(), "filter", frontmatter
        elif hasattr(module, "Action"):
            return module.Action(), "action", frontmatter
        else:
            raise Exception("No Function class found in the module")
    except Exception as e:
        log.error(f"Error loading module: {function_id}: {e}")
        # Limpar módulo em caso de erro
        if module_name in sys.modules:
            del sys.modules[module_name]
        
        # Desativar função no banco
        try:
            if Functions:
                Functions.update_function_by_id(function_id, {"is_active": False})
        except Exception:
            pass
        
        raise e
    finally:
        # Remover arquivo temporário
        try:
            os.unlink(temp_file.name)
        except Exception:
            pass


def get_function_module_from_cache(
    request: Any,
    function_id: str,
    load_from_db: bool = True
) -> Tuple[Any, str, Dict[str, Any]]:
    """
    Obter módulo de função do cache ou carregar do banco
    
    Args:
        request: Request do FastAPI
        function_id: ID da função
        load_from_db: Se True, carrega do banco se não estiver em cache
    
    Returns:
        Tupla (objeto_função, tipo, frontmatter)
    """
    # Verificar se existe cache no request
    if not hasattr(request.app.state, "FUNCTION_MODULES_CACHE"):
        request.app.state.FUNCTION_MODULES_CACHE = {}
    
    # Verificar cache
    if function_id in request.app.state.FUNCTION_MODULES_CACHE:
        cached_data = request.app.state.FUNCTION_MODULES_CACHE[function_id]
        return cached_data["module"], cached_data["type"], cached_data["frontmatter"]
    
    # Carregar do banco se solicitado
    if load_from_db:
        try:
            function_module, function_type, frontmatter = load_function_module_by_id(function_id)
            
            # Armazenar em cache
            request.app.state.FUNCTION_MODULES_CACHE[function_id] = {
                "module": function_module,
                "type": function_type,
                "frontmatter": frontmatter
            }
            
            return function_module, function_type, frontmatter
        except Exception as e:
            log.error(f"Erro ao carregar função {function_id} do banco: {e}")
            raise
    
    raise Exception(f"Function {function_id} not found in cache and load_from_db is False")


def load_tool_module_by_id(tool_id: str, content: Optional[str] = None) -> Tuple[Any, Dict[str, Any]]:
    """
    Carregar módulo de ferramenta por ID
    
    Args:
        tool_id: ID da ferramenta
        content: Conteúdo opcional (se None, carrega do banco)
    
    Returns:
        Tupla (objeto_ferramenta, frontmatter)
    """
    if Tools is None:
        raise Exception("Tools não disponível")
    
    if content is None:
        try:
            tool = Tools.get_tool_by_id(tool_id)
            if not tool:
                raise Exception(f"Tool not found: {tool_id}")
            content = tool.content if hasattr(tool, "content") else ""
        except Exception as e:
            log.error(f"Erro ao obter ferramenta {tool_id}: {e}")
            raise Exception(f"Tool not found: {tool_id}")
    
    # Extrair frontmatter
    frontmatter = extract_frontmatter(content)
    install_frontmatter_requirements(frontmatter.get("requirements", ""))
    
    # Substituir imports
    content = replace_imports(content)
    
    # Criar módulo
    module_name = f"tool_{tool_id}"
    module = types.ModuleType(module_name)
    sys.modules[module_name] = module
    
    # Criar arquivo temporário
    temp_file = tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".py", encoding="utf-8")
    temp_file.close()
    
    try:
        # Escrever conteúdo no arquivo temporário
        with open(temp_file.name, "w", encoding="utf-8") as f:
            f.write(content)
        
        module.__dict__["__file__"] = temp_file.name
        
        # Executar conteúdo no namespace do módulo
        exec(content, module.__dict__)
        
        log.info(f"Loaded module: {module.__name__}")
        
        # Retornar objeto Tools se encontrado
        if hasattr(module, "Tools"):
            return module.Tools(), frontmatter
        else:
            raise Exception("No Tools class found in the module")
    except Exception as e:
        log.error(f"Error loading module: {tool_id}: {e}")
        # Limpar módulo em caso de erro
        if module_name in sys.modules:
            del sys.modules[module_name]
        raise e
    finally:
        # Remover arquivo temporário
        try:
            os.unlink(temp_file.name)
        except Exception:
            pass

