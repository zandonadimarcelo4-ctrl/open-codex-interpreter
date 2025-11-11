/**
 * Intelligent Agent Router
 * Inspirado no AgenticSeek - Sistema de roteamento inteligente de agentes
 * 
 * Este módulo implementa:
 * - Classificação de tarefas usando múltiplos métodos
 * - Detecção de complexidade (LOW/HIGH)
 * - Roteamento para agente apropriado
 * - Few-shot learning para melhorar precisão
 */

export type AgentType = "coder" | "web" | "files" | "planner" | "casual" | "system";

export interface AgentSelection {
  agentType: AgentType;
  confidence: number;
  reason: string;
  complexity: "LOW" | "HIGH";
}

/**
 * Few-shot examples para classificação de tarefas
 * Baseado no AgenticSeek router.py
 */
const FEW_SHOT_EXAMPLES: Array<[string, AgentType]> = [
  // Coding tasks
  ["Write a python script to check if the device on my network is connected to the internet", "coder"],
  ["Can you debug this Java code? It's not working.", "coder"],
  ["can you make a snake game in python", "coder"],
  ["Write a Python function to sort a list of dictionaries by key", "coder"],
  ["Create a bash script to monitor CPU usage", "coder"],
  ["Debug this C++ code that keeps crashing", "coder"],
  ["Write a JavaScript function to reverse a string", "coder"],
  ["Create a Python script to download all images from a webpage", "coder"],
  
  // Web tasks
  ["Hey could you search the web for the latest news on the tesla stock market?", "web"],
  ["I would like you to search for weather api", "web"],
  ["Plan a 3-day trip to New York, including flights and hotels.", "web"],
  ["Find on the web the latest research papers on AI.", "web"],
  ["Can you browse the web and find me a 4090 for cheap?", "web"],
  ["Search the web for the best ways to learn a new language", "web"],
  ["Find recent articles on blockchain technology online", "web"],
  ["Search online for the best budget smartphones of 2025", "web"],
  
  // File tasks
  ["Hey, can you find the old_project.zip file somewhere on my drive?", "files"],
  ["Can you locate the backup folder I created last month on my system?", "files"],
  ["Could you check if the presentation.pdf file exists in my downloads?", "files"],
  ["Search my drive for a file called vacation_photos_2023.jpg.", "files"],
  ["Help me organize my desktop files into folders by type.", "files"],
  ["Move all .txt files from Downloads to a new folder called Notes", "files"],
  ["Locate the file 'presentation.pptx' in my Documents folder", "files"],
  ["Check if the folder 'Work_Projects' exists on my desktop", "files"],
  
  // Casual tasks
  ["Tell me a funny story", "casual"],
  ["Share a random fun fact about space.", "casual"],
  ["What's your favorite movie and why?", "casual"],
  ["Hi, how are you?", "casual"],
  ["Tell me a quick joke", "casual"],
];

/**
 * Complex task examples (HIGH complexity)
 * Tarefas que requerem múltiplos agentes e planejamento
 */
const COMPLEX_TASK_KEYWORDS = [
  "and then",
  "find and",
  "search and build",
  "find and create",
  "search and make",
  "analyze and",
  "create a whole",
  "make a plan",
  "organize and then",
  "find and use",
  "search and develop",
  "retrieve and develop",
  "find and build",
];

/**
 * Estimate task complexity
 * LOW: Simple task that can be handled by a single agent
 * HIGH: Complex task that requires planning and multiple agents
 */
export function estimateComplexity(task: string): "LOW" | "HIGH" {
  const taskLower = task.toLowerCase();
  
  // Check for complex task patterns
  if (COMPLEX_TASK_KEYWORDS.some(keyword => taskLower.includes(keyword))) {
    return "HIGH";
  }
  
  // Check for multiple actions
  const actionWords = ["and", "then", "after", "also", "plus", "additionally"];
  const actionCount = actionWords.filter(word => taskLower.includes(word)).length;
  
  if (actionCount >= 2) {
    return "HIGH";
  }
  
  // Check for planning keywords
  const planningKeywords = ["plan", "organize", "create a", "build a", "develop a", "make a"];
  if (planningKeywords.some(keyword => taskLower.includes(keyword)) && task.length > 100) {
    return "HIGH";
  }
  
  return "LOW";
}

/**
 * Classify task using keyword matching and few-shot examples
 * Simula o comportamento do AgenticSeek router
 */
export function classifyTask(task: string): AgentType {
  const taskLower = task.toLowerCase();
  
  // Keyword-based classification (fast path)
  const codingKeywords = [
    "write", "code", "script", "program", "function", "debug", "fix", "create a",
    "implement", "develop", "build", "make a", "generate code"
  ];
  
  const webKeywords = [
    "search", "find", "browse", "web", "internet", "online", "website", "url",
    "api", "google", "lookup", "research", "article", "news"
  ];
  
  const fileKeywords = [
    "file", "folder", "directory", "find file", "locate", "read file", "write file",
    "organize", "move", "copy", "delete", "create folder", "list files"
  ];
  
  const casualKeywords = [
    "hello", "hi", "hey", "tell me", "what's", "how are", "joke", "story",
    "fun fact", "explain", "what is", "who is"
  ];
  
  // Count keyword matches
  const codingScore = codingKeywords.filter(kw => taskLower.includes(kw)).length;
  const webScore = webKeywords.filter(kw => taskLower.includes(kw)).length;
  const fileScore = fileKeywords.filter(kw => taskLower.includes(kw)).length;
  const casualScore = casualKeywords.filter(kw => taskLower.includes(kw)).length;
  
  // If task is very short, likely casual
  if (task.length < 20 && casualScore > 0) {
    return "casual";
  }
  
  // Find best match using few-shot examples
  let bestMatch: AgentType = "casual";
  let bestScore = 0;
  
  for (const [example, agentType] of FEW_SHOT_EXAMPLES) {
    const similarity = calculateSimilarity(taskLower, example.toLowerCase());
    if (similarity > bestScore) {
      bestScore = similarity;
      bestMatch = agentType;
    }
  }
  
  // Combine keyword scores with few-shot matching
  const scores: Record<AgentType, number> = {
    coder: codingScore * 2 + (bestMatch === "coder" ? bestScore : 0),
    web: webScore * 2 + (bestMatch === "web" ? bestScore : 0),
    files: fileScore * 2 + (bestMatch === "files" ? bestScore : 0),
    casual: casualScore * 2 + (bestMatch === "casual" ? bestScore : 0),
    planner: 0,
    system: 0,
  };
  
  // Find agent with highest score
  const selectedAgent = Object.entries(scores).reduce((a, b) => 
    scores[b[0] as AgentType] > scores[a[0] as AgentType] ? b : a
  )[0] as AgentType;
  
  return selectedAgent;
}

