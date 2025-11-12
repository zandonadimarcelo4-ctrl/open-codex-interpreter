"""
Web Browsing Tool - Navegação Web Robusta
Integração com Selenium para automação web completa
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional

try:
    from ..integrations.selenium_web import SeleniumWebIntegration
    SELENIUM_AVAILABLE = True
except Exception:
    # Captura qualquer erro durante a importação
    SELENIUM_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Selenium Web Integration não disponível")

logger = logging.getLogger(__name__)


class WebBrowsingTool:
    """
    Ferramenta de navegação web para AutoGen v2
    Usa Selenium para automação web completa
    """
    
    def __init__(self, headless: bool = False, browser: str = "chrome", workspace: Optional[Path] = None):
        """
        Inicializar ferramenta de navegação web
        
        Args:
            headless: Executar em modo headless
            browser: Navegador a usar ("chrome" ou "firefox")
            workspace: Workspace para salvar screenshots e logs
        """
        if not SELENIUM_AVAILABLE:
            raise ImportError("Selenium Web Integration não disponível. Execute: pip install selenium webdriver-manager")
        
        self.selenium = SeleniumWebIntegration(
            headless=headless,
            browser=browser,
            workspace=workspace
        )
        logger.info(f"Web Browsing Tool inicializado com Selenium ({browser})")
    
    def execute(self, action: str, **kwargs) -> Dict[str, Any]:
        """
        Executar ação de navegação web
        
        Args:
            action: Ação a executar (navigate_to, click_by_xpath, fill_form, etc.)
            **kwargs: Argumentos adicionais
        
        Returns:
            Resultado da execução
        """
        logger.info(f"Executando ação web: {action}")
        
        try:
            if action == "start":
                return self.selenium.start()
            
            elif action == "stop":
                return self.selenium.stop()
            
            elif action == "navigate_to":
                url = kwargs.get("url")
                if not url:
                    return {"success": False, "error": "URL não fornecida"}
                return self.selenium.navigate_to(url)
            
            elif action == "get_page_content":
                return self.selenium.get_page_content()
            
            elif action == "click_by_xpath":
                xpath = kwargs.get("xpath")
                timeout = kwargs.get("timeout", 10)
                if not xpath:
                    return {"success": False, "error": "XPath não fornecido"}
                return self.selenium.click_by_xpath(xpath, timeout)
            
            elif action == "click_by_id":
                element_id = kwargs.get("id")
                timeout = kwargs.get("timeout", 10)
                if not element_id:
                    return {"success": False, "error": "ID não fornecido"}
                return self.selenium.click_by_id(element_id, timeout)
            
            elif action == "fill_form":
                xpath = kwargs.get("xpath")
                text = kwargs.get("text", "")
                timeout = kwargs.get("timeout", 10)
                if not xpath:
                    return {"success": False, "error": "XPath não fornecido"}
                return self.selenium.fill_form(xpath, text, timeout)
            
            elif action == "fill_form_by_id":
                element_id = kwargs.get("id")
                text = kwargs.get("text", "")
                timeout = kwargs.get("timeout", 10)
                if not element_id:
                    return {"success": False, "error": "ID não fornecido"}
                return self.selenium.fill_form_by_id(element_id, text, timeout)
            
            elif action == "submit_form":
                xpath = kwargs.get("xpath")
                return self.selenium.submit_form(xpath)
            
            elif action == "press_key":
                key = kwargs.get("key")
                xpath = kwargs.get("xpath")
                if not key:
                    return {"success": False, "error": "Tecla não fornecida"}
                return self.selenium.press_key(key, xpath)
            
            elif action == "take_screenshot":
                filename = kwargs.get("filename")
                save = kwargs.get("save", True)
                return self.selenium.take_screenshot(filename, save)
            
            elif action == "wait_for_element":
                xpath = kwargs.get("xpath")
                timeout = kwargs.get("timeout", 10)
                if not xpath:
                    return {"success": False, "error": "XPath não fornecido"}
                return self.selenium.wait_for_element(xpath, timeout)
            
            elif action == "get_elements_by_xpath":
                xpath = kwargs.get("xpath")
                if not xpath:
                    return {"success": False, "error": "XPath não fornecido"}
                return self.selenium.get_elements_by_xpath(xpath)
            
            elif action == "scroll_to_element":
                xpath = kwargs.get("xpath")
                if not xpath:
                    return {"success": False, "error": "XPath não fornecido"}
                return self.selenium.scroll_to_element(xpath)
            
            elif action == "scroll_page":
                direction = kwargs.get("direction", "down")
                pixels = kwargs.get("pixels", 500)
                return self.selenium.scroll_page(direction, pixels)
            
            elif action == "execute_javascript":
                script = kwargs.get("script")
                if not script:
                    return {"success": False, "error": "Script não fornecido"}
                return self.selenium.execute_javascript(script)
            
            elif action == "get_cookies":
                return self.selenium.get_cookies()
            
            elif action == "add_cookie":
                name = kwargs.get("name")
                value = kwargs.get("value")
                domain = kwargs.get("domain")
                if not name or not value:
                    return {"success": False, "error": "Nome e valor do cookie são obrigatórios"}
                return self.selenium.add_cookie(name, value, domain)
            
            elif action == "switch_to_frame":
                xpath = kwargs.get("xpath")
                index = kwargs.get("index")
                return self.selenium.switch_to_frame(xpath, index)
            
            elif action == "switch_to_default_content":
                return self.selenium.switch_to_default_content()
            
            elif action == "switch_to_window":
                window_handle = kwargs.get("window_handle")
                if not window_handle:
                    return {"success": False, "error": "Window handle não fornecido"}
                return self.selenium.switch_to_window(window_handle)
            
            elif action == "get_window_handles":
                return self.selenium.get_window_handles()
            
            elif action == "close_window":
                return self.selenium.close_window()
            
            else:
                return {
                    "success": False,
                    "error": f"Ação '{action}' não reconhecida. Ações disponíveis: start, stop, navigate_to, get_page_content, click_by_xpath, click_by_id, fill_form, fill_form_by_id, submit_form, press_key, take_screenshot, wait_for_element, get_elements_by_xpath, scroll_to_element, scroll_page, execute_javascript, get_cookies, add_cookie, switch_to_frame, switch_to_default_content, switch_to_window, get_window_handles, close_window"
                }
        
        except Exception as e:
            logger.error(f"Erro ao executar ação web: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_function_schema(self) -> Dict[str, Any]:
        """Obter schema da função para AutoGen v2"""
        return {
            "name": "web_browsing",
            "description": "Automação web completa usando Selenium. Permite navegar na web, clicar em elementos, preencher formulários, fazer scraping, capturar screenshots, executar JavaScript, gerenciar cookies, alternar entre frames e janelas, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": [
                            "start",
                            "stop",
                            "navigate_to",
                            "get_page_content",
                            "click_by_xpath",
                            "click_by_id",
                            "fill_form",
                            "fill_form_by_id",
                            "submit_form",
                            "press_key",
                            "take_screenshot",
                            "wait_for_element",
                            "get_elements_by_xpath",
                            "scroll_to_element",
                            "scroll_page",
                            "execute_javascript",
                            "get_cookies",
                            "add_cookie",
                            "switch_to_frame",
                            "switch_to_default_content",
                            "switch_to_window",
                            "get_window_handles",
                            "close_window"
                        ],
                        "description": "Ação a executar"
                    },
                    "url": {
                        "type": "string",
                        "description": "URL para navegar (para navigate_to)"
                    },
                    "xpath": {
                        "type": "string",
                        "description": "XPath do elemento (para click_by_xpath, fill_form, wait_for_element, etc.)"
                    },
                    "id": {
                        "type": "string",
                        "description": "ID do elemento (para click_by_id, fill_form_by_id)"
                    },
                    "text": {
                        "type": "string",
                        "description": "Texto para preencher (para fill_form, fill_form_by_id)"
                    },
                    "key": {
                        "type": "string",
                        "enum": ["enter", "tab", "escape", "backspace", "delete", "arrow_up", "arrow_down", "arrow_left", "arrow_right"],
                        "description": "Tecla para pressionar (para press_key)"
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Timeout em segundos (padrão: 10)"
                    },
                    "filename": {
                        "type": "string",
                        "description": "Nome do arquivo para screenshot (para take_screenshot)"
                    },
                    "save": {
                        "type": "boolean",
                        "description": "Salvar screenshot (para take_screenshot)"
                    },
                    "direction": {
                        "type": "string",
                        "enum": ["up", "down"],
                        "description": "Direção do scroll (para scroll_page)"
                    },
                    "pixels": {
                        "type": "integer",
                        "description": "Pixels para rolar (para scroll_page)"
                    },
                    "script": {
                        "type": "string",
                        "description": "Script JavaScript para executar (para execute_javascript)"
                    },
                    "name": {
                        "type": "string",
                        "description": "Nome do cookie (para add_cookie)"
                    },
                    "value": {
                        "type": "string",
                        "description": "Valor do cookie (para add_cookie)"
                    },
                    "domain": {
                        "type": "string",
                        "description": "Domínio do cookie (para add_cookie)"
                    },
                    "index": {
                        "type": "integer",
                        "description": "Índice do frame (para switch_to_frame)"
                    },
                    "window_handle": {
                        "type": "string",
                        "description": "Handle da janela (para switch_to_window)"
                    }
                },
                "required": ["action"]
            }
        }
