"""
Execution Engine - Engine de execução unificado
Coordena execução de tarefas entre agentes
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from .resource_manager import ResourceManager

logger = logging.getLogger(__name__)


class ExecutionEngine:
    """
    Engine de execução unificado
    Coordena execução de tarefas entre agentes
    """
    
    def __init__(self, resource_manager: ResourceManager):
        self.resource_manager = resource_manager
        self.execution_history: List[Dict[str, Any]] = []
    
    async def execute(
        self,
        task: str,
        plan: Dict[str, Any],
        agents: Dict[str, Any],
        capabilities: Dict[str, Any],
        memory: Any
    ) -> Dict[str, Any]:
        """
        Executar tarefa usando plano
        
        Args:
            task: Descrição da tarefa
            plan: Plano de execução
            agents: Dicionário de agentes
            capabilities: Dicionário de capabilities
            memory: Gerenciador de memória
        
        Returns:
            Resultado da execução
        """
        logger.info(f"Executando tarefa: {task}")
        
        steps = plan.get("steps", [])
        results = []
        
        for i, step in enumerate(steps):
            logger.info(f"Executando passo {i+1}/{len(steps)}: {step.get('action')}")
            
            # Adquirir lock para passo
            async with self.resource_manager.acquire(f"step_{i}"):
                # Executar passo
                step_result = await self._execute_step(
                    step=step,
                    agents=agents,
                    capabilities=capabilities,
                    memory=memory
                )
                
                results.append(step_result)
                
                # Salvar na memória
                await memory.add_step_result(step, step_result)
        
        # Compilar resultado final
        final_result = {
            "task": task,
            "plan": plan,
            "steps": results,
            "success": all(r.get("success", False) for r in results),
        }
        
        # Salvar no histórico
        self.execution_history.append(final_result)
        
        return final_result
    
    async def _execute_step(
        self,
        step: Dict[str, Any],
        agents: Dict[str, Any],
        capabilities: Dict[str, Any],
        memory: Any
    ) -> Dict[str, Any]:
        """
        Executar um passo do plano
        
        Args:
            step: Passo a executar
            agents: Dicionário de agentes
            capabilities: Dicionário de capabilities
            memory: Gerenciador de memória
        
        Returns:
            Resultado do passo
        """
        action = step.get("action")
        agent_name = step.get("agent")
        params = step.get("params", {})
        
        # Obter agente
        agent = agents.get(agent_name)
        if not agent:
            return {
                "success": False,
                "error": f"Agente '{agent_name}' não encontrado"
            }
        
        try:
            # Executar ação do agente
            result = await agent.execute(action, params, memory)
            
            return {
                "success": True,
                "action": action,
                "agent": agent_name,
                "result": result
            }
        except Exception as e:
            logger.error(f"Erro ao executar passo: {e}")
            return {
                "success": False,
                "action": action,
                "agent": agent_name,
                "error": str(e)
            }
    
    def get_history(self) -> List[Dict[str, Any]]:
        """Obter histórico de execuções"""
        return self.execution_history.copy()

