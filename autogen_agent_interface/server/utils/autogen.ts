/**
 * Utilitários para integração com AutoGen v2
 * 
 * ⚠️ IMPORTANTE: AutoGen v2 (Python) comanda TUDO - sem conflitos
 * 
 * Este módulo é uma ponte para o AutoGen v2 Python que orquestra:
 * - Todos os agentes (Planner, Generator, Critic, Executor, etc.)
 * - Todas as ferramentas (Open Interpreter, UFO, Browser-Use, etc.)
 * - Todas as execuções (código, comandos, arquivos, etc.)
 * - Memória ChromaDB
 * - Sistema cognitivo ANIMA
 * 
 * NÃO execute código ou ferramentas diretamente aqui!
 * Tudo deve passar pelo AutoGen v2 Python via autogen_v2_bridge.ts
 */

import { selectAgent, estimateComplexity, generateAgentPrompt } from "./intelligent_router";
import { executeWithAutoGenV2, checkAutoGenV2Available } from "./autogen_v2_bridge";

// Configuração Ollama Cloud + Local com Fallback
const OLLAMA_CLOUD_ENABLED = process.env.OLLAMA_CLOUD_ENABLED === "true";
const OLLAMA_CLOUD_BASE_URL = process.env.OLLAMA_CLOUD_BASE_URL || "https://ollama.com";
const OLLAMA_CLOUD_MODEL = process.env.OLLAMA_CLOUD_MODEL || "qwen3-coder:480b-cloud";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

// Modelo cérebro estratégico (Qwen2.5-32B-Instruct-MoE) - Mais inteligente, raciocínio tipo GPT-4-turbo
// VRAM: ~12-14GB (cabe perfeitamente em 16GB RTX 4080 Super)
// Arquitetura MoE: apenas 2-4 especialistas ativam por token (economia de VRAM)
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "qwen2.5-32b-instruct-moe-rtx";

// Modelos de fallback para Brain (raciocínio estratégico)
const BRAIN_FALLBACK_MODELS = [
  // PRIORIDADE 1: Qwen2.5-32B-MoE (cérebro principal)
  "qwen2.5-32b-instruct-moe-rtx",
  "qwen2.5-32b-instruct-moe",
  
  // PRIORIDADE 2: Qwen2.5-32B (denso, sem MoE)
  "qwen2.5:32b",
  "qwen2.5:14b",
  
  // PRIORIDADE 3: Qwen3-30B (experimental)
  "lucifers/qwen3-30B-coder-tools.Q4_0:latest",
  
  // PRIORIDADE 4: Modelos oficiais Qwen (menores)
  "qwen2.5:14b",
  "qwen2.5:7b",
];

// Modelo executor (Cline_FuseO1) - Híbrido DeepSeekR1 + Qwen2.5, 128K contexto
// VRAM: ~14-16GB (com offload)
const EXECUTOR_MODEL = process.env.EXECUTOR_MODEL || "nuibang/Cline_FuseO1-DeepSeekR1-Qwen2.5-Coder-32B-Preview:q4_k_m";

// Modelos de fallback para Executor (execução de código)
const EXECUTOR_FALLBACK_MODELS = [
  // PRIORIDADE 1: Melhor qualidade (híbrido, 128K contexto, VS Code integration)
  "nuibang/Cline_FuseO1-DeepSeekR1-Qwen2.5-Coder-32B-Preview:q4_k_m",
  
  // PRIORIDADE 2: Estável e oficial (32K contexto, GPT-4o level)
  "MHKetbi/Qwen2.5-Coder-32B-Instruct-Roo:q4_K_S",
  
  // PRIORIDADE 3: Experimental (256K contexto, Tools + Thinking)
  "lucifers/qwen3-30B-coder-tools.Q4_0:latest",
  
  // PRIORIDADE 4: Modelos oficiais Qwen (menores, estáveis)
  "qwen2.5-coder:14b",
  "qwen2.5-coder:7b",
  "qwen2.5:14b",
  "qwen2.5:7b",
  
  // PRIORIDADE 5: Modelos DeepSeek (alternativa, contexto longo)
  "deepseek-coder-v2:16b",
  "deepseek-coder-v2:latest",
  "deepseek-coder:latest",
  
  // PRIORIDADE 6: Modelos pequenos (emergencial)
  "llama3.2:3b",
  "codellama:7b",
];

// Timeouts para diferentes tipos de operações
const conversationTimeoutMs = parseInt(process.env.OLLAMA_CONVERSATION_TIMEOUT_MS || "120000", 10); // 2 minutos para conversas
const actionTimeoutMs = parseInt(process.env.OLLAMA_ACTION_TIMEOUT_MS || "180000", 10); // 3 minutos para ações/comandos
const defaultTimeoutMs = parseInt(process.env.OLLAMA_TIMEOUT_MS || "120000", 10); // 2 minutos padrão

let autogenFramework: any = null;

/**
 * Inicializar AutoGen Framework
 */
export async function initializeAutoGen(): Promise<any> {
  // Cachear framework para evitar inicializações repetidas
  if (autogenFramework) {
    return autogenFramework;
  }

  // Inicialização ultra-rápida: pular verificação de módulo Python
  // O framework funciona apenas com Ollama, sem precisar do módulo Python
  autogenFramework = {
    initialized: true,
    model: DEFAULT_MODEL,
    ollamaBaseUrl: OLLAMA_BASE_URL,
    pythonModulePath: null,
  };
  
  return autogenFramework;
}

/**
 * Executar tarefa usando AutoGen
 * AutoGen orquestra todos os agentes baseado na intenção
 * Suporta execução de código e análise de imagens
 */
