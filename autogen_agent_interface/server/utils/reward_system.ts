/**
 * Integração com sistema de auto-recompensa ChatDev
 * Usa o Super Agent Framework Python via bridge
 */

import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Avaliar e recompensar agente usando sistema ChatDev
 */
export async function evaluateAgent(
  agentName: string,
  task: string,
  result: Record<string, any>,
  collaborationData?: Record<string, any>
): Promise<{
  reward: number;
  reason: string;
  metrics: Record<string, any>;
}> {
  try {
    const pythonScript = `
import sys
import json
sys.path.insert(0, "${path.join(__dirname, "../../../super_agent")}")
from reward.chatdev_reward import ChatDevRewardSystem

reward_system = ChatDevRewardSystem()
result = ${JSON.stringify(result)}
collaboration_data = ${JSON.stringify(collaborationData || {})}

agent_reward = reward_system.evaluate_agent(
    agent_name="${agentName}",
    task="${task.replace(/"/g, '\\"')}",
    result=result,
    collaboration_data=collaboration_data
)

print(json.dumps({
    "success": True,
    "reward": agent_reward["reward"],
    "reason": agent_reward["reason"],
    "metrics": agent_reward["metrics"]
}))
`;
    
    return new Promise((resolve, reject) => {
      const python = spawn("python", ["-c", pythonScript]);
      let output = "";
      let error = "";
      
      python.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      python.stderr.on("data", (data) => {
        error += data.toString();
      });
      
      python.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve({
              reward: result.reward || 0,
              reason: result.reason || "",
              metrics: result.metrics || {},
            });
          } catch (e) {
            // Se falhar, retornar valores padrão
            resolve({
              reward: 0,
              reason: "Sistema de recompensa não disponível",
              metrics: {},
            });
          }
        } else {
          // Se falhar, retornar valores padrão
          resolve({
            reward: 0,
            reason: "Sistema de recompensa não disponível",
            metrics: {},
          });
        }
      });
    });
  } catch (error) {
    console.error("[Reward] Erro ao avaliar agente:", error);
    return {
      reward: 0,
      reason: "Erro ao avaliar agente",
      metrics: {},
    };
  }
}

/**
 * Avaliar colaboração entre agentes
 */
export async function evaluateCollaboration(
  agents: string[],
  task: string,
  result: Record<string, any>
): Promise<Record<string, number>> {
  try {
    const pythonScript = `
import sys
import json
sys.path.insert(0, "${path.join(__dirname, "../../../super_agent")}")
from reward.chatdev_reward import ChatDevRewardSystem

reward_system = ChatDevRewardSystem()
agents = ${JSON.stringify(agents)}
result = ${JSON.stringify(result)}

rewards = reward_system.evaluate_collaboration(
    agents=agents,
    task="${task.replace(/"/g, '\\"')}",
    result=result
)

print(json.dumps({"success": True, "rewards": rewards}))
`;
    
    return new Promise((resolve, reject) => {
      const python = spawn("python", ["-c", pythonScript]);
      let output = "";
      
      python.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      python.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve(result.rewards || {});
          } catch (e) {
            resolve({});
          }
        } else {
          resolve({});
        }
      });
    });
  } catch (error) {
    console.error("[Reward] Erro ao avaliar colaboração:", error);
    return {};
  }
}

