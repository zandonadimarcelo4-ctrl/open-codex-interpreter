"""
ANIMA Editor Agent - After Effects Integration
Integração com After Effects MCP Vision para edição de vídeo com visão visual
"""

from __future__ import annotations

import logging
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class Composition:
    """Representa uma composição do After Effects"""
    name: str
    width: int
    height: int
    duration: float
    frame_rate: float = 30.0
    index: Optional[int] = None


@dataclass
class Layer:
    """Representa uma camada do After Effects"""
    name: str
    type: str
    source: Optional[str] = None
    index: Optional[int] = None
    properties: Optional[Dict[str, Any]] = None


@dataclass
class Keyframe:
    """Representa um keyframe de animação"""
    property: str
    time: float
    value: Any
    easing: Optional[str] = None


@dataclass
class RenderSettings:
    """Configurações de renderização"""
    format: str = "mp4"
    quality: str = "high"
    codec: str = "h264"
    frame_rate: Optional[float] = None
    resolution: Optional[Tuple[int, int]] = None


@dataclass
class CompositionAnalysis:
    """Análise de composição usando VLM"""
    score: float
    issues: List[str]
    suggestions: List[str]
    embedding: Optional[List[float]] = None


class AEMCPClient:
    """
    Cliente MCP para After Effects
    Comunica com o servidor MCP do After Effects
    """
    
    def __init__(self, mcp_client: Any):
        """
        Inicializar cliente MCP
        
        Args:
            mcp_client: Cliente MCP configurado
        """
        self.mcp_client = mcp_client
        logger.info("AEMCPClient inicializado")
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Chamar ferramenta MCP
        
        Args:
            tool_name: Nome da ferramenta MCP
            arguments: Argumentos da ferramenta
        
        Returns:
            Resultado da ferramenta
        """
        try:
            result = await self.mcp_client.call_tool(
                name=tool_name,
                arguments=arguments
            )
            
            # Parse resultado
            if result.content and len(result.content) > 0:
                content = result.content[0].text
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return {"result": content}
            
            return {"result": "success"}
        except Exception as e:
            logger.error(f"Erro ao chamar ferramenta {tool_name}: {e}")
            raise
    
    async def create_composition(
        self,
        name: str,
        width: int,
        height: int,
        duration: float,
        frame_rate: float = 30.0,
        background_color: Optional[Dict[str, int]] = None
    ) -> Composition:
        """
        Criar nova composição
        
        Args:
            name: Nome da composição
            width: Largura em pixels
            height: Altura em pixels
            duration: Duração em segundos
            frame_rate: Taxa de quadros por segundo
            background_color: Cor de fundo (RGB)
        
        Returns:
            Composição criada
        """
        arguments = {
            "name": name,
            "width": width,
            "height": height,
            "duration": duration,
            "frameRate": frame_rate
        }
        
        if background_color:
            arguments["backgroundColor"] = background_color
        
        result = await self.call_tool("ae_create_composition", arguments)
        
        return Composition(
            name=name,
            width=width,
            height=height,
            duration=duration,
            frame_rate=frame_rate,
            index=result.get("index")
        )
    
    async def list_compositions(self) -> List[Composition]:
        """
        Listar todas as composições
        
        Returns:
            Lista de composições
        """
        result = await self.call_tool("ae_list_compositions", {})
        
        compositions = []
        for comp_data in result.get("compositions", []):
            compositions.append(Composition(
                name=comp_data.get("name"),
                width=comp_data.get("width", 1920),
                height=comp_data.get("height", 1080),
                duration=comp_data.get("duration", 10.0),
                frame_rate=comp_data.get("frameRate", 30.0),
                index=comp_data.get("index")
            ))
        
        return compositions
    
    async def visualize_composition(self, comp_name: str) -> str:
        """
        Visualizar composição como imagem
        
        Args:
            comp_name: Nome da composição
        
        Returns:
            Caminho para imagem PNG
        """
        result = await self.call_tool("ae_visualize_composition", {
            "composition": comp_name
        })
        
        return result.get("imagePath", result.get("result", ""))
    
    async def add_layer(
        self,
        comp_name: str,
        layer_type: str,
        source: Optional[str] = None,
        name: Optional[str] = None
    ) -> Layer:
        """
        Adicionar camada à composição
        
        Args:
            comp_name: Nome da composição
            layer_type: Tipo de camada (text, solid, footage, etc.)
            source: Caminho para fonte (se aplicável)
            name: Nome da camada
        
        Returns:
            Camada criada
        """
        arguments = {
            "composition": comp_name,
            "layerType": layer_type
        }
        
        if source:
            arguments["source"] = source
        if name:
            arguments["name"] = name
        
        result = await self.call_tool("ae_add_layer", arguments)
        
        return Layer(
            name=result.get("name", name or f"Layer {result.get('index', 0)}"),
            type=layer_type,
            source=source,
            index=result.get("index"),
            properties=result.get("properties")
        )
    
    async def modify_layer(
        self,
        comp_name: str,
        layer_name: str,
        properties: Dict[str, Any]
    ) -> Layer:
        """
        Modificar propriedades da camada
        
        Args:
            comp_name: Nome da composição
            layer_name: Nome da camada
            properties: Propriedades a modificar
        
        Returns:
            Camada modificada
        """
        result = await self.call_tool("ae_modify_layer", {
            "composition": comp_name,
            "layer": layer_name,
            "properties": properties
        })
        
        return Layer(
            name=layer_name,
            type=result.get("type", "unknown"),
            properties=result.get("properties", properties)
        )
    
    async def add_keyframe(
        self,
        comp_name: str,
        layer_name: str,
        property: str,
        time: float,
        value: Any,
        easing: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Adicionar keyframe à camada
        
        Args:
            comp_name: Nome da composição
            layer_name: Nome da camada
            property: Propriedade a animar
            time: Tempo do keyframe
            value: Valor do keyframe
            easing: Tipo de easing (opcional)
        
        Returns:
            Resultado da operação
        """
        arguments = {
            "composition": comp_name,
            "layer": layer_name,
            "property": property,
            "time": time,
            "value": value
        }
        
        if easing:
            arguments["easing"] = easing
        
        return await self.call_tool("ae_add_keyframe", arguments)
    
    async def apply_template(
        self,
        template_path: str,
        comp_name: str,
        variables: Dict[str, Any]
    ) -> Composition:
        """
        Aplicar template à composição
        
        Args:
            template_path: Caminho para template AE
            comp_name: Nome da composição
            variables: Variáveis para substituir no template
        
        Returns:
            Composição com template aplicado
        """
        result = await self.call_tool("ae_apply_template", {
            "template": template_path,
            "composition": comp_name,
            "variables": variables
        })
        
        return Composition(
            name=comp_name,
            width=result.get("width", 1920),
            height=result.get("height", 1080),
            duration=result.get("duration", 10.0),
            frame_rate=result.get("frameRate", 30.0)
        )
    
    async def render_frame(self, comp_name: str, time: float) -> str:
        """
        Renderizar frame da composição
        
        Args:
            comp_name: Nome da composição
            time: Tempo do frame em segundos
        
        Returns:
            Caminho para imagem PNG renderizada
        """
        result = await self.call_tool("ae_render_frame", {
            "composition": comp_name,
            "time": time
        })
        
        return result.get("imagePath", result.get("result", ""))
    
    async def render_video(
        self,
        comp_name: str,
        output_path: str,
        settings: Optional[RenderSettings] = None
    ) -> str:
        """
        Renderizar vídeo da composição
        
        Args:
            comp_name: Nome da composição
            output_path: Caminho de saída
            settings: Configurações de renderização
        
        Returns:
            Caminho para vídeo renderizado
        """
        if settings is None:
            settings = RenderSettings()
        
        arguments = {
            "composition": comp_name,
            "outputPath": output_path,
            "format": settings.format,
            "quality": settings.quality,
            "codec": settings.codec
        }
        
        if settings.frame_rate:
            arguments["frameRate"] = settings.frame_rate
        if settings.resolution:
            arguments["width"] = settings.resolution[0]
            arguments["height"] = settings.resolution[1]
        
        result = await self.call_tool("ae_render_video", arguments)
        
        return result.get("videoPath", result.get("result", output_path))
    
    async def execute_script(self, script: str) -> Dict[str, Any]:
        """
        Executar script ExtendScript customizado
        
        Args:
            script: Código ExtendScript
        
        Returns:
            Resultado da execução
        """
        return await self.call_tool("ae_execute_script", {
            "script": script
        })


