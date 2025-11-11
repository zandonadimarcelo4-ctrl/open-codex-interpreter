/**
 * Planner Agent
 * Inspirado no AgenticSeek - Divide tarefas complexas em subtarefas
 * 
 * Este módulo implementa:
 * - Divisão de tarefas complexas em subtarefas usando LLM real
 * - Gerenciamento de dependências entre agentes
 * - Atualização dinâmica de planos
 * - Coordenação de múltiplos agentes
 * - Recuperação automática de falhas
 * 
 * @module planner_agent
 * @author ANIMA Project
 * @since 1.0.0
 */

import { AgentType } from "./intelligent_router";
import { callOllamaChat, OllamaChatMessage } from "./ollama";
import { withErrorHandling } from "./error_handler";
import { validateNonEmptyString } from "./validators";

export interface TaskPlan {
  id: string;
  agent: AgentType;
  task: string;
  need: string[]; // IDs of tasks this task depends on
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: string;
  error?: string;
}

export interface ExecutionPlan {
  goal: string;
  tasks: TaskPlan[];
  status: "planning" | "executing" | "completed" | "failed";
  currentTaskId?: string;
}

/**
 * Generate execution plan from complex task using LLM
 * Uses Ollama to break down task into subtasks with dependencies
 * 
 * @param task - Task description to plan
 * @param availableAgents - List of available agents (default: all)
 * @param model - Ollama model to use (default: from env)
 * @returns Execution plan with tasks and dependencies
 * @throws {ValidationError} If task is empty
 * @throws {ExecutionError} If LLM fails to generate plan
 * 
 * @example
 * ```typescript
 * const plan = await generatePlan(
 *   "Search for weather API and build a Python app using it",
 *   ["coder", "web", "files"]
 * );
 * // Returns: ExecutionPlan with tasks and dependencies
 * ```
 */
