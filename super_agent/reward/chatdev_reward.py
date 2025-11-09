"""
ChatDev Auto Reward System - Sistema de Auto-Recompensa do ChatDev
Baseado no sistema de recompensa do ChatDev
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class ChatDevRewardConfig:
    """Configuração do sistema de recompensa ChatDev"""
    
    # Recompensas base do ChatDev
    task_completion_reward: float = 1.0
    code_quality_reward: float = 0.5
    error_penalty: float = -0.5
    efficiency_reward: float = 0.3
    
    # Recompensas de colaboração (ChatDev)
    collaboration_reward: float = 0.2
    communication_reward: float = 0.1
    consensus_reward: float = 0.15
    
    # Recompensas de qualidade (ChatDev)
    code_style_reward: float = 0.2
    documentation_reward: float = 0.1
    test_coverage_reward: float = 0.2
    code_review_reward: float = 0.15
    
    # Recompensas de inovação (ChatDev)
    innovation_reward: float = 0.1
    optimization_reward: float = 0.1
    
    # Fatores de decaimento
    decay_factor: float = 0.95
    min_reward: float = -1.0
    max_reward: float = 1.0
    
    # Thresholds do ChatDev
    quality_threshold: float = 0.7
    efficiency_threshold: float = 0.6


class ChatDevRewardSystem:
    """
    Sistema de Auto-Recompensa baseado no ChatDev
    Avalia e recompensa agentes automaticamente
    """
    
    def __init__(self, config: Optional[ChatDevRewardConfig] = None):
        self.config = config or ChatDevRewardConfig()
        self.agent_rewards: Dict[str, List[Dict[str, Any]]] = {}
        self.agent_scores: Dict[str, float] = {}
        self.task_history: List[Dict[str, Any]] = []
        self.collaboration_history: List[Dict[str, Any]] = []
    
    def evaluate_agent(
        self,
        agent_name: str,
        task: str,
        result: Dict[str, Any],
        collaboration_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Avaliar e recompensar agente (estilo ChatDev)
        
        Args:
            agent_name: Nome do agente
            task: Tarefa executada
            result: Resultado da execução
            collaboration_data: Dados de colaboração
        
        Returns:
            Recompensa do agente
        """
        # Calcular recompensa base
        reward = 0.0
        metrics = {}
        reasons = []
        
        # Recompensa por conclusão da tarefa
        if result.get("success", False):
            reward += self.config.task_completion_reward
            reasons.append("Tarefa concluída com sucesso")
            metrics["completion"] = 1.0
        else:
            reward += self.config.error_penalty
            reasons.append("Erro ao executar tarefa")
            metrics["completion"] = 0.0
        
        # Recompensa por qualidade do código (ChatDev)
        if "code" in result:
            code_quality = self._evaluate_code_quality_chatdev(result["code"])
            reward += code_quality * self.config.code_quality_reward
            reasons.append(f"Qualidade do código: {code_quality:.2f}")
            metrics["code_quality"] = code_quality
        
        # Recompensa por eficiência (ChatDev)
        if "execution_time" in result:
            efficiency = self._evaluate_efficiency_chatdev(result["execution_time"])
            reward += efficiency * self.config.efficiency_reward
            reasons.append(f"Eficiência: {efficiency:.2f}")
            metrics["efficiency"] = efficiency
        
        # Recompensa por colaboração (ChatDev)
        if collaboration_data:
            collaboration = self._evaluate_collaboration_chatdev(collaboration_data)
            reward += collaboration * self.config.collaboration_reward
            reasons.append(f"Colaboração: {collaboration:.2f}")
            metrics["collaboration"] = collaboration
        
        # Recompensa por consenso (ChatDev)
        if "consensus" in result:
            consensus = result["consensus"]
            reward += consensus * self.config.consensus_reward
            reasons.append(f"Consenso: {consensus:.2f}")
            metrics["consensus"] = consensus
        
        # Recompensa por revisão de código (ChatDev)
        if "code_review" in result:
            code_review = result["code_review"]
            reward += code_review * self.config.code_review_reward
            reasons.append(f"Revisão de código: {code_review:.2f}")
            metrics["code_review"] = code_review
        
        # Recompensa por inovação (ChatDev)
        if "innovation" in result:
            innovation = result["innovation"]
            reward += innovation * self.config.innovation_reward
            reasons.append(f"Inovação: {innovation:.2f}")
            metrics["innovation"] = innovation
        
        # Recompensa por otimização (ChatDev)
        if "optimization" in result:
            optimization = result["optimization"]
            reward += optimization * self.config.optimization_reward
            reasons.append(f"Otimização: {optimization:.2f}")
            metrics["optimization"] = optimization
        
        # Aplicar limites
        reward = max(self.config.min_reward, min(self.config.max_reward, reward))
        
        # Criar recompensa
        agent_reward = {
            "agent_name": agent_name,
            "reward": reward,
            "reason": "; ".join(reasons),
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
        # Adicionar ao histórico
        if agent_name not in self.agent_rewards:
            self.agent_rewards[agent_name] = []
        self.agent_rewards[agent_name].append(agent_reward)
        
        # Atualizar score do agente
        self._update_agent_score(agent_name, reward)
        
        # Adicionar ao histórico de tarefas
        self.task_history.append({
            "agent": agent_name,
            "task": task,
            "result": result,
            "reward": reward,
            "timestamp": datetime.now().isoformat()
        })
        
        logger.info(f"Agente {agent_name} recebeu recompensa: {reward:.2f} - {agent_reward['reason']}")
        
        return agent_reward
    
    def _evaluate_code_quality_chatdev(self, code: str) -> float:
        """
        Avaliar qualidade do código (estilo ChatDev)
        
        Args:
            code: Código a avaliar
        
        Returns:
            Score de qualidade (0.0 a 1.0)
        """
        score = 0.0
        
        # Verificar se tem comentários
        if "#" in code or "//" in code or '"""' in code:
            score += 0.15
        
        # Verificar se tem tratamento de erros
        if "try:" in code or "except" in code:
            score += 0.15
        
        # Verificar se tem funções/métodos
        if "def " in code or "function" in code:
            score += 0.15
        
        # Verificar se tem validação de entrada
        if "if " in code and ("is None" in code or "is not None" in code):
            score += 0.15
        
        # Verificar se tem documentação
        if '"""' in code or "'''" in code:
            score += 0.15
        
        # Verificar se tem testes
        if "test" in code.lower() or "assert" in code:
            score += 0.15
        
        # Verificar se tem type hints (Python)
        if ":" in code and "->" in code:
            score += 0.10
        
        return min(1.0, score)
    
    def _evaluate_efficiency_chatdev(self, execution_time: float) -> float:
        """
        Avaliar eficiência (estilo ChatDev)
        
        Args:
            execution_time: Tempo de execução em segundos
        
        Returns:
            Score de eficiência (0.0 a 1.0)
        """
        # ChatDev considera eficiência baseada em threshold
        if execution_time < 1.0:
            return 1.0
        elif execution_time < 3.0:
            return 0.8
        elif execution_time < 5.0:
            return 0.6
        elif execution_time < 10.0:
            return 0.4
        else:
            return 0.2
    
    def _evaluate_collaboration_chatdev(self, collaboration_data: Dict[str, Any]) -> float:
        """
        Avaliar colaboração (estilo ChatDev)
        
        Args:
            collaboration_data: Dados de colaboração
        
        Returns:
            Score de colaboração (0.0 a 1.0)
        """
        score = 0.0
        
        # Verificar comunicação
        if collaboration_data.get("communication", 0) > 0:
            score += 0.3
        
        # Verificar consenso
        if collaboration_data.get("consensus", 0) > 0:
            score += 0.3
        
        # Verificar coordenação
        if collaboration_data.get("coordination", 0) > 0:
            score += 0.2
        
        # Verificar feedback
        if collaboration_data.get("feedback", 0) > 0:
            score += 0.2
        
        return min(1.0, score)
    
    def _update_agent_score(self, agent_name: str, reward: float):
        """Atualizar score do agente (estilo ChatDev)"""
        if agent_name not in self.agent_scores:
            self.agent_scores[agent_name] = 0.0
        
        # Aplicar decaimento (ChatDev)
        self.agent_scores[agent_name] *= self.config.decay_factor
        
        # Adicionar nova recompensa
        self.agent_scores[agent_name] += reward
        
        # Normalizar
        self.agent_scores[agent_name] = max(
            self.config.min_reward,
            min(self.config.max_reward, self.agent_scores[agent_name])
        )
    
    def evaluate_collaboration(
        self,
        agents: List[str],
        task: str,
        result: Dict[str, Any]
    ) -> Dict[str, float]:
        """
        Avaliar colaboração entre agentes (ChatDev)
        
        Args:
            agents: Lista de agentes envolvidos
            task: Tarefa executada
            result: Resultado da execução
        
        Returns:
            Recompensas por agente
        """
        rewards = {}
        
        # Avaliar cada agente
        for agent_name in agents:
            agent_reward = self.evaluate_agent(
                agent_name=agent_name,
                task=task,
                result=result,
                collaboration_data={
                    "communication": result.get("communication", 0),
                    "consensus": result.get("consensus", 0),
                    "coordination": result.get("coordination", 0),
                    "feedback": result.get("feedback", 0),
                }
            )
            rewards[agent_name] = agent_reward["reward"]
        
        # Adicionar ao histórico de colaboração
        self.collaboration_history.append({
            "agents": agents,
            "task": task,
            "rewards": rewards,
            "timestamp": datetime.now().isoformat()
        })
        
        return rewards
    
    def get_agent_score(self, agent_name: str) -> float:
        """Obter score atual do agente"""
        return self.agent_scores.get(agent_name, 0.0)
    
    def get_agent_rewards(self, agent_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Obter histórico de recompensas do agente"""
        rewards = self.agent_rewards.get(agent_name, [])
        return rewards[-limit:]
    
    def get_top_agents(self, limit: int = 5) -> List[tuple[str, float]]:
        """Obter top agentes por score"""
        sorted_agents = sorted(
            self.agent_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        return sorted_agents[:limit]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Obter estatísticas do sistema de recompensa"""
        return {
            "total_agents": len(self.agent_scores),
            "total_tasks": len(self.task_history),
            "total_collaborations": len(self.collaboration_history),
            "top_agents": self.get_top_agents(5),
            "average_reward": np.mean([
                r["reward"]
                for rewards in self.agent_rewards.values()
                for r in rewards
            ]) if self.agent_rewards else 0.0,
        }
    
    def reset_agent(self, agent_name: str):
        """Resetar score e histórico do agente"""
        if agent_name in self.agent_scores:
            del self.agent_scores[agent_name]
        if agent_name in self.agent_rewards:
            del self.agent_rewards[agent_name]
        logger.info(f"Agente {agent_name} resetado")
    
    def reset_all(self):
        """Resetar todo o sistema"""
        self.agent_scores.clear()
        self.agent_rewards.clear()
        self.task_history.clear()
        self.collaboration_history.clear()
        logger.info("Sistema de recompensa resetado")