class AnimaEditorAgent:
    """
    Editor Agent da ANIMA
    Integra com After Effects via MCP para edição de vídeo com visão visual
    """
    
    def __init__(self, mcp_client: Any, vlm: Optional[Any] = None):
        """
        Inicializar Editor Agent
        
        Args:
            mcp_client: Cliente MCP configurado
            vlm: Vision-Language Model para análise visual (opcional)
        """
        self.ae_client = AEMCPClient(mcp_client)
        self.vlm = vlm
        logger.info("AnimaEditorAgent inicializado")
    
    async def create_video(
        self,
        task: Dict[str, Any],
        output_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Criar vídeo completo
        
        Args:
            task: Tarefa de edição de vídeo
            output_path: Caminho de saída (opcional)
        
        Returns:
            Resultado da edição
        """
        logger.info(f"Criando vídeo: {task.get('name', 'Untitled')}")
        
        # 1. Criar composição
        comp = await self.ae_client.create_composition(
            name=task.get("name", "Main Composition"),
            width=task.get("width", 1920),
            height=task.get("height", 1080),
            duration=task.get("duration", 60.0),
            frame_rate=task.get("frame_rate", 30.0)
        )
        
        # 2. Aplicar template se fornecido
        if task.get("template"):
            comp = await self.ae_client.apply_template(
                template_path=task["template"],
                comp_name=comp.name,
                variables=task.get("variables", {})
            )
        
        # 3. Adicionar camadas
        layers = []
        for layer_data in task.get("layers", []):
            layer = await self.ae_client.add_layer(
                comp_name=comp.name,
                layer_type=layer_data.get("type", "solid"),
                source=layer_data.get("source"),
                name=layer_data.get("name")
            )
            layers.append(layer)
            
            # Adicionar animações se fornecidas
            if layer_data.get("animations"):
                for anim in layer_data["animations"]:
                    await self.ae_client.add_keyframe(
                        comp_name=comp.name,
                        layer_name=layer.name,
                        property=anim.get("property"),
                        time=anim.get("time", 0),
                        value=anim.get("value"),
                        easing=anim.get("easing")
                    )
        
        # 4. Visualizar composição
        preview_path = await self.ae_client.visualize_composition(comp.name)
        
        # 5. Analisar qualidade (se VLM disponível)
        quality_analysis = None
        if self.vlm:
            quality_analysis = await self.analyze_composition(comp.name, preview_path)
        
        # 6. Renderizar vídeo final
        if output_path is None:
            output_path = f"{task.get('name', 'output')}.mp4"
        
        video_path = await self.ae_client.render_video(
            comp_name=comp.name,
            output_path=output_path,
            settings=task.get("render_settings")
        )
        
        return {
            "success": True,
            "composition": comp.name,
            "layers": [layer.name for layer in layers],
            "preview_path": preview_path,
            "video_path": video_path,
            "quality_analysis": quality_analysis
        }
    
    async def analyze_composition(
        self,
        comp_name: str,
        image_path: Optional[str] = None
    ) -> CompositionAnalysis:
        """
        Analisar composição usando VLM
        
        Args:
            comp_name: Nome da composição
            image_path: Caminho para imagem (opcional, será renderizada se não fornecido)
        
        Returns:
            Análise da composição
        """
        if not self.vlm:
            logger.warning("VLM não disponível, pulando análise")
            return CompositionAnalysis(
                score=0.5,
                issues=[],
                suggestions=[]
            )
        
        # Renderizar frame se necessário
        if image_path is None:
            image_path = await self.ae_client.render_frame(comp_name, 0.0)
        
        # Analisar com VLM
        analysis = await self.vlm.analyze_composition(image_path)
        
        return CompositionAnalysis(
            score=analysis.get("score", 0.5),
            issues=analysis.get("issues", []),
            suggestions=analysis.get("suggestions", []),
            embedding=analysis.get("embedding")
        )
    
    async def apply_template(
        self,
        template_path: str,
        comp_name: str,
        variables: Dict[str, Any]
    ) -> Composition:
        """
        Aplicar template à composição
        
        Args:
            template_path: Caminho para template
            comp_name: Nome da composição
            variables: Variáveis para substituir
        
        Returns:
            Composição com template aplicado
        """
        return await self.ae_client.apply_template(
            template_path=template_path,
            comp_name=comp_name,
            variables=variables
        )
    
    async def debug_animation(
        self,
        comp_name: str,
        time_points: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """
        Debug de animação renderizando frames-chave
        
        Args:
            comp_name: Nome da composição
            time_points: Pontos de tempo para renderizar (opcional)
        
        Returns:
            Resultado do debug
        """
        if time_points is None:
            # Renderizar frames em intervalos de 1 segundo
            comps = await self.ae_client.list_compositions()
            comp = next((c for c in comps if c.name == comp_name), None)
            if comp:
                time_points = [i for i in range(0, int(comp.duration), 1)]
            else:
                time_points = [0.0, 1.0, 2.0]
        
        frames = []
        for time in time_points:
            frame_path = await self.ae_client.render_frame(comp_name, time)
            frames.append({
                "time": time,
                "path": frame_path
            })
        
        # Analisar frames com VLM se disponível
        analysis = None
        if self.vlm:
            analysis = await self.vlm.analyze_frames([f["path"] for f in frames])
        
        return {
            "frames": frames,
            "analysis": analysis
        }

