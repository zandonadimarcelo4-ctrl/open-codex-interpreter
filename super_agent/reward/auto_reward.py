"""
Auto Reward System - Sistema de Auto-Recompensa
Baseado no ChatDev, sistema de recompensa automática para agentes
Compatível com ChatDev Reward System
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
class RewardConfig:
    """Configuração do sistema de recompensa"""
    
    # Recompensas base
    task_completion_reward: float = 1.0
    code_quality_reward: float = 0.5
    error_penalty: float = -0.5
    efficiency_reward: float = 0.3
    
    # Recompensas de colaboração
    collaboration_reward: float = 0.2
    communication_reward: float = 0.1
    
    # Recompensas de qualidade
    code_style_reward: float = 0.2
    documentation_reward: float = 0.1
    test_coverage_reward: float = 0.2
    
    # Fatores de decaimento
    decay_factor: float = 0.95
    min_reward: float = -1.0
    max_reward: float = 1.0


@dataclass
class AgentReward:
    """Recompensa de um agente"""
    agent_name: str
    reward: float
    reason: str
    timestamp: datetime = field(default_factory=datetime.now)
    metrics: Dict[str, float] = field(default_factory=dict)


class AutoRewardSystem:
    """
    Sistema de Auto-Recompensa
    Baseado no ChatDev, avalia e recompensa agentes automaticamente
    """
    
    def __init__(self, config: Optional[RewardConfig] = None):
        self.config = config or RewardConfig()
        self.agent_rewards: Dict[str, List[AgentReward]] = {}
        self.agent_scores: Dict[str, float] = {}
        self.task_history: List[Dict[str, Any]] = []
    
    def evaluate_agent(
        self,
        agent_name: str,
        task: str,
        result: Dict[str, Any],
        metrics: Optional[Dict[str, float]] = None
    ) -> AgentReward:
        """
        Avaliar e recompensar agente
        
        Args:
            agent_name: Nome do agente
            task: Tarefa executada
            result: Resultado da execução
            metrics: Métricas adicionais
        
        Returns:
            Recompensa do agente
        """
        # Calcular recompensa base
        reward = 0.0
        reasons = []
        
        # Recompensa por conclusão da tarefa
        if result.get("success", False):
            reward += self.config.task_completion_reward
            reasons.append("Tarefa concluída com sucesso")
        else:
            reward += self.config.error_penalty
            reasons.append("Erro ao executar tarefa")
        
        # Recompensa por qualidade do código
        if "code" in result:
            code_quality = self._evaluate_code_quality(result["code"])
            reward += code_quality * self.config.code_quality_reward
            reasons.append(f"Qualidade do código: {code_quality:.2f}")
        
        # Recompensa por eficiência
        if "execution_time" in result:
            efficiency = self._evaluate_efficiency(result["execution_time"])
            reward += efficiency * self.config.efficiency_reward
            reasons.append(f"Eficiência: {efficiency:.2f}")
        
        # Recompensa por colaboração
        if "collaboration" in result:
            collaboration = result["collaboration"]
            reward += collaboration * self.config.collaboration_reward
            reasons.append(f"Colaboração: {collaboration:.2f}")
        
        # Recompensa por comunicação
        if "communication" in result:
            communication = result["communication"]
            reward += communication * self.config.communication_reward
            reasons.append(f"Comunicação: {communication:.2f}")
        
        # Recompensa por estilo de código
        if "code_style" in result:
            code_style = result["code_style"]
            reward += code_style * self.config.code_style_reward
            reasons.append(f"Estilo de código: {code_style:.2f}")
        
        # Recompensa por documentação
        if "documentation" in result:
            documentation = result["documentation"]
            reward += documentation * self.config.documentation_reward
            reasons.append(f"Documentação: {documentation:.2f}")
        
        # Recompensa por cobertura de testes
        if "test_coverage" in result:
            test_coverage = result["test_coverage"]
            reward += test_coverage * self.config.test_coverage_reward
            reasons.append(f"Cobertura de testes: {test_coverage:.2f}")
        
        # Aplicar limites
        reward = max(self.config.min_reward, min(self.config.max_reward, reward))
        
        # Criar recompensa
        agent_reward = AgentReward(
            agent_name=agent_name,
            reward=reward,
            reason="; ".join(reasons),
            metrics=metrics or {}
        )
        
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
        
        logger.info(f"Agente {agent_name} recebeu recompensa: {reward:.2f} - {agent_reward.reason}")
        
        return agent_reward
    
    def _evaluate_code_quality(self, code: str) -> float:
        """
        Avaliar qualidade do código
        
        Args:
            code: Código a avaliar
        
        Returns:
            Score de qualidade (0.0 a 1.0)
        """
        score = 0.0
        
        # Verificar se tem comentários
        if "#" in code or "//" in code or '"""' in code:
            score += 0.2
        
        # Verificar se tem tratamento de erros
        if "try:" in code or "except" in code:
            score += 0.2
        
        # Verificar se tem funções/métodos
        if "def " in code or "function" in code:
            score += 0.2
        
        # Verificar se tem validação de entrada
        if "if " in code and ("is None" in code or "is not None" in code):
            score += 0.2
        
        # Verificar se tem documentação
        if '"""' in code or "'''" in code:
            score += 0.2
        
        return min(1.0, score)
    
    def _evaluate_efficiency(self, execution_time: float) -> float:
        """
        Avaliar eficiência baseada no tempo de execução
        
        Args:
            execution_time: Tempo de execução em segundos
        
        Returns:
            Score de eficiência (0.0 a 1.0)
        """
        # Tempo ideal: < 1 segundo
        # Tempo aceitável: < 5 segundos
        # Tempo ruim: > 10 segundos
        
        if execution_time < 1.0:
            return 1.0
        elif execution_time < 5.0:
            return 0.7
        elif execution_time < 10.0:
            return 0.4
        else:
            return 0.1
    
    def _update_agent_score(self, agent_name: str, reward: float):
        """Atualizar score do agente"""
        if agent_name not in self.agent_scores:
            self.agent_scores[agent_name] = 0.0
        
        # Aplicar decaimento
        self.agent_scores[agent_name] *= self.config.decay_factor
        
        # Adicionar nova recompensa
        self.agent_scores[agent_name] += reward
        
        # Normalizar
        self.agent_scores[agent_name] = max(
            self.config.min_reward,
            min(self.config.max_reward, self.agent_scores[agent_name])
        )
    
    def get_agent_score(self, agent_name: str) -> float:
        """Obter score atual do agente"""
        return self.agent_scores.get(agent_name, 0.0)
    
    def get_agent_rewards(self, agent_name: str, limit: int = 10) -> List[AgentReward]:
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
            "top_agents": self.get_top_agents(5),
            "average_reward": np.mean([
                r.reward
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
        logger.info("Sistema de recompensa resetado")