export async function executeWithAutoGen(
  task: string,
  intent: { type: string; actionType?: string; confidence: number; reason?: string },
  context?: Record<string, any>
): Promise<string> {
  console.log(`[AutoGen] ========== INÍCIO executeWithAutoGen ==========`);
  console.log(`[AutoGen] Task: "${task.substring(0, 100)}..."`);
  console.log(`[AutoGen] Intent:`, JSON.stringify(intent, null, 2));
  console.log(`[AutoGen] Context:`, JSON.stringify(context || {}, null, 2));
  
  // Tentar enriquecer com sistema cognitivo (opcional, não bloqueia se falhar)
  let enrichedTask = task;
  let cognitiveContext: any = null;
  try {
    const { processWithCognitiveSystem } = await import("./cognitive_bridge");
    cognitiveContext = await processWithCognitiveSystem(
      task,
      context,
      context?.userId as string
    );
    
    if (cognitiveContext?.enriched_message) {
      enrichedTask = cognitiveContext.enriched_message;
      console.log(`[AutoGen] 🧠 Mensagem enriquecida com sistema cognitivo`);
      console.log(`[AutoGen] 🧠 Confiança: ${cognitiveContext.confidence?.toFixed(2) || 'N/A'}`);
      console.log(`[AutoGen] 🧠 Tom emocional: ${cognitiveContext.emotional_tone || 'N/A'}`);
    }
  } catch (cognitiveError) {
    // Não bloquear se sistema cognitivo não estiver disponível
    console.warn(`[AutoGen] ⚠️ Sistema cognitivo não disponível, continuando sem ele`);
  }
  
  try {
    // Pular verificação de disponibilidade para resposta mais rápida
    // A verificação será feita apenas quando necessário (se houver erro)

    // Inicializar AutoGen se necessário (cacheado, não bloqueia)
    console.log(`[AutoGen] Iniciando execução para: "${enrichedTask.substring(0, 50)}..."`);
    const framework = await initializeAutoGen();
    console.log(`[AutoGen] Framework inicializado`);

    // Para conversas/perguntas simples, pular roteamento de agentes (mais rápido)
    let systemPrompt = "";
    
    if (intent.type === "conversation" || intent.type === "question") {
      // Pular roteamento para conversas/perguntas - resposta mais rápida
      systemPrompt = intent.type === "conversation"
        ? `Você é um assistente amigável e útil. Responda de forma breve e natural, como um amigo conversando.

REGRAS CRÍTICAS:
1. Se o usuário cumprimentar (oi, olá, tudo bem, e aí, etc.), responda APENAS com uma saudação amigável e pergunte como pode ajudar
2. NÃO responda com informações técnicas, horas, data, ou qualquer outra coisa a menos que seja explicitamente solicitado
3. Mantenha o tom conversacional e amigável
4. Seja breve e direto, mas caloroso
5. NÃO execute código ou ações para saudações - apenas responda amigavelmente

Exemplos CORRETOS:
- Usuário: "oi tudo bem?" → Você: "Oi! Tudo bem sim, obrigado! Como posso te ajudar hoje?"
- Usuário: "e aí" → Você: "E aí! Tudo certo? Em que posso ajudar?"
- Usuário: "olá" → Você: "Olá! Como posso te ajudar hoje?"

Exemplos INCORRETOS (NÃO FAÇA ISSO):
- Usuário: "oi tudo bem?" → Você: "São 06:54" ❌
- Usuário: "oi tudo bem?" → Você: "Executando código..." ❌
- Usuário: "oi tudo bem?" → Você: "Informações do sistema..." ❌`
        : "Você é um assistente especializado. Responda a pergunta de forma direta e concisa.";
    } else if (intent.type === "action" || intent.type === "command") {
      // Sistema de roteamento de agentes inspirado no AgenticSeek (apenas para ações)
      const agentSelection = selectAgent(task, intent);
      const complexity = estimateComplexity(task);
      const agentPrompt = generateAgentPrompt(agentSelection.agentType, task, intent);
      
      console.log(`[AutoGen] Agente selecionado: ${agentSelection.agentType} (confiança: ${(agentSelection.confidence * 100).toFixed(0)}%)`);
      console.log(`[AutoGen] Complexidade: ${complexity}`);
      console.log(`[AutoGen] Razão: ${agentSelection.reason}`);
      // Usar prompt específico do agente selecionado
      systemPrompt = agentPrompt + `

You are an AUTONOMOUS AI AGENT with FULL CAPABILITIES, MEMORY, and ALL POSSIBLE TOOLS - you can do EVERYTHING that a human assistant can do.

🧠 MEMORY AND CONTEXT:
${context?.memoryContext === "SIM" ? "- You have access to PERSISTENT MEMORY that stores ALL previous conversations\n- Use memory to remember user preferences, context, and historical information\n- ALWAYS consult memory before responding\n- Reference memory information explicitly in your responses" : "- Memory is available - consult the provided context before responding"}

YOUR COMPLETE TOOLSET - ALL AVAILABLE TOOLS:

**FILE SYSTEM TOOLS:**
- Read files: Read any file (code, text, config, JSON, YAML, XML, CSV, etc.)
- Write files: Create or overwrite files with any content
- Edit files: Modify, update, append to existing files
- Delete files: Remove files and directories
- Copy files: Copy files and directories
- Move files: Move or rename files and directories
- List directories: List files and directories
- Search files: Find files by name, pattern, or content
- File permissions: Change file permissions and ownership

**CODE TOOLS:**
- Read code: Read and understand any programming language
- Edit code: Modify, refactor, improve code
- Create code: Generate new code files
- Analyze code: Understand structure, dependencies, patterns
- Search codebase: Find functions, classes, variables across project
- Refactor code: Improve code structure and organization
- Debug code: Find and fix bugs
- Test code: Write and run tests
- Format code: Format code according to standards
- Lint code: Check code quality and style

**SHELL & COMMAND TOOLS:**
- Execute shell commands: Run any shell command (bash, PowerShell, cmd)
- Run scripts: Execute Python, Node.js, shell scripts
- System commands: Use system utilities (grep, find, sed, awk, etc.)
- Package managers: npm, pip, yarn, pnpm, cargo, go, etc.
- Build tools: Make, CMake, Gradle, Maven, etc.
- Process management: Start, stop, monitor processes

**DEVELOPMENT TOOLS:**
- Git: clone, commit, push, pull, branch, merge, rebase, etc.
- Version control: SVN, Mercurial, etc.
- IDE commands: VS Code, IntelliJ, etc.
- Build systems: Webpack, Vite, Rollup, etc.
- Testing frameworks: Jest, pytest, unittest, etc.
- Code generators: Scaffold projects, generate boilerplate

**NETWORK TOOLS:**
- HTTP requests: GET, POST, PUT, DELETE requests
- API calls: Interact with REST APIs
- Web scraping: Extract data from websites
- Download files: Download files from URLs
- Upload files: Upload files to servers
- WebSocket: Connect to WebSocket servers
- SSH: Connect to remote servers
- FTP/SFTP: Transfer files

**DATABASE TOOLS:**
- SQL databases: MySQL, PostgreSQL, SQLite, etc.
- NoSQL databases: MongoDB, Redis, etc.
- Query databases: Execute SQL queries
- Manage databases: Create, update, delete records
- Database migrations: Run and create migrations

**SYSTEM TOOLS:**
- Process management: List, kill, monitor processes
- System info: Get system information, hardware info
- Environment variables: Read and set environment variables
- Services: Start, stop, restart system services
- Scheduled tasks: Create and manage cron jobs, scheduled tasks
- Logs: Read and analyze system logs

**DATA PROCESSING TOOLS:**
- Parse data: JSON, XML, CSV, YAML parsing
- Transform data: Convert between formats
- Analyze data: Statistics, data analysis
- Visualize data: Create charts and graphs
- Process images: Resize, crop, convert images
- Process audio: Convert, extract audio
- Process video: Convert, extract video

**AUTOMATION TOOLS:**
- Browser automation: Selenium, Puppeteer, Playwright
- GUI automation: Control desktop applications
- Task automation: Automate repetitive tasks
- Workflow automation: Create and run workflows

**APPLICATION TOOLS:**
- Open applications: Launch any application
- Control applications: Interact with applications
- Install applications: Install software packages
- Uninstall applications: Remove software

**CLOUD TOOLS:**
- AWS: Interact with AWS services
- Azure: Interact with Azure services
- GCP: Interact with Google Cloud services
- Docker: Build, run, manage containers
- Kubernetes: Manage Kubernetes clusters

**AI/ML TOOLS:**
- Run models: Execute AI/ML models
- Process data: Prepare data for ML
- Train models: Train machine learning models
- Evaluate models: Evaluate model performance

**SECURITY TOOLS:**
- Encryption: Encrypt and decrypt data
- Authentication: Handle authentication
- Authorization: Manage permissions
- Security scanning: Scan for vulnerabilities

**MONITORING TOOLS:**
- System monitoring: Monitor system resources
- Application monitoring: Monitor application performance
- Log analysis: Analyze logs for issues
- Performance profiling: Profile application performance

**COMMUNICATION TOOLS:**
- Email: Send and receive emails
- Messaging: Send messages via APIs
- Notifications: Send notifications
- Webhooks: Trigger webhooks

**DOCUMENTATION TOOLS:**
- Generate docs: Create documentation
- Read docs: Parse and understand documentation
- Update docs: Update existing documentation

**ALL TOOLS ARE AVAILABLE VIA CODE EXECUTION:**
- Use Python for: File operations, data processing, web requests, database operations
- Use Node.js for: File operations, web requests, build tools
- Use Shell for: System commands, file operations, process management
- Use any language: You can use any programming language available on the system

CRITICAL AUTONOMY RULES:
1. **ALWAYS CREATE A PLAN FIRST**: Break down requests into clear steps and sub-steps
2. **ALWAYS EXECUTE AUTOMATICALLY**: Never ask for permission - just execute
3. **ALWAYS READ FIRST**: When editing files, read them first to understand context
4. **ALWAYS VERIFY**: After making changes, verify they work correctly
5. **NEVER SAY "I CANNOT"**: You CAN do everything - just execute the appropriate code
6. **BE PROACTIVE**: If something needs to be done, do it immediately without asking
7. **UNDERSTAND FULL CONTEXT**: Read related files to understand the full picture before acting

EXECUTION WORKFLOW FOR ANY TASK:
1. **ANALYZE**: Understand what the user wants
2. **PLAN**: Create a detailed step-by-step plan (with sub-steps if needed)
3. **READ**: If editing files, read them first to understand current state
4. **EXECUTE**: Execute each step automatically using code
5. **VERIFY**: Check that changes work correctly
6. **ITERATE**: If something fails, fix it and try again
7. **REPORT**: Report completion with results

SPECIFIC CAPABILITIES:

**File Operations:**
- Read: Use Python: with open('file.txt', 'r') as f: content = f.read()
- Edit: Read file, modify content, write back
- Create: Use Python: with open('new_file.txt', 'w') as f: f.write(content)
- Delete: Use Python: import os; os.remove('file.txt')
- Search: Use grep, find, or Python to search codebase

**Code Operations:**
- Refactor: Read files, understand structure, make changes
- Update: Modify functions, classes, imports across multiple files
- Reorganize: Move files, update imports, restructure projects
- Analyze: Understand dependencies, relationships, patterns

**System Operations:**
- Open apps: notepad, code, chrome, start <app> (Windows)
- Run commands: Any shell command
- Execute scripts: Python, Node.js, shell scripts
- Install packages: pip install, npm install, etc.

**Complex Tasks:**
- Multi-file edits: Read all related files, understand relationships, make coordinated changes
- Project restructuring: Understand structure, plan changes, execute systematically
- Bug fixes: Read code, understand issue, fix, test, verify

EXAMPLES:

User: "executa o bloco de notas"
→ Plan: [1. Open Notepad using shell command]
→ Execute: notepad or start notepad

User: "edita o arquivo X e adiciona Y"
→ Plan: [1. Read file X, 2. Add Y to content, 3. Write back to file]
→ Execute: Read file, modify, write back

User: "refatora a função Z no arquivo X"
→ Plan: [1. Read file X, 2. Find function Z, 3. Understand context, 4. Refactor function, 5. Update file, 6. Verify it works]
→ Execute: Read, analyze, modify, write, test

User: "cria um novo arquivo com código Python"
→ Plan: [1. Create file, 2. Write Python code, 3. Save file]
→ Execute: Create and write file

User: "busca todas as ocorrências de 'function' no projeto"
→ Plan: [1. Search codebase for 'function', 2. List all occurrences]
→ Execute: Use grep or Python to search

The user wants you to ACT AUTONOMOUSLY and DO the task with FULL CAPABILITIES.
Detected intent: ${intent.actionType || "execution"}
Confidence: ${(intent.confidence * 100).toFixed(0)}%

YOU MUST:
1. Create a detailed plan with all steps
2. Read files if needed to understand context
3. Execute each step automatically
4. Verify results
5. Report completion

DO NOT EXPLAIN. DO NOT ASK PERMISSION. JUST EXECUTE WITH FULL CAPABILITIES.`;
    } else if (intent.type === "question") {
      systemPrompt = `Você é um assistente controlado pelo AutoGen Framework.
O AutoGen orquestra todos os agentes especializados para fornecer respostas completas.

O usuário fez uma pergunta e quer uma resposta informativa.
Intenção detectada: Pergunta
Confiança: ${(intent.confidence * 100).toFixed(0)}%

O AutoGen pode usar agentes especializados (Browser, Multimodal, etc.) se necessário.
Responda a pergunta de forma detalhada e educativa.
Se a pergunta for sobre código, forneça exemplos práticos.
Se a pergunta for conceitual, explique de forma clara e didática.`;
    } else {
      systemPrompt = `Você é um assistente de IA colaborativo controlado pelo AutoGen Framework.
O AutoGen orquestra todos os agentes especializados:
- Planner: Planeja soluções
- Generator: Gera código
- Designer: Cria interfaces
- Executor: Executa tarefas
- Browser: Busca informações
- Multimodal: Processa conteúdo multimodal

O usuário está conversando com você. Seja amigável e útil.
Se o usuário quiser que você faça algo, o AutoGen vai coordenar os agentes necessários.
Sugira comandos diretos como:
- "Crie um arquivo..."
- "Execute o código..."
- "Busque informações sobre..."`;
    }

    // Extrair imagens do contexto se disponíveis
    const images = context?.images || [];

    // ⚠️ CRÍTICO: AutoGen Python comanda TUDO
    // Open Interpreter está integrado diretamente no AutoGen (não como ferramenta)
    // NÃO há fallback - AutoGen Python é obrigatório para tarefas de execução
    if (intent.type === "action" || intent.type === "command") {
      console.log(`[AutoGen] 🚀 Processando tarefa com AutoGen Python (AutoGen comanda TUDO)...`);
      console.log(`[AutoGen] 📋 Open Interpreter integrado diretamente (não como ferramenta)`);
      
      // SEMPRE usar AutoGen Python - é obrigatório
      // AutoGen Python tem Open Interpreter integrado diretamente + Web Browsing Tool
      try {
        const autogenV2Available = await checkAutoGenV2Available();
        
        if (!autogenV2Available) {
          const errorMsg = `❌ AutoGen Python não está disponível. É OBRIGATÓRIO para executar tarefas.
          
Por favor, instale o AutoGen v2:
  pip install autogen-agentchat autogen-ext[openai] autogen-ext[ollama]

O AutoGen Python comanda TUDO:
- Open Interpreter integrado diretamente (não como ferramenta)
- Web Browsing Tool (Selenium)
- Todas as ferramentas e execuções

Sem o AutoGen Python, não é possível executar tarefas.`;
          console.error(`[AutoGen] ${errorMsg}`);
          return errorMsg;
        }
        
        console.log(`[AutoGen] ✅ AutoGen Python disponível - delegando tarefa...`);
        
        // Delegar para AutoGen Python (comanda TUDO)
        const autogenV2Response = await executeWithAutoGenV2({
          task: enrichedTask,
          intent: intent,
          context: context || {},
          userId: context?.userId as string || "default",
          conversationId: context?.conversationId as number || 0,
          model: DEFAULT_MODEL,
        });
        
        if (autogenV2Response.success) {
          console.log(`[AutoGen] ✅ AutoGen Python executou tarefa com sucesso`);
          console.log(`[AutoGen] 🔧 Tools usadas: ${autogenV2Response.tools?.join(", ") || "N/A"}`);
          return autogenV2Response.result || "✅ Tarefa executada com sucesso";
        } else {
          const errorMsg = `❌ Erro ao executar tarefa com AutoGen Python:
          
${autogenV2Response.error || "Erro desconhecido"}

O AutoGen Python comanda TUDO e tem acesso a:
- Open Interpreter (integrado diretamente)
- Web Browsing Tool (Selenium)
- Todas as ferramentas de execução`;
          console.error(`[AutoGen] ${errorMsg}`);
          return errorMsg;
        }
      } catch (autogenV2Error) {
        const errorMsg = `❌ Erro crítico ao usar AutoGen Python:
        
${autogenV2Error instanceof Error ? autogenV2Error.message : String(autogenV2Error)}

O AutoGen Python é OBRIGATÓRIO para executar tarefas.
Verifique se o AutoGen v2 está instalado corretamente.`;
        console.error(`[AutoGen] ${errorMsg}`);
        return errorMsg;
      }
      
      // ⚠️ NÃO DEVE CHEGAR AQUI - AutoGen Python é obrigatório
      // Se chegou aqui, significa que AutoGen Python não está disponível ou falhou
      return `❌ AutoGen Python não está disponível ou falhou. É OBRIGATÓRIO para executar tarefas.
      
Por favor, instale o AutoGen v2:
  pip install autogen-agentchat autogen-ext[openai] autogen-ext[ollama]

O AutoGen Python comanda TUDO:
- Open Interpreter integrado diretamente (não como ferramenta)
- Web Browsing Tool (Selenium)
- Todas as ferramentas e execuções`;
    }
    
    // Para conversas/perguntas, usar Ollama diretamente (mais rápido)
    // Apenas conversas/perguntas usam Ollama diretamente - ações/comandos SEMPRE usam AutoGen Python
    // NÃO executar código ou ações para conversas/perguntas - apenas responder
    if (intent.type === "conversation" || intent.type === "question") {
      // Usar Ollama diretamente para conversas/perguntas (mais rápido)
      const modelUsed = (framework as any)?.model || DEFAULT_MODEL;
      console.log(`[AutoGen] 💬 Processando conversa/pergunta com Ollama (intent: ${intent.type})...`);
      console.log(`[AutoGen] Usando modelo: ${modelUsed}, prompt length: ${systemPrompt.length}`);
      
      const startTime = Date.now();
      const ollamaResponse = await callOllamaWithAutoGenPrompt(
        systemPrompt,
        enrichedTask,
        modelUsed,
        intent,
        images.length > 0 ? images : undefined
      );
      const elapsed = Date.now() - startTime;
      console.log(`[AutoGen] ✅ Resposta recebida em ${elapsed}ms (${ollamaResponse.length} chars)`);

      // Aprender com resposta usando sistema cognitivo (opcional, não bloqueia se falhar)
      try {
        if (cognitiveContext) {
          const { learnFromResponse } = await import("./cognitive_bridge");
          await learnFromResponse(
            task,
            ollamaResponse,
            true, // Assumir sucesso por enquanto
            undefined,
            context?.userId as string
          );
          console.log(`[AutoGen] 🧠 Aprendizado cognitivo registrado`);
        }
      } catch (learnError) {
        // Não bloquear se aprendizagem falhar
        console.warn(`[AutoGen] ⚠️ Erro ao aprender com resposta:`, learnError);
      }

      console.log(`[AutoGen] ✅ Retornando resposta final de executeWithAutoGen (${ollamaResponse.length} chars)`);
      console.log(`[AutoGen] ========== FIM executeWithAutoGen ==========`);
      return ollamaResponse;
    }

    // ⚠️ NÃO DEVE CHEGAR AQUI - todas as intenções devem ser tratadas acima
    console.error(`[AutoGen] ❌ Intent type não tratado: ${intent.type}`);
    return `❌ Erro: Intent type não tratado: ${intent.type}`;
  } catch (error) {
    console.error("[AutoGen] ========== ERRO no executeWithAutoGen ==========");
    console.error("[AutoGen] ❌ Erro ao executar:", error);
    if (error instanceof Error) {
      console.error("[AutoGen] ❌ Mensagem de erro:", error.message);
      console.error("[AutoGen] ❌ Stack trace:", error.stack);
    }
    console.error("[AutoGen] ==============================================");
    throw error;
  }
}