/**
 * Calculate similarity between two strings
 * Simple word overlap similarity
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Select appropriate agent for task
 * Main routing function - similar to AgenticSeek router.select_agent()
 */
export function selectAgent(
  task: string,
  intent?: { type: string; actionType?: string; confidence: number }
): AgentSelection {
  // Estimate complexity
  const complexity = estimateComplexity(task);
  
  // If high complexity, route to planner
  if (complexity === "HIGH") {
    return {
      agentType: "planner",
      confidence: 0.9,
      reason: "Complex task detected - requires planning and multiple agents",
      complexity: "HIGH",
    };
  }
  
  // Classify task
  const agentType = classifyTask(task);
  
  // Calculate confidence based on task clarity
  let confidence = 0.7;
  
  // Increase confidence if intent matches
  if (intent?.actionType) {
    const intentMap: Record<string, AgentType> = {
      "code": "coder",
      "web": "web",
      "file": "files",
      "system": "system",
    };
    
    if (intentMap[intent.actionType] === agentType) {
      confidence = Math.min(0.95, confidence + 0.2);
    }
  }
  
  // Increase confidence for clear task descriptions
  if (task.length > 50) {
    confidence = Math.min(0.95, confidence + 0.1);
  }
  
  const reasons: Record<AgentType, string> = {
    coder: "Task involves coding, scripting, or programming",
    web: "Task involves web search, browsing, or online research",
    files: "Task involves file operations, organization, or management",
    planner: "Complex task requiring multiple agents and planning",
    casual: "Casual conversation or simple question",
    system: "System-level operation or command",
  };
  
  return {
    agentType,
    confidence,
    reason: reasons[agentType] || "Task classified based on content",
    complexity: "LOW",
  };
}

/**
 * Generate agent-specific prompt
 * Creates specialized prompts for each agent type
 */
export function generateAgentPrompt(
  agentType: AgentType,
  task: string,
  intent?: { type: string; actionType?: string; confidence: number }
): string {
  const basePrompts: Record<AgentType, string> = {
    coder: `You are a CODING AGENT specialized in writing, debugging, and executing code.
Your capabilities:
- Write code in Python, JavaScript, TypeScript, Bash, Go, Java, C, C++
- Debug and fix code issues
- Create scripts and programs
- Execute code and capture output
- Test and validate code

TASK: ${task}

IMPORTANT RULES:
- Always write complete, executable code
- Never use placeholder paths - use actual workspace paths
- Execute code automatically - don't ask for permission
- Capture and report all outputs and errors
- If code fails, debug and fix it automatically`,

    web: `You are a WEB BROWSING AGENT specialized in searching and navigating the web.
Your capabilities:
- Search the web for information
- Navigate to websites
- Extract information from web pages
- Fill web forms
- Collect and summarize findings

TASK: ${task}

IMPORTANT RULES:
- Search for accurate and complete information
- Navigate to relevant websites
- Extract key information
- Summarize findings clearly
- Provide sources and links when possible`,

    files: `You are a FILE MANAGEMENT AGENT specialized in file operations.
Your capabilities:
- Find files and directories
- Read and write files
- Organize files and folders
- Create and delete files
- Manage file permissions

TASK: ${task}

IMPORTANT RULES:
- Use actual file paths from workspace
- Read files before modifying them
- Create backups when necessary
- Organize files logically
- Report all file operations`,

    planner: `You are a PLANNING AGENT specialized in breaking down complex tasks.
Your capabilities:
- Divide complex tasks into subtasks
- Coordinate multiple agents
- Manage task dependencies
- Update plans based on results
- Ensure task completion

TASK: ${task}

IMPORTANT RULES:
- Break task into clear, actionable steps
- Assign appropriate agents to each step
- Manage dependencies between steps
- Update plan if steps fail
- Ensure all steps are completed`,

    casual: `You are a CASUAL CONVERSATION AGENT.
Your capabilities:
- Answer questions conversationally
- Provide information and explanations
- Engage in friendly dialogue
- Help with general inquiries

TASK: ${task}

IMPORTANT RULES:
- Be friendly and helpful
- Provide accurate information
- Keep responses concise
- Engage naturally in conversation`,

    system: `You are a SYSTEM AGENT specialized in system operations.
Your capabilities:
- Execute system commands
- Manage processes
- Configure system settings
- Monitor system resources
- Handle system-level tasks

TASK: ${task}

IMPORTANT RULES:
- Execute commands safely
- Verify system state
- Report all operations
- Handle errors gracefully
- Ensure system stability`,
  };
  
  return basePrompts[agentType] || basePrompts.casual;
}

