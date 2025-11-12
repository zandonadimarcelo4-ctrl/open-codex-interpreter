"""
UFO Integration - Microsoft UI-Focused Agent
Integração com PyAutoGUI para automação GUI completa
"""
from __future__ import annotations

import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import pyautogui
    import cv2
    import numpy as np
    from PIL import Image
    PYAUTOGUI_AVAILABLE = True
except Exception:
    # Captura qualquer erro durante a importação (ImportError, AttributeError, etc.)
    # Isso inclui erros de compatibilidade NumPy/OpenCV
    PYAUTOGUI_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("PyAutoGUI não está disponível (pode ser problema de compatibilidade NumPy/OpenCV). Execute: pip install pyautogui opencv-python Pillow")

logger = logging.getLogger(__name__)

# Configurar PyAutoGUI para segurança
if PYAUTOGUI_AVAILABLE:
    pyautogui.FAILSAFE = True  # Mover mouse para canto superior esquerdo para parar
    pyautogui.PAUSE = 0.1  # Pausa entre ações


class UFOIntegration:
    """
    Integração com PyAutoGUI para automação GUI
    Suporta screenshots, cliques, digitação, scroll, etc.
    """
    
    def __init__(self, workspace: Optional[Path] = None):
        """
        Inicializar integração UFO
        
        Args:
            workspace: Workspace para salvar screenshots e logs
        """
        if not PYAUTOGUI_AVAILABLE:
            raise ImportError("PyAutoGUI não está instalado. Execute: pip install pyautogui opencv-python Pillow")
        
        self.workspace = workspace or Path.cwd() / "ufo_workspace"
        self.workspace.mkdir(parents=True, exist_ok=True)
        self.screenshots_dir = self.workspace / "screenshots"
        self.screenshots_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"UFO Integration inicializado em {self.workspace}")
    
    def capture_screenshot(self, region: Optional[Tuple[int, int, int, int]] = None, save: bool = True) -> Dict[str, Any]:
        """
        Capturar screenshot da tela
        
        Args:
            region: Região para capturar (x, y, width, height). Se None, captura tela inteira
            save: Se True, salva o screenshot no workspace
        
        Returns:
            Dict com informações do screenshot
        """
        try:
            if region:
                screenshot = pyautogui.screenshot(region=region)
            else:
                screenshot = pyautogui.screenshot()
            
            screenshot_path = None
            if save:
                timestamp = int(time.time())
                screenshot_path = self.screenshots_dir / f"screenshot_{timestamp}.png"
                screenshot.save(screenshot_path)
                logger.info(f"Screenshot salvo em {screenshot_path}")
            
            # Converter para numpy array para análise
            screenshot_array = np.array(screenshot)
            
            return {
                "success": True,
                "screenshot": screenshot,
                "path": str(screenshot_path) if screenshot_path else None,
                "size": screenshot.size,
                "region": region,
                "array": screenshot_array
            }
        except Exception as e:
            logger.error(f"Erro ao capturar screenshot: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def click(self, x: int, y: int, button: str = "left", clicks: int = 1, interval: float = 0.1) -> Dict[str, Any]:
        """
        Clicar em uma posição da tela
        
        Args:
            x: Coordenada X
            y: Coordenada Y
            button: Botão do mouse ("left", "right", "middle")
            clicks: Número de cliques
            interval: Intervalo entre cliques
        
        Returns:
            Dict com resultado da ação
        """
        try:
            pyautogui.click(x=x, y=y, button=button, clicks=clicks, interval=interval)
            logger.info(f"Clique em ({x}, {y}) com botão {button}")
            return {
                "success": True,
                "action": "click",
                "x": x,
                "y": y,
                "button": button,
                "clicks": clicks
            }
        except Exception as e:
            logger.error(f"Erro ao clicar: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def double_click(self, x: int, y: int) -> Dict[str, Any]:
        """Duplo clique em uma posição"""
        return self.click(x, y, clicks=2)
    
    def right_click(self, x: int, y: int) -> Dict[str, Any]:
        """Clique direito em uma posição"""
        return self.click(x, y, button="right")
    
    def type_text(self, text: str, interval: float = 0.05) -> Dict[str, Any]:
        """
        Digitar texto
        
        Args:
            text: Texto para digitar
            interval: Intervalo entre caracteres
        
        Returns:
            Dict com resultado da ação
        """
        try:
            pyautogui.write(text, interval=interval)
            logger.info(f"Texto digitado: {text[:50]}...")
            return {
                "success": True,
                "action": "type",
                "text": text,
                "length": len(text)
            }
        except Exception as e:
            logger.error(f"Erro ao digitar texto: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def press_key(self, key: str, presses: int = 1, interval: float = 0.1) -> Dict[str, Any]:
        """
        Pressionar tecla
        
        Args:
            key: Tecla para pressionar (ex: "enter", "tab", "ctrl", "alt")
            presses: Número de pressionamentos
            interval: Intervalo entre pressionamentos
        
        Returns:
            Dict com resultado da ação
        """
        try:
            pyautogui.press(key, presses=presses, interval=interval)
            logger.info(f"Tecla pressionada: {key} ({presses} vezes)")
            return {
                "success": True,
                "action": "press",
                "key": key,
                "presses": presses
            }
        except Exception as e:
            logger.error(f"Erro ao pressionar tecla: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def hotkey(self, *keys: str) -> Dict[str, Any]:
        """
        Pressionar combinação de teclas (hotkey)
        
        Args:
            *keys: Teclas para pressionar simultaneamente (ex: "ctrl", "c")
        
        Returns:
            Dict com resultado da ação
        """
        try:
            pyautogui.hotkey(*keys)
            logger.info(f"Hotkey pressionada: {'+'.join(keys)}")
            return {
                "success": True,
                "action": "hotkey",
                "keys": list(keys)
            }
        except Exception as e:
            logger.error(f"Erro ao pressionar hotkey: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def scroll(self, x: int, y: int, clicks: int = 3, direction: str = "up") -> Dict[str, Any]:
        """
        Scroll na tela
        
        Args:
            x: Coordenada X
            y: Coordenada Y
            clicks: Número de cliques de scroll
            direction: Direção ("up" ou "down")
        
        Returns:
            Dict com resultado da ação
        """
        try:
            scroll_amount = clicks if direction == "up" else -clicks
            pyautogui.scroll(scroll_amount, x=x, y=y)
            logger.info(f"Scroll {direction} em ({x}, {y})")
            return {
                "success": True,
                "action": "scroll",
                "x": x,
                "y": y,
                "direction": direction,
                "clicks": clicks
            }
        except Exception as e:
            logger.error(f"Erro ao fazer scroll: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def drag(self, x1: int, y1: int, x2: int, y2: int, duration: float = 0.5) -> Dict[str, Any]:
        """
        Arrastar de uma posição para outra
        
        Args:
            x1: Coordenada X inicial
            y1: Coordenada Y inicial
            x2: Coordenada X final
            y2: Coordenada Y final
            duration: Duração do arrasto em segundos
        
        Returns:
            Dict com resultado da ação
        """
        try:
            pyautogui.drag(x1, y1, x2 - x1, y2 - y1, duration=duration)
            logger.info(f"Arrasto de ({x1}, {y1}) para ({x2}, {y2})")
            return {
                "success": True,
                "action": "drag",
                "from": (x1, y1),
                "to": (x2, y2),
                "duration": duration
            }
        except Exception as e:
            logger.error(f"Erro ao arrastar: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def move_mouse(self, x: int, y: int, duration: float = 0.5) -> Dict[str, Any]:
        """
        Mover mouse para uma posição
        
        Args:
            x: Coordenada X
            y: Coordenada Y
            duration: Duração do movimento em segundos
        
        Returns:
            Dict com resultado da ação
        """
        try:
            pyautogui.moveTo(x, y, duration=duration)
            logger.info(f"Mouse movido para ({x}, {y})")
            return {
                "success": True,
                "action": "move",
                "x": x,
                "y": y,
                "duration": duration
            }
        except Exception as e:
            logger.error(f"Erro ao mover mouse: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_mouse_position(self) -> Dict[str, Any]:
        """Obter posição atual do mouse"""
        try:
            x, y = pyautogui.position()
            return {
                "success": True,
                "x": x,
                "y": y
            }
        except Exception as e:
            logger.error(f"Erro ao obter posição do mouse: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def locate_on_screen(self, image_path: str, confidence: float = 0.8) -> Dict[str, Any]:
        """
        Localizar imagem na tela
        
        Args:
            image_path: Caminho para a imagem a localizar
            confidence: Nível de confiança (0.0 a 1.0)
        
        Returns:
            Dict com posição encontrada
        """
        try:
            location = pyautogui.locateOnScreen(image_path, confidence=confidence)
            if location:
                center = pyautogui.center(location)
                return {
                    "success": True,
                    "found": True,
                    "location": location,
                    "center": center,
                    "x": center.x,
                    "y": center.y
                }
            else:
                return {
                    "success": True,
                    "found": False,
                    "message": "Imagem não encontrada na tela"
                }
        except Exception as e:
            logger.error(f"Erro ao localizar imagem: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_window_list(self) -> List[Dict[str, Any]]:
        """Obter lista de janelas abertas (requer pygetwindow)"""
        try:
            import pygetwindow as gw
            windows = gw.getAllWindows()
            return [
                {
                    "title": win.title,
                    "left": win.left,
                    "top": win.top,
                    "width": win.width,
                    "height": win.height
                }
                for win in windows
            ]
        except ImportError:
            logger.warning("pygetwindow não está instalado. Não é possível obter lista de janelas.")
            return []
        except Exception as e:
            logger.error(f"Erro ao obter lista de janelas: {e}")
            return []
    
    def activate_window(self, title: str) -> Dict[str, Any]:
        """Ativar janela por título (requer pygetwindow)"""
        try:
            import pygetwindow as gw
            windows = gw.getWindowsWithTitle(title)
            if windows:
                windows[0].activate()
                return {
                    "success": True,
                    "action": "activate_window",
                    "title": title
                }
            else:
                return {
                    "success": False,
                    "error": f"Janela '{title}' não encontrada"
                }
        except ImportError:
            logger.warning("pygetwindow não está instalado. Não é possível ativar janelas.")
            return {
                "success": False,
                "error": "pygetwindow não está instalado"
            }
        except Exception as e:
            logger.error(f"Erro ao ativar janela: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def execute_task(self, task: str, **kwargs) -> Dict[str, Any]:
        """
        Executar tarefa de automação GUI usando análise visual (UFO-style)
        
        Esta função implementa o conceito do Microsoft UFO: usa modelos de visão
        para entender a UI e executar tarefas de forma inteligente.
        
        Args:
            task: Descrição da tarefa em linguagem natural (ex: "Abra o Bloco de Notas e digite 'Olá'")
            **kwargs: Argumentos adicionais
                - vision_model: Modelo de visão a usar (ex: "llava", "gpt-4-vision")
                - api_base: URL base da API do modelo de visão
                - max_steps: Número máximo de passos (padrão: 10)
        
        Returns:
            Dict com resultado da execução
        """
        logger.info(f"Executando tarefa GUI (UFO-style): {task}")
        
        try:
            # Capturar screenshot inicial
            screenshot_result = self.capture_screenshot(save=True)
            if not screenshot_result.get("success"):
                return {
                    "success": False,
                    "error": "Falha ao capturar screenshot inicial",
                    "task": task
                }
            
            screenshot_path = screenshot_result.get("path")
            
            # Tentar usar modelo de visão se disponível
            # Padrão: llava:7b (excelente para análise de UI)
            vision_model = kwargs.get("vision_model") or os.getenv("VISION_MODEL", "llava:7b")
            api_base = kwargs.get("api_base") or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            
            if vision_model:
                # Usar modelo de visão para analisar a tela e planejar ações
                try:
                    import requests
                    import json
                    import base64
                    
                    # Ler screenshot como base64
                    with open(screenshot_path, "rb") as f:
                        image_data = base64.b64encode(f.read()).decode("utf-8")
                    
                    # Preparar prompt para o modelo de visão
                    prompt = f"""Analise esta captura de tela e crie um plano de ação para executar a seguinte tarefa: "{task}"

Retorne um JSON com o seguinte formato:
{{
    "plan": [
        {{"action": "click", "x": 100, "y": 200, "description": "Clicar no botão X"}},
        {{"action": "type", "text": "Olá", "description": "Digitar texto"}},
        {{"action": "press_key", "key": "enter", "description": "Pressionar Enter"}}
    ],
    "confidence": 0.8
}}

Ações disponíveis: click, type, press_key, hotkey, scroll, drag, move_mouse, locate_on_screen, activate_window
"""
                    
                    # Chamar modelo de visão via Ollama
                    response = requests.post(
                        f"{api_base}/api/generate",
                        json={
                            "model": vision_model,
                            "prompt": prompt,
                            "images": [image_data],
                            "stream": False,
                            "format": "json"
                        },
                        timeout=60
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        plan_json = json.loads(result.get("response", "{}"))
                        
                        # Executar plano
                        plan = plan_json.get("plan", [])
                        executed_actions = []
                        
                        for step in plan[:kwargs.get("max_steps", 10)]:
                            action = step.get("action")
                            description = step.get("description", "")
                            
                            logger.info(f"Executando: {description}")
                            
                            if action == "click":
                                result = self.click(step.get("x"), step.get("y"), step.get("button", "left"))
                            elif action == "type":
                                result = self.type_text(step.get("text", ""))
                            elif action == "press_key":
                                result = self.press_key(step.get("key"))
                            elif action == "hotkey":
                                result = self.hotkey(*step.get("keys", []))
                            elif action == "scroll":
                                result = self.scroll(
                                    step.get("x", 0),
                                    step.get("y", 0),
                                    step.get("clicks", 3),
                                    step.get("direction", "up")
                                )
                            elif action == "activate_window":
                                result = self.activate_window(step.get("title", ""))
                            else:
                                result = {"success": False, "error": f"Ação '{action}' não reconhecida"}
                            
                            executed_actions.append({
                                "action": action,
                                "description": description,
                                "result": result
                            })
                            
                            # Pequena pausa entre ações
                            time.sleep(0.5)
                        
                        return {
                            "success": True,
                            "task": task,
                            "plan": plan,
                            "executed_actions": executed_actions,
                            "confidence": plan_json.get("confidence", 0.5),
                            "screenshot_path": screenshot_path,
                            "message": f"Tarefa executada usando modelo de visão {vision_model}"
                        }
                    
                except Exception as e:
                    logger.warning(f"Erro ao usar modelo de visão: {e}. Usando modo básico.")
            
            # Modo básico: retornar informações sobre capacidades
            return {
                "success": True,
                "task": task,
                "capabilities": [
                    "screenshot",
                    "click",
                    "double_click",
                    "right_click",
                    "type_text",
                    "press_key",
                    "hotkey",
                    "scroll",
                    "drag",
                    "move_mouse",
                    "get_mouse_position",
                    "locate_on_screen",
                    "get_window_list",
                    "activate_window"
                ],
                "screenshot_path": screenshot_path,
                "message": "UFO Integration pronto. Para usar análise visual, configure VISION_MODEL (ex: llava, gpt-4-vision)"
            }
            
        except Exception as e:
            logger.error(f"Erro ao executar tarefa GUI: {e}")
            return {
                "success": False,
                "error": str(e),
                "task": task
            }