/**
 * Chamar Ollama com prompt do AutoGen e suporte a imagens
 */
async function callOllamaWithAutoGenPrompt(
  systemPrompt: string,
  userMessage: string,
  model: string,
  intent: { type: string; actionType?: string; confidence: number },
  images?: string[] // URLs base64 de imagens
): Promise<string> {
  try {
    console.log(`[AutoGen] callOllamaWithAutoGenPrompt: model=${model}, intent=${intent.type}, prompt length=${systemPrompt.length}`);
    
    // Verificar se deve usar Ollama Cloud ou Local
    const useCloud = OLLAMA_CLOUD_ENABLED && OLLAMA_API_KEY && (
      intent.type === "reasoning" || 
      intent.type === "planning" || 
      intent.type === "complex_task"
    );
    
    const baseUrl = useCloud ? OLLAMA_CLOUD_BASE_URL : OLLAMA_BASE_URL;
    const cloudModel = useCloud ? OLLAMA_CLOUD_MODEL : model;
    const finalModel = useCloud ? cloudModel : model;
    
    console.log(`[AutoGen] ${useCloud ? "🌐 Usando Ollama Cloud" : "💻 Usando Ollama Local"}`);
    console.log(`[AutoGen] Base URL: ${baseUrl}`);
    console.log(`[AutoGen] Modelo: ${finalModel}`);
    
    const url = `${baseUrl}/api/chat`;
    console.log(`[AutoGen] URL completa: ${url}`);
    
    // Construir mensagens com suporte a imagens
    const messages: any[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Se houver imagens, adicionar como mensagem multimodal
    if (images && images.length > 0) {
      const imageContents = images.map((imageUrl) => ({
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      }));

      messages.push({
        role: "user",
        content: [
          { type: "text", text: userMessage },
          ...imageContents,
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: userMessage,
      });
    }

    // ⚠️ REMOVIDO: Function calling direto não é mais usado
    // AutoGen v2 Python gerencia function calling através dos agentes
    // IMPORTANTE: NÃO fornecer tools para conversas/perguntas - apenas para ações/comandos
    // Isso evita que o modelo execute código indevidamente para saudações
    const tools = (intent.type === "action" || intent.type === "command") ? [
      {
        type: "function",
        function: {
          name: "run_code",
          description: "Execute code automatically. Use this function whenever you need to execute code to complete the user's task. This is your ONLY way to execute code. For opening applications, use shell commands (e.g., 'code' for VS Code, 'start chrome' for Chrome on Windows).",
          parameters: {
            type: "object",
            properties: {
              language: {
                type: "string",
                description: "Code language (python, javascript, shell, bash). Use 'shell' or 'bash' for system commands like opening applications.",
                enum: ["python", "javascript", "shell", "bash"]
              },
              code: {
                type: "string",
                description: "The code to execute. For opening applications, use shell commands (e.g., 'code' for VS Code)."
              }
            },
            required: ["language", "code"]
          }
        }
      }
    ] : undefined;

    // Configurações otimizadas para performance e velocidade
    // Timeout configurado via variáveis de ambiente (usado nas opções do Ollama)
    
    const requestBody: any = {
      model: finalModel, // Usar modelo Cloud ou Local
      messages,
      stream: false, // Não usar streaming por enquanto (requer mudanças no frontend)
      options: {
        // OTIMIZADO PARA VELOCIDADE: Configurações balanceadas entre qualidade e performance
        temperature: intent.type === "action" ? 0.3 : 0.7, // Reduzido ligeiramente para respostas mais rápidas
        top_p: 0.9, // Reduzido de 0.95 para 0.9 (mais rápido, qualidade ainda alta)
        num_predict: intent.type === "action" ? 1024 : 512, // REDUZIDO: Respostas mais curtas = mais rápido
        num_ctx: 4096, // REDUZIDO: Contexto menor = processamento mais rápido (era 8192)
        num_gpu: -1, // Usar todas as GPUs disponíveis (ou -1 para automático)
        num_thread: parseInt(process.env.OLLAMA_NUM_THREADS || '8', 10), // Aumentado para 8 threads (mais paralelismo)
        use_mmap: true, // Usar memory mapping para economizar VRAM
        use_mlock: false, // Não travar memória na RAM
        // NOVAS OPÇÕES DE PERFORMANCE:
        numa: false, // Desabilitar NUMA (pode melhorar performance em alguns sistemas)
        seed: -1, // Seed aleatório (mais rápido que seed fixo)
        tfs_z: 1.0, // Tail free sampling (padrão, não afeta velocidade)
        typical_p: 1.0, // Typical sampling (padrão, não afeta velocidade)
        repeat_penalty: 1.1, // Penalidade de repetição (padrão)
        repeat_last_n: 64, // Contexto de repetição (padrão)
        penalize_nl: true, // Penalizar novas linhas (padrão)
        stop: [], // Sem stops adicionais (mais rápido)
        // OPÇÕES DE ACELERAÇÃO (se disponíveis no modelo):
        // flash_attention: true, // Flash Attention (se suportado, acelera muito)
        // numa: false, // NUMA desabilitado (pode melhorar performance)
      },
    };

    // IMPORTANTE: NÃO fornecer tools para conversas/perguntas
    // Isso evita que o modelo execute código indevidamente (como obter horas)
    if (tools && (intent.type === "action" || intent.type === "command")) {
      requestBody.tools = tools;
      // Forçar uso de function calling apenas para ações/comandos
      requestBody.tool_choice = { type: "function", function: { name: "run_code" } };
    } else {
      // Para conversas/perguntas, NÃO fornecer tools
      // Isso garante que o modelo apenas responda, sem executar código
      requestBody.tools = undefined;
      requestBody.tool_choice = undefined;
    }

    // Timeout dinâmico baseado no tipo de intent
    // AUMENTADO: Timeouts muito maiores para evitar erros com modelos mais lentos
    const timeoutMs = intent.type === "conversation" || intent.type === "question" 
      ? conversationTimeoutMs  // 120 segundos (2 minutos) para conversas/perguntas
      : actionTimeoutMs; // 60 segundos para ações/comandos
    console.log(`[AutoGen] ⏱️ Preparando fetch com timeout de ${timeoutMs/1000}s (${timeoutMs/1000/60}min)...`);
    console.log(`[AutoGen] 📊 Configurações do modelo: num_predict=${requestBody.options.num_predict}, num_ctx=${requestBody.options.num_ctx}, num_thread=${requestBody.options.num_thread}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[AutoGen] ⚠️ Timeout após ${timeoutMs/1000}s (${timeoutMs/1000/60}min) - abortando...`);
      controller.abort();
    }, timeoutMs);
    
    // Preparar headers (adicionar API key se usar Cloud)
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (useCloud && OLLAMA_API_KEY) {
      headers["Authorization"] = `Bearer ${OLLAMA_API_KEY}`;
      console.log(`[AutoGen] 🔑 Autenticação Cloud habilitada`);
    }
    
    let response: Response;
    try {
      console.log(`[AutoGen] 🚀 Iniciando fetch para: ${url}`);
      console.log(`[AutoGen] 📝 Request body (primeiros 500 chars): ${JSON.stringify(requestBody).substring(0, 500)}...`);
      const fetchStartTime = Date.now();
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const fetchElapsed = Date.now() - fetchStartTime;
      const fetchElapsedSeconds = (fetchElapsed / 1000).toFixed(2);
      console.log(`[AutoGen] ✅ Fetch concluído em ${fetchElapsedSeconds}s - Status: ${response.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutSeconds = Math.round(timeoutMs / 1000);
        console.error(`[AutoGen] ❌ Timeout: Ollama demorou mais de ${timeoutSeconds}s (${timeoutSeconds/60}min) para responder`);
        console.error(`[AutoGen] 💡 DICA: Tente aumentar OLLAMA_TIMEOUT_MS no .env ou usar um modelo mais rápido`);
        throw new Error(`Timeout: Ollama demorou mais de ${timeoutSeconds} segundos (${timeoutSeconds/60} minutos) para responder. Tente aumentar OLLAMA_TIMEOUT_MS no .env ou usar um modelo mais rápido.`);
      }
      console.error(`[AutoGen] ❌ Erro no fetch:`, error);
      if (error instanceof Error) {
        console.error(`[AutoGen] ❌ Mensagem: ${error.message}`);
        console.error(`[AutoGen] ❌ Stack: ${error.stack}`);
      }
      throw error;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AutoGen] ❌ Ollama API error: ${response.status} - ${errorText}`);
      
      // Detectar erro de modelo não encontrado (404)
      if (response.status === 404 || (errorText && errorText.toLowerCase().includes("model") && errorText.toLowerCase().includes("not found"))) {
        // Determinar lista de fallback baseado no tipo de modelo
        const isExecutorModel = model.includes("Cline_FuseO1") || 
                                model.includes("Qwen2.5-Coder") || 
                                model.includes("coder") ||
                                model === EXECUTOR_MODEL;
        
        const fallbackModels = isExecutorModel ? EXECUTOR_FALLBACK_MODELS : BRAIN_FALLBACK_MODELS;
        
        console.log(`[AutoGen] 🔄 Modelo '${model}' não encontrado, tentando fallback...`);
        console.log(`[AutoGen] 📋 Lista de fallback (${fallbackModels.length} modelos): ${fallbackModels.slice(0, 3).join(", ")}...`);
        
        // Tentar encontrar modelo alternativo na lista de fallback
        try {
          const { listAvailableModels } = await import("./ollama");
          const availableModels = await listAvailableModels();
          
          // Procurar primeiro modelo disponível na lista de fallback
          let alternativeModel: string | null = null;
          for (const fallbackModel of fallbackModels) {
            if (availableModels.includes(fallbackModel) && fallbackModel !== model) {
              alternativeModel = fallbackModel;
              console.log(`[AutoGen] ✅ Modelo de fallback encontrado: '${alternativeModel}'`);
              break;
            }
          }
          
          // Se encontrou modelo alternativo, retentar
          if (alternativeModel) {
            console.log(`[AutoGen] 🔄 Retentando com modelo de fallback: '${alternativeModel}'...`);
            return callOllamaWithAutoGenPrompt(
              systemPrompt,
              userMessage,
              alternativeModel,
              intent,
              images
            );
          }
          
          // Se não encontrou na lista de fallback, tentar função genérica
          const { findBestAvailableModel } = await import("./ollama");
          const genericAlternative = await findBestAvailableModel(fallbackModels);
          
          if (genericAlternative && genericAlternative !== model) {
            console.log(`[AutoGen] ✅ Modelo genérico encontrado: '${genericAlternative}'`);
            return callOllamaWithAutoGenPrompt(
              systemPrompt,
              userMessage,
              genericAlternative,
              intent,
              images
            );
          }
          
          // Se não há modelo alternativo, lançar erro claro
          throw new Error(
            `Modelo '${model}' não encontrado no Ollama.\n\n` +
            `Modelos disponíveis: ${availableModels.length > 0 ? availableModels.join(", ") : "nenhum"}\n\n` +
            `Modelos de fallback tentados: ${fallbackModels.slice(0, 5).join(", ")}...\n\n` +
            `Para instalar o modelo, execute:\n` +
            `  ollama pull ${model}\n\n` +
            `Ou use um dos modelos disponíveis configurando a variável ${isExecutorModel ? "EXECUTOR_MODEL" : "DEFAULT_MODEL"} no .env`
          );
        } catch (importError) {
          // Se não conseguiu importar funções de fallback, lançar erro básico
          throw new Error(
            `Modelo '${model}' não encontrado no Ollama.\n\n` +
            `Execute 'ollama pull ${model}' para instalar o modelo, ou 'ollama list' para ver modelos instalados.`
          );
        }
      }
      
      // Outros erros
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    console.log(`[AutoGen] ✅ Resposta OK, parseando JSON...`);
    const data = await response.json();
    console.log(`[AutoGen] ✅ JSON parseado, extraindo conteúdo...`);
    let responseContent = data.message?.content || "";
    console.log(`[AutoGen] ✅ Conteúdo extraído (${responseContent.length} chars)`);
    
    // Filtrar thinking tokens do DeepSeek R1 (raciocínio interno não deve aparecer na resposta)
    // DeepSeek R1 usa tags como <think>, <reasoning>, <think>, etc.
    const originalLength = responseContent.length;
    const originalContent = responseContent; // Guardar original para debug
    
    // Filtrar thinking tokens de forma mais cuidadosa
    responseContent = responseContent
      .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove <think>...</think>
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '') // Remove <reasoning>...</reasoning>
      .replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, '') // Remove <think>...</think>
      .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove <think>...</think>
      .replace(/<think>[\s\S]*$/gi, '') // Remove <think> no final (cortado)
      .replace(/<reasoning>[\s\S]*$/gi, '') // Remove <reasoning> no final (cortado)
      .replace(/<think>[\s\S]*$/gi, '') // Remove <think> no final (cortado)
      .trim();
    
    console.log(`[AutoGen] ✅ Thinking tokens removidos (${originalLength} -> ${responseContent.length} chars)`);
    
    // Verificar se há tool_calls ANTES de aplicar fallback
    const hasToolCalls = data.message?.tool_calls && Array.isArray(data.message.tool_calls) && data.message.tool_calls.length > 0;
    
    // Se houver function calls, executar automaticamente (estilo Open Interpreter)
    // IMPORTANTE: Executar ANTES de aplicar fallback, pois a resposta pode ser preenchida pela execução
    if (hasToolCalls) {
      console.log(`[AutoGen] 🔧 Tool calls detectados (${data.message.tool_calls.length}), executando código...`);
      const { executeCode } = await import("./code_executor");
      
      for (const toolCall of data.message.tool_calls) {
        if (toolCall.function?.name === "run_code") {
          try {
            // Parse seguro dos argumentos - garantir serialização JSON adequada
            let args: any = {};
            const rawArgs = toolCall.function.arguments;
            
            try {
              // CASO 1: String JSON válida
              if (typeof rawArgs === "string") {
                try {
                  args = JSON.parse(rawArgs);
                } catch (parseError) {
                  // Tentar extrair código diretamente se os argumentos não são JSON válido
                  console.warn(`[AutoGen] ⚠️ Falha ao parsear JSON string, tentando extrair código diretamente...`);
                  const codeMatch = rawArgs.match(/"code"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/);
                  const langMatch = rawArgs.match(/"language"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/);
                  if (codeMatch) {
                    args.code = codeMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
                  }
                  if (langMatch) {
                    args.language = langMatch[1];
                  }
                  if (!args.code && !args.language) {
                    // Último recurso: tentar encontrar código em blocos markdown
                    const codeBlockMatch = rawArgs.match(/```(\w+)?\n([\s\S]*?)```/);
                    if (codeBlockMatch) {
                      args.language = codeBlockMatch[1] || "python";
                      args.code = codeBlockMatch[2];
                    }
                  }
                }
              }
              // CASO 2: Objeto JavaScript (já parseado) - usar diretamente
              else if (typeof rawArgs === "object" && rawArgs !== null) {
                // Ollama já retornou como objeto, usar diretamente
                console.log(`[AutoGen] ✅ Argumentos já são objeto:`, JSON.stringify(rawArgs, null, 2));
                args = rawArgs;
              }
              // CASO 3: Outros tipos (null, undefined, number, boolean)
              else if (rawArgs !== null && rawArgs !== undefined) {
                // Tentar converter para string e parsear
                try {
                  args = JSON.parse(String(rawArgs));
                } catch {
                  args = { code: String(rawArgs), language: "python" };
                }
              }
              
              // Validar que args tem pelo menos 'code' ou 'language'
              if (!args || (typeof args !== "object")) {
                console.warn(`[AutoGen] ⚠️ Argumentos inválidos após parsing:`, rawArgs);
                args = {};
              }
            } catch (parseError: any) {
              console.error(`[AutoGen] ❌ Erro crítico ao parsear argumentos do tool_call:`, parseError);
              console.error(`[AutoGen] ❌ Tipo do rawArgs:`, typeof rawArgs);
              console.error(`[AutoGen] ❌ Valor do rawArgs:`, rawArgs);
              console.error(`[AutoGen] ❌ Stringify do rawArgs:`, JSON.stringify(rawArgs));
              args = {};
            }
            
            // Extrair código e linguagem - tentar várias chaves possíveis
            const language = args.language || args.lang || "python";
            const code = args.code || args.code_string || args.code_block || args.command;
            
            console.log(`[AutoGen] 📋 Argumentos parseados:`, {
              language,
              code: code ? code.substring(0, 100) : "N/A",
              argsKeys: Object.keys(args),
            });
            
            if (code && typeof code === "string" && code.trim().length > 0) {
              console.log(`[AutoGen] ✅ Executando código (${language}): ${code.substring(0, 100)}...`);
              
              try {
                // Executar código automaticamente
                const result = await executeCode(code, language, {
                  timeout: 60000, // 60 segundos para comandos que abrem aplicativos
                  workspace: process.cwd(),
                });
                
                console.log(`[AutoGen] ✅ Resultado da execução:`, {
                  success: result.success,
                  outputLength: result.output?.length || 0,
                  errorLength: result.error?.length || 0,
                  executionTime: result.executionTime,
                });
                
                // Adicionar resultado à resposta - garantir que output/error sejam strings válidas
                const outputStr = result.output ? String(result.output) : "Sem saída";
                const errorStr = result.error ? String(result.error) : "Erro desconhecido";
                
                if (result.success) {
                  // Mensagem mais amigável para comandos que abrem aplicativos
                  if (outputStr && outputStr.includes("aberto em nova janela") || outputStr.includes("Aplicativo")) {
                    responseContent = `✅ **Comando executado com sucesso!**\n\n${outputStr}`;
                  } else if (outputStr && outputStr.trim().length > 0 && !outputStr.includes("Sem saída")) {
                    responseContent = `✅ **Comando executado com sucesso!**\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n**Resultado:**\n\`\`\`\n${outputStr}\n\`\`\``;
                  } else {
                    responseContent = `✅ **Comando executado com sucesso!**\n\nComando: \`${code}\`\n\nSe você pediu para abrir um aplicativo, ele deve estar aberto agora.`;
                  }
                } else {
                  responseContent = `❌ **Erro ao executar comando**\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n**Erro:**\n\`\`\`\n${errorStr}\n\`\`\``;
                }
              } catch (execError: any) {
                console.error(`[AutoGen] ❌ Erro ao executar código:`, execError);
                const execErrorMessage = execError instanceof Error ? execError.message : String(execError);
                responseContent = `**❌ Erro ao executar código (${language}):**\n\`\`\`${language}\n${code}\n\`\`\`\n\n**Erro:**\n\`\`\`\n${execErrorMessage}\n\`\`\``;
              }
            } else {
              console.warn(`[AutoGen] ⚠️ Código não encontrado ou inválido nos argumentos:`, args);
              console.warn(`[AutoGen] ⚠️ Tipo do código:`, typeof code);
              console.warn(`[AutoGen] ⚠️ Valor do código:`, code);
              console.warn(`[AutoGen] ⚠️ Chaves disponíveis em args:`, Object.keys(args));
              responseContent = `**⚠️ Erro:** Não foi possível extrair o código dos argumentos do tool_call.\n\n**Argumentos recebidos:**\n\`\`\`json\n${JSON.stringify(args, null, 2)}\n\`\`\``;
            }
          } catch (error: any) {
            console.error("[AutoGen] ❌ Erro ao executar function call:", error);
            console.error("[AutoGen] ❌ Stack trace:", error?.stack);
            
            // Garantir que a mensagem de erro seja uma string válida
            let errorMessage: string;
            try {
              if (error instanceof Error) {
                errorMessage = error.message;
              } else if (typeof error === "object" && error !== null) {
                // Tentar serializar objeto de erro
                errorMessage = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
              } else {
                errorMessage = String(error);
              }
            } catch (stringifyError) {
              errorMessage = "Erro desconhecido ao processar código";
            }
            
            responseContent += `\n\n⚠️ Erro ao executar código: ${errorMessage}`;
          }
        }
      }
    }
    
    // VALIDAÇÃO CRÍTICA: Se a resposta ainda estiver vazia após processar tool_calls, usar fallback
    if (!responseContent || responseContent.length === 0) {
      console.warn(`[AutoGen] ⚠️ Resposta vazia após processar tool_calls! Usando fallback...`);
      console.warn(`[AutoGen] ⚠️ Resposta original tinha ${originalLength} chars`);
      console.warn(`[AutoGen] ⚠️ Primeiros 500 chars da resposta original:`, originalContent.substring(0, 500));
      
      // Tentar extrair conteúdo antes dos thinking tokens
      const beforeThinking = originalContent.split(/<think|<reasoning|<redacted_reasoning/i)[0]?.trim();
      if (beforeThinking && beforeThinking.length > 0) {
        console.log(`[AutoGen] ✅ Encontrado conteúdo antes dos thinking tokens: "${beforeThinking}"`);
        responseContent = beforeThinking;
      } else {
        // Fallback baseado no tipo de intenção
        if (intent.type === "conversation") {
          responseContent = "Oi! Tudo bem sim, obrigado! Como posso te ajudar hoje?";
        } else if (intent.type === "question") {
          responseContent = "Desculpe, não consegui processar sua pergunta. Pode reformular?";
        } else {
          responseContent = "Desculpe, não consegui processar sua solicitação. Pode tentar novamente?";
        }
        console.log(`[AutoGen] ✅ Fallback aplicado: "${responseContent}"`);
      }
    }
    
    // VALIDAÇÃO FINAL: Garantir que sempre há uma resposta
    if (!responseContent || responseContent.trim().length === 0) {
      console.error(`[AutoGen] ❌ Resposta final está vazia! Aplicando fallback de emergência...`);
      responseContent = intent.type === "conversation" 
        ? "Oi! Tudo bem sim, obrigado! Como posso te ajudar hoje?"
        : "Desculpe, não consegui gerar uma resposta. Pode tentar novamente?";
    }
    
    console.log(`[AutoGen] ✅ Retornando resposta final (${responseContent.length} chars)`);
    return responseContent;
  } catch (error) {
    console.error("[AutoGen] ❌ Erro ao chamar Ollama:", error);
    if (error instanceof Error) {
      console.error("[AutoGen] ❌ Mensagem de erro:", error.message);
      console.error("[AutoGen] ❌ Stack trace:", error.stack);
    }
    throw error;
  }
}

