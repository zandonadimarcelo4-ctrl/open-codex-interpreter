"""
Selenium Web Integration - Automação Web Robusta
Integração com Selenium para navegação web completa
"""
from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
    from webdriver_manager.chrome import ChromeDriverManager
    from webdriver_manager.firefox import GeckoDriverManager
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Selenium não está instalado. Execute: pip install selenium webdriver-manager")

logger = logging.getLogger(__name__)


class SeleniumWebIntegration:
    """
    Integração com Selenium para automação web completa
    Suporta navegação, cliques, preenchimento de formulários, scraping, etc.
    """
    
    def __init__(self, headless: bool = False, browser: str = "chrome", workspace: Optional[Path] = None):
        """
        Inicializar integração Selenium
        
        Args:
            headless: Executar em modo headless (sem interface gráfica)
            browser: Navegador a usar ("chrome" ou "firefox")
            workspace: Workspace para salvar screenshots e logs
        """
        if not SELENIUM_AVAILABLE:
            raise ImportError("Selenium não está instalado. Execute: pip install selenium webdriver-manager")
        
        self.workspace = workspace or Path.cwd() / "selenium_workspace"
        self.workspace.mkdir(parents=True, exist_ok=True)
        self.screenshots_dir = self.workspace / "screenshots"
        self.screenshots_dir.mkdir(parents=True, exist_ok=True)
        
        self.headless = headless
        self.browser = browser.lower()
        self.driver: Optional[webdriver.Chrome | webdriver.Firefox] = None
        self.wait: Optional[WebDriverWait] = None
        
        logger.info(f"Selenium Web Integration inicializado (browser: {browser}, headless: {headless})")
    
    def _create_driver(self) -> webdriver.Chrome | webdriver.Firefox:
        """Criar driver do navegador"""
        if self.browser == "chrome":
            options = Options()
            if self.headless:
                options.add_argument("--headless")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920,1080")
            
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
        elif self.browser == "firefox":
            from selenium.webdriver.firefox.options import Options as FirefoxOptions
            from selenium.webdriver.firefox.service import Service as FirefoxService
            
            options = FirefoxOptions()
            if self.headless:
                options.add_argument("--headless")
            
            service = FirefoxService(GeckoDriverManager().install())
            driver = webdriver.Firefox(service=service, options=options)
        else:
            raise ValueError(f"Navegador não suportado: {self.browser}")
        
        driver.implicitly_wait(10)
        self.wait = WebDriverWait(driver, 20)
        return driver
    
    def start(self) -> Dict[str, Any]:
        """Iniciar navegador"""
        try:
            if self.driver is None:
                self.driver = self._create_driver()
                logger.info(f"Navegador {self.browser} iniciado")
                return {"success": True, "message": f"Navegador {self.browser} iniciado"}
            else:
                return {"success": True, "message": "Navegador já está em execução"}
        except Exception as e:
            logger.error(f"Erro ao iniciar navegador: {e}")
            return {"success": False, "error": str(e)}
    
    def stop(self) -> Dict[str, Any]:
        """Parar navegador"""
        try:
            if self.driver:
                self.driver.quit()
                self.driver = None
                self.wait = None
                logger.info("Navegador fechado")
                return {"success": True, "message": "Navegador fechado"}
            else:
                return {"success": True, "message": "Navegador já estava fechado"}
        except Exception as e:
            logger.error(f"Erro ao fechar navegador: {e}")
            return {"success": False, "error": str(e)}
    
    def navigate_to(self, url: str) -> Dict[str, Any]:
        """Navegar para uma URL"""
        try:
            if self.driver is None:
                self.start()
            
            self.driver.get(url)
            logger.info(f"Navegado para: {url}")
            return {
                "success": True,
                "url": url,
                "title": self.driver.title,
                "current_url": self.driver.current_url
            }
        except Exception as e:
            logger.error(f"Erro ao navegar para {url}: {e}")
            return {"success": False, "error": str(e), "url": url}
    
    def get_page_content(self) -> Dict[str, Any]:
        """Obter conteúdo da página"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            return {
                "success": True,
                "title": self.driver.title,
                "url": self.driver.current_url,
                "page_source": self.driver.page_source[:10000],  # Limitar tamanho
                "text": self.driver.find_element(By.TAG_NAME, "body").text[:5000]  # Limitar tamanho
            }
        except Exception as e:
            logger.error(f"Erro ao obter conteúdo da página: {e}")
            return {"success": False, "error": str(e)}
    
    def click_by_xpath(self, xpath: str, timeout: int = 10) -> Dict[str, Any]:
        """Clicar em elemento por XPath"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            element = WebDriverWait(self.driver, timeout).until(
                EC.element_to_be_clickable((By.XPATH, xpath))
            )
            element.click()
            logger.info(f"Clique em elemento XPath: {xpath}")
            return {"success": True, "xpath": xpath}
        except TimeoutException:
            logger.error(f"Timeout ao clicar em XPath: {xpath}")
            return {"success": False, "error": f"Timeout: elemento não encontrado", "xpath": xpath}
        except Exception as e:
            logger.error(f"Erro ao clicar em XPath {xpath}: {e}")
            return {"success": False, "error": str(e), "xpath": xpath}
    
    def click_by_id(self, element_id: str, timeout: int = 10) -> Dict[str, Any]:
        """Clicar em elemento por ID"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            element = WebDriverWait(self.driver, timeout).until(
                EC.element_to_be_clickable((By.ID, element_id))
            )
            element.click()
            logger.info(f"Clique em elemento ID: {element_id}")
            return {"success": True, "id": element_id}
        except TimeoutException:
            logger.error(f"Timeout ao clicar em ID: {element_id}")
            return {"success": False, "error": f"Timeout: elemento não encontrado", "id": element_id}
        except Exception as e:
            logger.error(f"Erro ao clicar em ID {element_id}: {e}")
            return {"success": False, "error": str(e), "id": element_id}
    
    def fill_form(self, xpath: str, text: str, timeout: int = 10) -> Dict[str, Any]:
        """Preencher formulário por XPath"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            element = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            element.clear()
            element.send_keys(text)
            logger.info(f"Formulário preenchido: {xpath}")
            return {"success": True, "xpath": xpath, "text": text}
        except TimeoutException:
            logger.error(f"Timeout ao preencher formulário XPath: {xpath}")
            return {"success": False, "error": f"Timeout: elemento não encontrado", "xpath": xpath}
        except Exception as e:
            logger.error(f"Erro ao preencher formulário XPath {xpath}: {e}")
            return {"success": False, "error": str(e), "xpath": xpath}
    
    def fill_form_by_id(self, element_id: str, text: str, timeout: int = 10) -> Dict[str, Any]:
        """Preencher formulário por ID"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            element = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.ID, element_id))
            )
            element.clear()
            element.send_keys(text)
            logger.info(f"Formulário preenchido: {element_id}")
            return {"success": True, "id": element_id, "text": text}
        except TimeoutException:
            logger.error(f"Timeout ao preencher formulário ID: {element_id}")
            return {"success": False, "error": f"Timeout: elemento não encontrado", "id": element_id}
        except Exception as e:
            logger.error(f"Erro ao preencher formulário ID {element_id}: {e}")
            return {"success": False, "error": str(e), "id": element_id}
    
    def submit_form(self, xpath: Optional[str] = None) -> Dict[str, Any]:
        """Submeter formulário"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            if xpath:
                element = self.driver.find_element(By.XPATH, xpath)
                element.submit()
            else:
                # Submeter formulário atual
                form = self.driver.find_element(By.TAG_NAME, "form")
                form.submit()
            
            logger.info("Formulário submetido")
            return {"success": True, "xpath": xpath}
        except Exception as e:
            logger.error(f"Erro ao submeter formulário: {e}")
            return {"success": False, "error": str(e)}
    
    def press_key(self, key: str, xpath: Optional[str] = None) -> Dict[str, Any]:
        """Pressionar tecla"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            key_map = {
                "enter": Keys.RETURN,
                "tab": Keys.TAB,
                "escape": Keys.ESCAPE,
                "backspace": Keys.BACKSPACE,
                "delete": Keys.DELETE,
                "arrow_up": Keys.ARROW_UP,
                "arrow_down": Keys.ARROW_DOWN,
                "arrow_left": Keys.ARROW_LEFT,
                "arrow_right": Keys.ARROW_RIGHT,
            }
            
            key_code = key_map.get(key.lower(), key)
            
            if xpath:
                element = self.driver.find_element(By.XPATH, xpath)
                element.send_keys(key_code)
            else:
                from selenium.webdriver.common.action_chains import ActionChains
                ActionChains(self.driver).send_keys(key_code).perform()
            
            logger.info(f"Tecla pressionada: {key}")
            return {"success": True, "key": key, "xpath": xpath}
        except Exception as e:
            logger.error(f"Erro ao pressionar tecla {key}: {e}")
            return {"success": False, "error": str(e), "key": key}
    
    def take_screenshot(self, filename: Optional[str] = None, save: bool = True) -> Dict[str, Any]:
        """Capturar screenshot"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            if filename is None:
                import time
                timestamp = int(time.time())
                filename = f"screenshot_{timestamp}.png"
            
            screenshot_path = self.screenshots_dir / filename
            
            self.driver.save_screenshot(str(screenshot_path))
            logger.info(f"Screenshot salvo em: {screenshot_path}")
            
            return {
                "success": True,
                "path": str(screenshot_path),
                "filename": filename
            }
        except Exception as e:
            logger.error(f"Erro ao capturar screenshot: {e}")
            return {"success": False, "error": str(e)}
    
    def wait_for_element(self, xpath: str, timeout: int = 10) -> Dict[str, Any]:
        """Aguardar elemento aparecer"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            element = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            logger.info(f"Elemento encontrado: {xpath}")
            return {"success": True, "xpath": xpath, "found": True}
        except TimeoutException:
            logger.warning(f"Timeout ao aguardar elemento: {xpath}")
            return {"success": False, "error": "Timeout: elemento não encontrado", "xpath": xpath, "found": False}
        except Exception as e:
            logger.error(f"Erro ao aguardar elemento {xpath}: {e}")
            return {"success": False, "error": str(e), "xpath": xpath}
    
    def get_elements_by_xpath(self, xpath: str) -> Dict[str, Any]:
        """Obter todos os elementos por XPath"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            elements = self.driver.find_elements(By.XPATH, xpath)
            elements_data = []
            for i, element in enumerate(elements):
                try:
                    elements_data.append({
                        "index": i,
                        "tag": element.tag_name,
                        "text": element.text[:200],  # Limitar tamanho
                        "href": element.get_attribute("href") if element.tag_name == "a" else None,
                        "id": element.get_attribute("id"),
                        "class": element.get_attribute("class")
                    })
                except:
                    pass
            
            logger.info(f"Encontrados {len(elements)} elementos com XPath: {xpath}")
            return {
                "success": True,
                "xpath": xpath,
                "count": len(elements),
                "elements": elements_data
            }
        except Exception as e:
            logger.error(f"Erro ao obter elementos XPath {xpath}: {e}")
            return {"success": False, "error": str(e), "xpath": xpath}
    
    def scroll_to_element(self, xpath: str) -> Dict[str, Any]:
        """Rolar até elemento"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            element = self.driver.find_element(By.XPATH, xpath)
            self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
            logger.info(f"Rolado até elemento: {xpath}")
            return {"success": True, "xpath": xpath}
        except Exception as e:
            logger.error(f"Erro ao rolar até elemento {xpath}: {e}")
            return {"success": False, "error": str(e), "xpath": xpath}
    
    def scroll_page(self, direction: str = "down", pixels: int = 500) -> Dict[str, Any]:
        """Rolar página"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            scroll_amount = pixels if direction == "down" else -pixels
            self.driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
            logger.info(f"Página rolada {direction} {pixels} pixels")
            return {"success": True, "direction": direction, "pixels": pixels}
        except Exception as e:
            logger.error(f"Erro ao rolar página: {e}")
            return {"success": False, "error": str(e)}
    
    def execute_javascript(self, script: str) -> Dict[str, Any]:
        """Executar JavaScript"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            result = self.driver.execute_script(script)
            logger.info("JavaScript executado")
            return {"success": True, "result": result, "script": script[:200]}  # Limitar tamanho
        except Exception as e:
            logger.error(f"Erro ao executar JavaScript: {e}")
            return {"success": False, "error": str(e), "script": script[:200]}
    
    def get_cookies(self) -> Dict[str, Any]:
        """Obter cookies"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            cookies = self.driver.get_cookies()
            return {"success": True, "cookies": cookies}
        except Exception as e:
            logger.error(f"Erro ao obter cookies: {e}")
            return {"success": False, "error": str(e)}
    
    def add_cookie(self, name: str, value: str, domain: Optional[str] = None) -> Dict[str, Any]:
        """Adicionar cookie"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            cookie = {"name": name, "value": value}
            if domain:
                cookie["domain"] = domain
            
            self.driver.add_cookie(cookie)
            logger.info(f"Cookie adicionado: {name}")
            return {"success": True, "name": name, "value": value}
        except Exception as e:
            logger.error(f"Erro ao adicionar cookie: {e}")
            return {"success": False, "error": str(e)}
    
    def switch_to_frame(self, xpath: Optional[str] = None, index: Optional[int] = None) -> Dict[str, Any]:
        """Alternar para frame"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            if xpath:
                frame = self.driver.find_element(By.XPATH, xpath)
                self.driver.switch_to.frame(frame)
            elif index is not None:
                self.driver.switch_to.frame(index)
            else:
                return {"success": False, "error": "XPath ou índice deve ser fornecido"}
            
            logger.info("Alternado para frame")
            return {"success": True, "xpath": xpath, "index": index}
        except Exception as e:
            logger.error(f"Erro ao alternar para frame: {e}")
            return {"success": False, "error": str(e)}
    
    def switch_to_default_content(self) -> Dict[str, Any]:
        """Alternar para conteúdo padrão"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            self.driver.switch_to.default_content()
            logger.info("Alternado para conteúdo padrão")
            return {"success": True}
        except Exception as e:
            logger.error(f"Erro ao alternar para conteúdo padrão: {e}")
            return {"success": False, "error": str(e)}
    
    def switch_to_window(self, window_handle: str) -> Dict[str, Any]:
        """Alternar para janela"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            self.driver.switch_to.window(window_handle)
            logger.info(f"Alternado para janela: {window_handle}")
            return {"success": True, "window_handle": window_handle}
        except Exception as e:
            logger.error(f"Erro ao alternar para janela: {e}")
            return {"success": False, "error": str(e)}
    
    def get_window_handles(self) -> Dict[str, Any]:
        """Obter handles de todas as janelas"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            handles = self.driver.window_handles
            return {"success": True, "handles": handles, "count": len(handles)}
        except Exception as e:
            logger.error(f"Erro ao obter handles de janelas: {e}")
            return {"success": False, "error": str(e)}
    
    def close_window(self) -> Dict[str, Any]:
        """Fechar janela atual"""
        try:
            if self.driver is None:
                return {"success": False, "error": "Navegador não está em execução"}
            
            self.driver.close()
            logger.info("Janela fechada")
            return {"success": True}
        except Exception as e:
            logger.error(f"Erro ao fechar janela: {e}")
            return {"success": False, "error": str(e)}
    
    def __enter__(self):
        """Context manager entry"""
        self.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.stop()

