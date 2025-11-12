"""
GUI Automation Tool - Automação GUI Completa
Integração com UFO (PyAutoGUI) para AutoGen v2
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional

try:
    from ..integrations.ufo import UFOIntegration
    UFO_AVAILABLE = True
except ImportError:
    UFO_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("UFO Integration não disponível")

logger = logging.getLogger(__name__)


class GUIAutomationTool:
    """
    Ferramenta de automação GUI para AutoGen v2
    Usa PyAutoGUI para interagir com interfaces gráficas
    """
    
    def __init__(self, workspace: Optional[Path] = None):
        """
        Inicializar ferramenta de automação GUI
        
        Args:
            workspace: Workspace para UFO
        """
        if not UFO_AVAILABLE:
            raise ImportError("UFO Integration não disponível. Execute: pip install pyautogui opencv-python Pillow")
        
        self.ufo = UFOIntegration(workspace=workspace)
        logger.info("GUI Automation Tool inicializado com PyAutoGUI")
    
    def execute(self, action: str, **kwargs) -> Dict[str, Any]:
        """
        Executar ação de automação GUI
        
        Args:
            action: Ação a executar (screenshot, click, type, etc.)
            **kwargs: Argumentos adicionais
        
        Returns:
            Resultado da execução
        """
        logger.info(f"Executando ação GUI: {action}")
        
        try:
            if action == "screenshot":
                region = kwargs.get("region")
                save = kwargs.get("save", True)
                return self.ufo.capture_screenshot(region=region, save=save)
            
            elif action == "click":
                x = kwargs.get("x")
                y = kwargs.get("y")
                button = kwargs.get("button", "left")
                clicks = kwargs.get("clicks", 1)
                interval = kwargs.get("interval", 0.1)
                return self.ufo.click(x=x, y=y, button=button, clicks=clicks, interval=interval)
            
            elif action == "double_click":
                x = kwargs.get("x")
                y = kwargs.get("y")
                return self.ufo.double_click(x=x, y=y)
            
            elif action == "right_click":
                x = kwargs.get("x")
                y = kwargs.get("y")
                return self.ufo.right_click(x=x, y=y)
            
            elif action == "type":
                text = kwargs.get("text", "")
                interval = kwargs.get("interval", 0.05)
                return self.ufo.type_text(text=text, interval=interval)
            
            elif action == "press_key":
                key = kwargs.get("key")
                presses = kwargs.get("presses", 1)
                interval = kwargs.get("interval", 0.1)
                return self.ufo.press_key(key=key, presses=presses, interval=interval)
            
            elif action == "hotkey":
                keys = kwargs.get("keys", [])
                return self.ufo.hotkey(*keys)
            
            elif action == "scroll":
                x = kwargs.get("x")
                y = kwargs.get("y")
                clicks = kwargs.get("clicks", 3)
                direction = kwargs.get("direction", "up")
                return self.ufo.scroll(x=x, y=y, clicks=clicks, direction=direction)
            
            elif action == "drag":
                x1 = kwargs.get("x1")
                y1 = kwargs.get("y1")
                x2 = kwargs.get("x2")
                y2 = kwargs.get("y2")
                duration = kwargs.get("duration", 0.5)
                return self.ufo.drag(x1=x1, y1=y1, x2=x2, y2=y2, duration=duration)
            
            elif action == "move_mouse":
                x = kwargs.get("x")
                y = kwargs.get("y")
                duration = kwargs.get("duration", 0.5)
                return self.ufo.move_mouse(x=x, y=y, duration=duration)
            
            elif action == "get_mouse_position":
                return self.ufo.get_mouse_position()
            
            elif action == "locate_on_screen":
                image_path = kwargs.get("image_path")
                confidence = kwargs.get("confidence", 0.8)
                return self.ufo.locate_on_screen(image_path=image_path, confidence=confidence)
            
            elif action == "get_window_list":
                return {"success": True, "windows": self.ufo.get_window_list()}
            
            elif action == "activate_window":
                title = kwargs.get("title")
                return self.ufo.activate_window(title=title)
            
            elif action == "execute_task":
                task = kwargs.get("task", "")
                vision_model = kwargs.get("vision_model")
                api_base = kwargs.get("api_base")
                max_steps = kwargs.get("max_steps", 10)
                return self.ufo.execute_task(
                    task=task,
                    vision_model=vision_model,
                    api_base=api_base,
                    max_steps=max_steps,
                    **kwargs
                )
            
            else:
                return {
                    "success": False,
                    "error": f"Ação '{action}' não reconhecida. Ações disponíveis: screenshot, click, type, press_key, hotkey, scroll, drag, move_mouse, get_mouse_position, locate_on_screen, get_window_list, activate_window, execute_task"
                }
        
        except Exception as e:
            logger.error(f"Erro ao executar ação GUI: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_function_schema(self) -> Dict[str, Any]:
        """Obter schema da função para AutoGen v2"""
        return {
            "name": "gui_automation",
            "description": "Automação GUI completa usando PyAutoGUI. Permite interagir com interfaces gráficas: capturar screenshots, clicar, digitar, pressionar teclas, fazer scroll, arrastar, mover mouse, localizar imagens, gerenciar janelas, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": [
                            "screenshot",
                            "click",
                            "double_click",
                            "right_click",
                            "type",
                            "press_key",
                            "hotkey",
                            "scroll",
                            "drag",
                            "move_mouse",
                            "get_mouse_position",
                            "locate_on_screen",
                            "get_window_list",
                            "activate_window",
                            "execute_task"
                        ],
                        "description": "Ação a executar"
                    },
                    "x": {
                        "type": "integer",
                        "description": "Coordenada X (para click, move_mouse, scroll, etc.)"
                    },
                    "y": {
                        "type": "integer",
                        "description": "Coordenada Y (para click, move_mouse, scroll, etc.)"
                    },
                    "button": {
                        "type": "string",
                        "enum": ["left", "right", "middle"],
                        "description": "Botão do mouse (para click)"
                    },
                    "clicks": {
                        "type": "integer",
                        "description": "Número de cliques"
                    },
                    "text": {
                        "type": "string",
                        "description": "Texto para digitar"
                    },
                    "key": {
                        "type": "string",
                        "description": "Tecla para pressionar (ex: 'enter', 'tab', 'ctrl', 'alt')"
                    },
                    "keys": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Teclas para hotkey (ex: ['ctrl', 'c'])"
                    },
                    "direction": {
                        "type": "string",
                        "enum": ["up", "down"],
                        "description": "Direção do scroll"
                    },
                    "x1": {
                        "type": "integer",
                        "description": "Coordenada X inicial (para drag)"
                    },
                    "y1": {
                        "type": "integer",
                        "description": "Coordenada Y inicial (para drag)"
                    },
                    "x2": {
                        "type": "integer",
                        "description": "Coordenada X final (para drag)"
                    },
                    "y2": {
                        "type": "integer",
                        "description": "Coordenada Y final (para drag)"
                    },
                    "duration": {
                        "type": "number",
                        "description": "Duração em segundos (para drag, move_mouse)"
                    },
                    "image_path": {
                        "type": "string",
                        "description": "Caminho para imagem a localizar (para locate_on_screen)"
                    },
                    "confidence": {
                        "type": "number",
                        "description": "Nível de confiança (0.0 a 1.0) para locate_on_screen"
                    },
                    "title": {
                        "type": "string",
                        "description": "Título da janela (para activate_window)"
                    },
                    "region": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "Região para screenshot [x, y, width, height]"
                    },
                    "save": {
                        "type": "boolean",
                        "description": "Salvar screenshot (para screenshot)"
                    },
                    "task": {
                        "type": "string",
                        "description": "Descrição da tarefa (para execute_task)"
                    },
                    "vision_model": {
                        "type": "string",
                        "description": "Modelo de visão a usar para análise (ex: 'llava', 'gpt-4-vision') - opcional"
                    },
                    "api_base": {
                        "type": "string",
                        "description": "URL base da API do modelo de visão - opcional"
                    },
                    "max_steps": {
                        "type": "integer",
                        "description": "Número máximo de passos para execute_task (padrão: 10)"
                    }
                },
                "required": ["action"]
            }
        }