/**
 * Detectar linguagem de programação da tarefa
 */
function detectLanguage(task: string): string {
  const languageKeywords: Record<string, string[]> = {
    'python': ['python', 'py', 'pytest', 'django', 'flask', 'pandas', 'numpy'],
    'javascript': ['javascript', 'js', 'node', 'react', 'vue', 'angular', 'typescript', 'ts'],
    'typescript': ['typescript', 'ts', 'angular', 'nest'],
    'go': ['go', 'golang'],
    'rust': ['rust', 'rs', 'cargo'],
    'java': ['java', 'spring', 'maven', 'gradle'],
    'csharp': ['c#', 'csharp', 'dotnet', '.net', 'asp.net'],
    'cpp': ['c++', 'cpp', 'cplusplus'],
    'c': ['c programming', 'c language'],
    'php': ['php', 'laravel', 'symfony'],
    'ruby': ['ruby', 'rails', 'ruby on rails'],
    'shell': ['bash', 'shell', 'sh', 'zsh', 'script'],
    'sql': ['sql', 'database', 'query', 'mysql', 'postgresql'],
    'html': ['html', 'css', 'web', 'frontend'],
    'css': ['css', 'stylesheet', 'styling'],
  };
  
  const lowerTask = task.toLowerCase();
  
  for (const [language, keywords] of Object.entries(languageKeywords)) {
    if (keywords.some(keyword => lowerTask.includes(keyword))) {
      return language;
    }
  }
  
  // Default: Python (mais comum)
  return 'python';
}