export async function generatePlan(
  task: string,
  availableAgents: AgentType[] = ["coder", "web", "files", "system"],
  model?: string
): Promise<ExecutionPlan> {
  return withErrorHandling(async () => {
    validateNonEmptyString(task, "task");
    
    console.log(`[Planner] 🧠 Gerando plano para tarefa: "${task.substring(0, 100)}..."`);
    
    // Tentar usar LLM para gerar plano inteligente
    try {
      const prompt = generatePlanPrompt(task, availableAgents);
      const messages: OllamaChatMessage[] = [
        {
          role: "system",
          content: "You are an expert PLANNING AGENT. You break down complex tasks into smaller, manageable subtasks with clear dependencies. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ];
      
      console.log(`[Planner] 🤖 Chamando LLM para gerar plano...`);
      const response = await callOllamaChat(messages, model, {
        temperature: 0.3, // Mais determinístico para planos
        top_p: 0.9,
        num_predict: 2048, // Plano pode ser longo
      });
      
      console.log(`[Planner] ✅ Resposta do LLM recebida`);
      
      // Tentar parsear plano da resposta
      const parsedPlan = parsePlanFromResponse(response);
      if (parsedPlan) {
        parsedPlan.goal = task;
        parsedPlan.status = "executing";
        console.log(`[Planner] ✅ Plano gerado com ${parsedPlan.tasks.length} tarefas`);
        return parsedPlan;
      }
      
      // Se parsing falhou, usar fallback heurístico
      console.warn(`[Planner] ⚠️ Falha ao parsear plano do LLM, usando fallback heurístico`);
    } catch (error) {
      console.warn(`[Planner] ⚠️ Erro ao gerar plano com LLM: ${error}, usando fallback heurístico`);
    }
    
    // Fallback: usar heurísticas simples
    return generatePlanHeuristic(task, availableAgents);
  }, { context: "generatePlan", task });
}

/**
 * Generate plan using heuristics (fallback when LLM fails)
 * 
 * @param task - Task description
 * @param availableAgents - List of available agents
 * @returns Execution plan with tasks
 */
function generatePlanHeuristic(
  task: string,
  _availableAgents: AgentType[]
): ExecutionPlan {
  const plan: ExecutionPlan = {
    goal: task,
    tasks: [],
    status: "planning",
  };
  
  const taskLower = task.toLowerCase();
  
  // Detect sequential operations
  if (taskLower.includes("search") && taskLower.includes("build")) {
    plan.tasks.push(
      {
        id: "1",
        agent: "web",
        task: "Search for required information and APIs",
        need: [],
        status: "pending",
      },
      {
        id: "2",
        agent: "files",
        task: "Create project structure and files",
        need: ["1"],
        status: "pending",
      },
      {
        id: "3",
        agent: "coder",
        task: "Implement solution based on research and structure",
        need: ["1", "2"],
        status: "pending",
      }
    );
  } else if (taskLower.includes("find") && taskLower.includes("analyze")) {
    plan.tasks.push(
      {
        id: "1",
        agent: "files",
        task: "Find required files",
        need: [],
        status: "pending",
      },
      {
        id: "2",
        agent: "coder",
        task: "Analyze files and generate results",
        need: ["1"],
        status: "pending",
      }
    );
  } else {
    // Single task - determine agent type
    let agentType: AgentType = "coder";
    if (taskLower.includes("search") || taskLower.includes("web") || taskLower.includes("browse")) {
      agentType = "web";
    } else if (taskLower.includes("file") || taskLower.includes("folder") || taskLower.includes("organize")) {
      agentType = "files";
    } else if (taskLower.includes("code") || taskLower.includes("script") || taskLower.includes("program")) {
      agentType = "coder";
    }
    
    plan.tasks.push({
      id: "1",
      agent: agentType,
      task: task,
      need: [],
      status: "pending",
    });
  }
  
  plan.status = "executing";
  return plan;
}

/**
 * Update plan based on task execution results
 * Similar to AgenticSeek planner_agent.update_plan()
 * 
 * @param plan - Current execution plan
 * @param taskId - ID of task that was executed
 * @param success - Whether task succeeded
 * @param result - Task execution result
 * @param error - Error message if task failed
 * @returns Updated execution plan
 * 
 * @example
 * ```typescript
 * const updatedPlan = updatePlan(plan, "1", true, "Task completed successfully");
 * ```
 */
export function updatePlan(
  plan: ExecutionPlan,
  taskId: string,
  success: boolean,
  result: string,
  error?: string
): ExecutionPlan {
  const task = plan.tasks.find(t => t.id === taskId);
  if (!task) {
    console.warn(`[Planner] ⚠️ Task ${taskId} not found in plan`);
    return plan;
  }
  
  // Update task status
  task.status = success ? "completed" : "failed";
  task.result = result;
  if (error) {
    task.error = error;
  }
  
  console.log(`[Planner] 📊 Task ${taskId} atualizada: ${task.status} (${success ? "✅" : "❌"})`);
  
  // If task failed, may need to add recovery tasks (simplified for now)
  if (!success && plan.status === "executing") {
    // Only add recovery if task is critical (not a recovery task itself)
    if (!taskId.includes("_recovery")) {
      console.log(`[Planner] 🔄 Adicionando tarefa de recuperação para task ${taskId}`);
      const recoveryTask: TaskPlan = {
        id: `${taskId}_recovery`,
        agent: task.agent,
        task: `Recover from failed task: ${task.task}. Error: ${error || "Unknown error"}`,
        need: [taskId],
        status: "pending",
      };
      plan.tasks.push(recoveryTask);
    }
  }
  
  // Check if all tasks are completed
  const allCompleted = plan.tasks.every(t => 
    t.status === "completed" || 
    (t.status === "failed" && t.id.includes("_recovery")) // Ignore failed recovery tasks
  );
  
  if (allCompleted) {
    plan.status = "completed";
    console.log(`[Planner] ✅ Plano concluído`);
  }
  
  // Check if plan failed (too many failures)
  const failureCount = plan.tasks.filter(t => t.status === "failed").length;
  if (failureCount > plan.tasks.length / 2) {
    plan.status = "failed";
    console.error(`[Planner] ❌ Plano falhou: ${failureCount}/${plan.tasks.length} tarefas falharam`);
  }
  
  return plan;
}

/**
 * Get next task to execute
 * Returns task that has all dependencies satisfied
 */
export function getNextTask(plan: ExecutionPlan): TaskPlan | null {
  // Find pending task with all dependencies completed
  for (const task of plan.tasks) {
    if (task.status !== "pending") {
      continue;
    }
    
    // Check if all dependencies are completed
    const dependenciesSatisfied = task.need.every(depId => {
      const depTask = plan.tasks.find(t => t.id === depId);
      return depTask?.status === "completed";
    });
    
    if (dependenciesSatisfied) {
      return task;
    }
  }
  
  return null;
}

/**
 * Generate plan prompt for LLM
 * Creates prompt that LLM can use to generate JSON plan
 * 
 * @param task - Task to plan
 * @param availableAgents - List of available agents
 * @returns Prompt string for LLM
 */
export function generatePlanPrompt(task: string, availableAgents: AgentType[] = ["coder", "web", "files", "system"]): string {
  const agentDescriptions: Record<AgentType, string> = {
    coder: "For coding, scripting, programming tasks. Can generate, edit, refactor, debug code in any language.",
    web: "For web search, browsing, online research. Can navigate websites, extract data, fill forms.",
    files: "For file operations, organization, management. Can read, write, create, delete, organize files and folders.",
    system: "For system commands, process management. Can execute shell commands, manage processes, system operations.",
    planner: "For complex multi-step planning. Coordinates other agents.",
    casual: "For casual conversation and general assistance.",
  };
  
  const agentsList = availableAgents
    .map(agent => `- ${agent}: ${agentDescriptions[agent] || "General purpose agent"}`)
    .join("\n");
  
  return `You are a PLANNING AGENT. Your goal is to divide complex tasks into smaller, manageable subtasks with clear dependencies.

TASK: ${task}

Available agents:
${agentsList}

IMPORTANT RULES:
1. Break the task into clear, actionable steps (typically 2-5 steps)
2. Assign the MOST APPROPRIATE agent to each step
3. Use "need" field to specify dependencies (task IDs that must complete first)
4. Each task should be specific, executable, and atomic
5. Tasks should build upon previous tasks logically
6. The final task should complete the overall goal
7. If task is simple (single step), create only one task
8. Use sequential IDs: "1", "2", "3", etc.

RESPOND WITH VALID JSON ONLY (no markdown, no explanations, just the JSON):
{
  "plan": [
    {
      "agent": "agent_name",
      "id": "1",
      "need": [],
      "task": "Clear, specific description of what this task does"
    },
    {
      "agent": "agent_name",
      "id": "2",
      "need": ["1"],
      "task": "Clear, specific description that depends on task 1"
    }
  ]
}

Generate the plan now (JSON only):`;
}

/**
 * Parse plan from LLM response
 * Extracts JSON plan from LLM response with multiple fallback strategies
 * 
 * @param response - LLM response containing plan
 * @returns Parsed execution plan or null if parsing fails
 */
export function parsePlanFromResponse(response: string): ExecutionPlan | null {
  try {
    let jsonString = response.trim();
    
    // Strategy 1: Try to extract JSON from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1].trim();
    }
    
    // Strategy 2: Try to find JSON object in response
    if (!jsonString.startsWith("{")) {
      const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        jsonString = jsonObjectMatch[0];
      }
    }
    
    // Strategy 3: Try to parse directly if it looks like JSON
    let planData: any;
    try {
      planData = JSON.parse(jsonString);
    } catch {
      // If direct parse fails, try to clean up the string
      jsonString = jsonString
        .replace(/^[^{]*/, "") // Remove text before first {
        .replace(/[^}]*$/, ""); // Remove text after last }
      planData = JSON.parse(jsonString);
    }
    
    // Validate plan structure
    if (!planData) {
      console.error("[Planner] ❌ Plan data is null or undefined");
      return null;
    }
    
    // Support both "plan" array and direct array
    const planArray = planData.plan || (Array.isArray(planData) ? planData : null);
    if (!planArray || !Array.isArray(planArray) || planArray.length === 0) {
      console.error("[Planner] ❌ Plan array is missing or empty");
      return null;
    }
    
    // Validate and map tasks
    const validAgents: AgentType[] = ["coder", "web", "files", "system", "planner", "casual"];
    const tasks: TaskPlan[] = planArray
      .map((task: any, index: number) => {
        // Validate agent type
        const agent = task.agent as AgentType;
        if (!validAgents.includes(agent)) {
          console.warn(`[Planner] ⚠️ Invalid agent type '${agent}', defaulting to 'coder'`);
        }
        
        return {
          id: task.id || String(index + 1),
          agent: validAgents.includes(agent) ? agent : "coder",
          task: task.task || task.description || "",
          need: Array.isArray(task.need) ? task.need : (task.depends_on ? [task.depends_on] : []),
          status: "pending" as const,
        };
      })
      .filter((task: TaskPlan) => task.task.length > 0); // Filter out empty tasks
    
    if (tasks.length === 0) {
      console.error("[Planner] ❌ No valid tasks found in plan");
      return null;
    }
    
    // Validate dependencies (ensure all referenced task IDs exist)
    const taskIds = new Set(tasks.map(t => t.id));
    for (const task of tasks) {
      task.need = task.need.filter(depId => taskIds.has(depId));
    }
    
    console.log(`[Planner] ✅ Plano parseado com sucesso: ${tasks.length} tarefas`);
    
    return {
      goal: "",
      tasks,
      status: "executing",
    };
  } catch (error) {
    console.error("[Planner] ❌ Erro ao parsear plano:", error);
    if (error instanceof Error) {
      console.error("[Planner] Detalhes:", error.message);
    }
    return null;
  }
}

