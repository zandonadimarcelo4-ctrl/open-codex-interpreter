/**
 * Planner Agent
 * Inspirado no AgenticSeek - Divide tarefas complexas em subtarefas
 * 
 * Este módulo implementa:
 * - Divisão de tarefas complexas em subtarefas
 * - Gerenciamento de dependências entre agentes
 * - Atualização dinâmica de planos
 * - Coordenação de múltiplos agentes
 */

import { AgentType } from "./intelligent_router";

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
 * Generate execution plan from complex task
 * Uses LLM to break down task into subtasks
 */
export async function generatePlan(
  task: string,
  availableAgents: AgentType[] = ["coder", "web", "files", "system"]
): Promise<ExecutionPlan> {
  // For now, create a simple plan structure
  // In production, this would use LLM to generate plan
  
  const plan: ExecutionPlan = {
    goal: task,
    tasks: [],
    status: "planning",
  };
  
  // Simple heuristic-based planning
  // In production, use LLM to generate JSON plan similar to AgenticSeek
  
  // Check if task requires multiple steps
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
    return plan;
  }
  
  // Update task status
  task.status = success ? "completed" : "failed";
  task.result = result;
  if (error) {
    task.error = error;
  }
  
  // If task failed, may need to add recovery tasks
  if (!success && plan.status === "executing") {
    // Add recovery task if needed
    // This is simplified - in production, use LLM to generate recovery plan
    const recoveryTask: TaskPlan = {
      id: `${taskId}_recovery`,
      agent: task.agent,
      task: `Recover from failed task: ${task.task}`,
      need: [taskId],
      status: "pending",
    };
    plan.tasks.push(recoveryTask);
  }
  
  // Check if all tasks are completed
  const allCompleted = plan.tasks.every(t => t.status === "completed" || t.status === "failed");
  if (allCompleted) {
    plan.status = "completed";
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
 */
export function generatePlanPrompt(task: string): string {
  return `You are a PLANNING AGENT. Your goal is to divide complex tasks into smaller, manageable subtasks.

TASK: ${task}

Available agents:
- coder: For coding, scripting, programming tasks
- web: For web search, browsing, online research
- files: For file operations, organization, management
- system: For system commands, process management

Create a plan in JSON format:
\`\`\`json
{
  "plan": [
    {
      "agent": "agent_name",
      "id": "1",
      "need": [],
      "task": "description of task"
    },
    {
      "agent": "agent_name",
      "id": "2",
      "need": ["1"],
      "task": "description of task that depends on task 1"
    }
  ]
}
\`\`\`

Rules:
- Break task into clear, actionable steps
- Assign appropriate agents to each step
- Manage dependencies between steps (use "need" field)
- Each task should be specific and executable
- Tasks should build upon previous tasks
- Final task should complete the goal

Generate the plan now:`;
}

/**
 * Parse plan from LLM response
 * Extracts JSON plan from LLM response
 */
export function parsePlanFromResponse(response: string): ExecutionPlan | null {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      return null;
    }
    
    const planData = JSON.parse(jsonMatch[1]);
    if (!planData.plan || !Array.isArray(planData.plan)) {
      return null;
    }
    
    const tasks: TaskPlan[] = planData.plan.map((task: any, index: number) => ({
      id: task.id || String(index + 1),
      agent: task.agent as AgentType,
      task: task.task || "",
      need: Array.isArray(task.need) ? task.need : [],
      status: "pending" as const,
    }));
    
    return {
      goal: "",
      tasks,
      status: "executing",
    };
  } catch (error) {
    console.error("[Planner] Error parsing plan:", error);
    return null;
  }
}