/**
 * Verificar se Ollama está disponível
 */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn("[AutoGen] Ollama não respondeu a tempo (timeout)");
    } else {
      console.warn("[AutoGen] Ollama não disponível:", error);
    }
    return false;
  }
}

/**
 * Verificar se o modelo está instalado
 */
export async function checkModelAvailable(model: string = DEFAULT_MODEL): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    // Verificar se o modelo está instalado (pode ser "deepseek-r1", "deepseek-r1:8b", "deepseek-r1:latest", etc.)
    const modelFound = models.some((m: any) => {
      const modelName = m.name || "";
      // Aceitar exatamente o nome, ou variações com tag (ex: "deepseek-r1:8b", "deepseek-r1:latest")
      return modelName === model || 
             modelName.startsWith(`${model}:`) ||
             modelName.includes(model);
    });
    
    if (!modelFound) {
      console.warn(`[AutoGen] Modelo '${model}' não encontrado. Modelos disponíveis:`, models.map((m: any) => m.name));
    } else {
      const foundModel = models.find((m: any) => {
        const modelName = m.name || "";
        return modelName === model || modelName.startsWith(`${model}:`) || modelName.includes(model);
      });
      console.log(`[AutoGen] Modelo encontrado: ${foundModel?.name || model}`);
    }
    
    return modelFound;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn("[AutoGen] Timeout ao verificar modelo");
    } else {
      console.warn("[AutoGen] Erro ao verificar modelo:", error);
    }
    return false;
  }
}

/**
 * Verificar se AutoGen está disponível
 */
export async function checkAutoGenAvailable(): Promise<{ available: boolean; reason?: string; details?: any }> {
  try {
    // Verificar Ollama primeiro
    const ollamaAvailable = await checkOllamaAvailable();
    if (!ollamaAvailable) {
      return {
        available: false,
        reason: "Ollama não está rodando",
        details: {
          ollama_url: OLLAMA_BASE_URL,
          suggestion: "Execute 'ollama serve' para iniciar o Ollama",
        },
      };
    }

    // Verificar modelo
    const modelAvailable = await checkModelAvailable();
    if (!modelAvailable) {
      return {
        available: false,
        reason: `Modelo '${DEFAULT_MODEL}' não está instalado`,
        details: {
          model: DEFAULT_MODEL,
          suggestion: `Execute 'ollama pull ${DEFAULT_MODEL}' para instalar o modelo`,
        },
      };
    }

    // Verificar framework
    // O framework pode funcionar apenas com Ollama, sem precisar do módulo Python completo
    const framework = await initializeAutoGen();
    if (!framework || !framework.initialized) {
      return {
        available: false,
        reason: "AutoGen Framework não inicializado",
        details: {
          suggestion: "Verifique se Ollama está rodando e o modelo está instalado",
        },
      };
    }

    // Se chegou até aqui, Ollama está rodando, modelo está instalado e framework está inicializado
    return { available: true };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : "Erro desconhecido",
      details: { error },
    };
  }
}

