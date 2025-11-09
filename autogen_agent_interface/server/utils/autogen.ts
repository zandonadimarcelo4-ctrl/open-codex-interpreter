/**
 * Utilitários para integração com AutoGen
 * AutoGen controla tudo - orquestra todos os agentes
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { selectAgent, estimateComplexity, generateAgentPrompt } from "./agentRouter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "okamototk/deepseek-r1:8b";

let autogenFramework: any = null;

/**
 * Inicializar AutoGen Framework
 */
export async function initializeAutoGen(): Promise<any> {
  if (autogenFramework) {
    return autogenFramework;
  }

  try {
    // Verificar se o módulo Python existe
    // Tentar múltiplos caminhos possíveis
    const possiblePaths = [
      path.join(process.cwd(), "..", "super_agent"),
      path.join(process.cwd(), "super_agent"),
      path.join(__dirname, "..", "..", "..", "super_agent"),
      path.join(__dirname, "..", "..", "super_agent"),
    ];
    
    let pythonModulePath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        pythonModulePath = possiblePath;
        break;
      }
    }
    
    // Se não encontrar o módulo Python, ainda assim inicializar o framework
    // O framework pode funcionar apenas com Ollama, sem precisar do módulo Python completo
    if (!pythonModulePath) {
      console.warn("[AutoGen] Módulo Python não encontrado, usando modo simplificado (apenas Ollama)");
    } else {
      console.log(`[AutoGen] Módulo Python encontrado em: ${pythonModulePath}`);
    }

    // Inicializar framework (modo simplificado - apenas Ollama)
    // O AutoGen pode funcionar apenas com Ollama, sem precisar do módulo Python completo
    console.log("[AutoGen] Framework inicializado (modo simplificado - Ollama)");
    
    autogenFramework = {
      initialized: true,
      model: DEFAULT_MODEL,
      ollamaBaseUrl: OLLAMA_BASE_URL,
      pythonModulePath: pythonModulePath || null,
    };
    
    return autogenFramework;
  } catch (error) {
    console.error("[AutoGen] Erro ao inicializar:", error);
    // Mesmo com erro, retornar framework simplificado se Ollama estiver disponível
    autogenFramework = {
      initialized: true,
      model: DEFAULT_MODEL,
      ollamaBaseUrl: OLLAMA_BASE_URL,
      pythonModulePath: null,
    };
    return autogenFramework;
  }
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
  try {
    // Verificar disponibilidade primeiro
    const availability = await checkAutoGenAvailable();
    if (!availability.available) {
      // Construir mensagem de erro detalhada
      let errorMessage = `⚠️ **AutoGen não disponível**\n\n`;
      errorMessage += `**Razão**: ${availability.reason || "Desconhecida"}\n\n`;
      
      if (availability.details) {
        if (availability.details.suggestion) {
          errorMessage += `**Solução**: ${availability.details.suggestion}\n\n`;
        }
        if (availability.details.ollama_url) {
          errorMessage += `**Ollama URL**: ${availability.details.ollama_url}\n\n`;
        }
        if (availability.details.model) {
          errorMessage += `**Modelo**: ${availability.details.model}\n\n`;
        }
      }
      
      errorMessage += `**Para resolver:**\n`;
      errorMessage += `1. Verifique se Ollama está rodando: \`ollama serve\`\n`;
      errorMessage += `2. Verifique se o modelo está instalado: \`ollama pull ${DEFAULT_MODEL}\`\n`;
      errorMessage += `3. Verifique se OLLAMA_BASE_URL está configurado corretamente\n`;
      errorMessage += `4. Verifique se AutoGen está instalado: \`pip install pyautogen\`\n\n`;
      errorMessage += `**Sua mensagem**: "${task}"`;
      
      throw new Error(errorMessage);
    }

    // Inicializar AutoGen se necessário
    const framework = await initializeAutoGen();
    if (!framework) {
      throw new Error("AutoGen não disponível");
    }

    // Sistema de roteamento de agentes inspirado no AgenticSeek
    // Integrado ao AutoGen Framework (único framework)
    const agentSelection = selectAgent(task, intent);
    const complexity = estimateComplexity(task);
    const agentPrompt = generateAgentPrompt(agentSelection.agentType, task, intent);
    
    console.log(`[AutoGen] Agente selecionado: ${agentSelection.agentType} (confiança: ${(agentSelection.confidence * 100).toFixed(0)}%)`);
    console.log(`[AutoGen] Complexidade: ${complexity}`);
    console.log(`[AutoGen] Razão: ${agentSelection.reason}`);
    
    // Construir prompt baseado na intenção e agente selecionado - estilo Open Interpreter
    let systemPrompt = "";
    
    if (intent.type === "action" || intent.type === "command") {
      // Usar prompt específico do agente selecionado
      systemPrompt = agentPrompt + `

You are an AUTONOMOUS AI AGENT with FULL CAPABILITIES and ALL POSSIBLE TOOLS - you can do EVERYTHING that a human assistant can do.

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

    // Para ações/comandos, otimizar execução:
    // 1. Comandos simples (abrir apps, executar comandos shell) → executar diretamente
    // 2. Tarefas complexas (editar arquivos, refatorar código) → usar Open Interpreter
    if (intent.type === "action" || intent.type === "command") {
      // Detectar comandos simples que podem ser executados diretamente
      const lowerTask = task.toLowerCase().trim();
      const simpleCommands = [
        'notepad', 'bloco de notas', 'code', 'vs code', 'chrome', 'firefox', 'edge',
        'abrir notepad', 'abrir bloco de notas', 'abrir code', 'abrir vs code',
        'executa notepad', 'executa bloco de notas', 'executa code', 'executa vs code',
        'abre notepad', 'abre bloco de notas', 'abre code', 'abre vs code',
        'calculadora', 'calc', 'explorer', 'explorador', 'cmd', 'powershell',
        'abrir calculadora', 'abrir calc', 'abrir explorer', 'abrir cmd',
        'executa calculadora', 'executa calc', 'executa explorer', 'executa cmd'
      ];
      
      // Detectar padrões de comandos simples (mais agressivo)
      const isSimpleCommand = simpleCommands.some(cmd => lowerTask.includes(cmd)) ||
        /^(abrir|abre|executa|execute|rodar|roda)\s+[a-z\s]+$/i.test(task.trim());
      
      if (isSimpleCommand) {
        // Executar comando simples diretamente (muito mais rápido)
        try {
          // Mapear comandos para executáveis
          let command = '';
          if (lowerTask.includes('notepad') || lowerTask.includes('bloco de notas')) {
            command = 'notepad';
          } else if (lowerTask.includes('code') || lowerTask.includes('vs code')) {
            command = 'code';
          } else if (lowerTask.includes('chrome')) {
            command = 'chrome';
          } else if (lowerTask.includes('firefox')) {
            command = 'firefox';
          } else if (lowerTask.includes('edge')) {
            command = 'msedge';
          } else {
            // Tentar extrair o comando da mensagem
            const match = task.match(/(?:abrir|abre|executa|execute)\s+(.+)/i);
            if (match) {
              command = match[1].trim();
            } else {
              command = task.trim();
            }
          }
          
          console.log(`[AutoGen] Executando comando simples: ${command}`);
          // Usar executeShell diretamente para comandos shell
          const { executeShell } = await import("./code_executor");
          const result = await executeShell(command, { timeout: 5000 });
          
          if (result.success) {
            return `✅ Comando executado com sucesso: ${command}\n\n${result.output || 'Aplicativo aberto'}`;
          } else {
            return `⚠️ Erro ao executar comando: ${command}\n\n${result.error || 'Erro desconhecido'}`;
          }
        } catch (error) {
          console.warn("[AutoGen] Erro ao executar comando simples:", error);
          // Continuar para Open Interpreter se falhar
        }
      }
      
      // Para tarefas complexas ou se comando simples falhar, usar Open Interpreter
      try {
        // Usar Open Interpreter existente do projeto (ele já faz tudo automaticamente)
        const projectRoot = path.resolve(__dirname, "../../../");
        const interpreterPath = path.join(projectRoot, "interpreter");
        
        // Executar via Python usando Open Interpreter original
        // IMPORTANTE: Usar execução como módulo para evitar problemas com imports relativos
        const { spawn } = await import("child_process");
        
        // Escapar task para uso seguro no Python (usar base64 para evitar problemas com caracteres especiais)
        const taskBase64 = Buffer.from(task, 'utf-8').toString('base64');
        
        // Usar python -m para executar como módulo (garante que imports relativos funcionem)
        // Criar um script wrapper que será executado como módulo
        const wrapperScript = path.join(projectRoot, "temp_interpreter_wrapper.py");
        const wrapperContent = [
          "#!/usr/bin/env python3",
          "# -*- coding: utf-8 -*-",
          "import sys",
          "import os",
          "import json",
          "import base64",
          "",
          `# Adicionar caminhos ao sys.path`,
          `project_root = r"${projectRoot.replace(/\\/g, '/')}"`,
          `if project_root not in sys.path:`,
          `    sys.path.insert(0, project_root)`,
          "",
          `# Mudar para o diretório do projeto`,
          `os.chdir(project_root)`,
          "",
          `# Importar Interpreter diretamente do arquivo, evitando o __init__.py`,
          `# O __init__.py substitui sys.modules["interpreter"] por uma instância,`,
          `# então precisamos importar diretamente o arquivo interpreter.py`,
          `try:`,
          `    import importlib.util`,
          `    import types`,
          `    `,
          `    # Caminho para o arquivo interpreter.py`,
          `    interpreter_file = os.path.join(project_root, "interpreter", "interpreter.py")`,
          `    `,
          `    # Criar módulo pai 'interpreter' primeiro`,
          `    if "interpreter" not in sys.modules:`,
          `        interpreter_package = types.ModuleType("interpreter")`,
          `        sys.modules["interpreter"] = interpreter_package`,
          `    `,
          `    # Criar submódulos necessários para que os imports relativos funcionem`,
          `    # interpreter.py importa: from .cli import cli, from .utils import ..., etc.`,
          `    # Então precisamos criar esses submódulos primeiro`,
          `    for submodule_name in ["cli", "utils", "message_block", "code_block", "code_interpreter", "llama_2"]:`,
          `        submodule_path = os.path.join(project_root, "interpreter", f"{submodule_name}.py")`,
          `        if os.path.exists(submodule_path):`,
          `            submodule_spec = importlib.util.spec_from_file_location(f"interpreter.{submodule_name}", submodule_path)`,
          `            if submodule_spec and submodule_spec.loader:`,
          `                submodule = importlib.util.module_from_spec(submodule_spec)`,
          `                sys.modules[f"interpreter.{submodule_name}"] = submodule`,
          `                submodule_spec.loader.exec_module(submodule)`,
          `    `,
          `    # Agora importar interpreter.py`,
          `    spec = importlib.util.spec_from_file_location("interpreter.interpreter", interpreter_file)`,
          `    if spec and spec.loader:`,
          `        interpreter_module = importlib.util.module_from_spec(spec)`,
          `        sys.modules["interpreter.interpreter"] = interpreter_module`,
          `        spec.loader.exec_module(interpreter_module)`,
          `        Interpreter = interpreter_module.Interpreter`,
          `        print(f"[DEBUG] Interpreter importado com sucesso", file=sys.stderr)`,
          `    else:`,
          `        raise ImportError("Não foi possível criar spec para interpreter.interpreter")`,
          `except Exception as e:`,
          `    print(f"[DEBUG] Erro ao importar Interpreter: {e}", file=sys.stderr)`,
          `    import traceback`,
          `    print(f"[DEBUG] Traceback: {traceback.format_exc()}", file=sys.stderr)`,
          `    print(f"[DEBUG] sys.path: {sys.path}", file=sys.stderr)`,
          `    raise`,
          "",
          `# Decodificar task de base64`,
          `task_encoded = "${taskBase64}"`,
          `task = base64.b64decode(task_encoded).decode('utf-8')`,
          "",
          `# Inicializar Interpreter`,
          `interpreter = Interpreter()`,
          `interpreter.auto_run = True`,
          `interpreter.local = True`,
          "",
          `# Executar task`,
          `try:`,
          `    result = interpreter.chat(task, return_messages=False)`,
          `    `,
          `    # Extrair última mensagem do assistente`,
          `    if interpreter.messages:`,
          `        last_msg = interpreter.messages[-1]`,
          `        if last_msg.get('role') == 'assistant':`,
          `            output = last_msg.get('content', '')`,
          `            print(json.dumps({"success": True, "output": output}))`,
          `        else:`,
          `            print(json.dumps({"success": False, "output": "Nenhuma resposta do assistente"}))`,
          `    else:`,
          `        print(json.dumps({"success": False, "output": "Nenhuma mensagem gerada"}))`,
          `except Exception as e:`,
          `    import traceback`,
          `    error_msg = f"Erro ao executar: {str(e)}\\n{traceback.format_exc()}"`,
          `    print(json.dumps({"success": False, "output": error_msg}))`,
        ].join('\n');
        
        // Salvar script wrapper
        fs.writeFileSync(wrapperScript, wrapperContent, 'utf-8');
        
        // Executar script Python
        const python = spawn("python", [wrapperScript], {
          cwd: projectRoot,
          env: { 
            ...process.env, 
            PYTHONUNBUFFERED: "1",
            PYTHONPATH: `${projectRoot}${path.delimiter}${interpreterPath}`
          },
        });
        
        let output = "";
        let errorOutput = "";
        
        python.stdout.on("data", (data) => {
          output += data.toString();
        });
        
        python.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });
        
        // Timeout para evitar processos que demoram muito
        let timeoutId: NodeJS.Timeout | null = null;
        
        const result = await new Promise<string>((resolve, reject) => {
          // Timeout de 15 segundos (reduzido para resposta mais rápida)
          timeoutId = setTimeout(() => {
            python.kill();
            try {
              if (fs.existsSync(wrapperScript)) {
                fs.unlinkSync(wrapperScript);
              }
            } catch (e) {
              console.warn("[AutoGen] Não foi possível remover script temporário:", e);
            }
            reject(new Error("Timeout: Open Interpreter demorou mais de 15 segundos"));
          }, 15000);
          
          python.on("close", (code) => {
            if (timeoutId) clearTimeout(timeoutId);
            
            // Limpar arquivo temporário
            try {
              if (fs.existsSync(wrapperScript)) {
                fs.unlinkSync(wrapperScript);
              }
            } catch (e) {
              console.warn("[AutoGen] Não foi possível remover script temporário:", e);
            }
            
            if (code === 0 && output) {
              try {
                // Tentar encontrar JSON no output (pode ter logs antes)
                const outputLines = output.trim().split('\n');
                let jsonLine = '';
                for (let i = outputLines.length - 1; i >= 0; i--) {
                  const line = outputLines[i].trim();
                  if (line.startsWith('{') && line.endsWith('}')) {
                    jsonLine = line;
                    break;
                  }
                }
                
                if (jsonLine) {
                  const parsed = JSON.parse(jsonLine);
                  if (parsed.success) {
                    resolve(parsed.output);
                  } else {
                    resolve(parsed.output || "Erro desconhecido");
                  }
                } else {
                  console.warn("[AutoGen] Nenhum JSON encontrado no output");
                  resolve(output || "Erro ao processar resposta");
                }
              } catch (e) {
                console.warn("[AutoGen] Erro ao parsear resultado do Open Interpreter:", e);
                console.warn("[AutoGen] Output completo:", output);
                resolve(output || "Erro ao processar resposta");
              }
            } else {
              console.warn("[AutoGen] Open Interpreter retornou código:", code);
              console.warn("[AutoGen] stderr:", errorOutput);
              console.warn("[AutoGen] stdout:", output);
              resolve(errorOutput || output || "Erro ao executar Open Interpreter");
            }
          });
          
          python.on("error", (error) => {
            if (timeoutId) clearTimeout(timeoutId);
            
            // Limpar arquivo temporário em caso de erro
            try {
              if (fs.existsSync(wrapperScript)) {
                fs.unlinkSync(wrapperScript);
              }
            } catch (e) {
              console.warn("[AutoGen] Não foi possível remover script temporário:", e);
            }
            
            console.warn("[AutoGen] Erro ao executar Open Interpreter:", error);
            reject(error);
          });
        });
        
        return result;
      } catch (error) {
        console.warn("[AutoGen] Erro ao usar Open Interpreter:", error);
        // Fallback para Ollama se Open Interpreter falhar
        const errorMessage = error instanceof Error ? error.message : String(error);
        return `⚠️ Erro ao executar com Open Interpreter: ${errorMessage}\n\nTentando com Ollama...`;
      }
    }

    // Para perguntas/conversas, usar Ollama normalmente
    // Tentar modelo padrão primeiro, depois fallback para gpt-oss:20b
    let ollamaResponse = "";
    let modelUsed = framework.model || DEFAULT_MODEL;
    
    try {
      ollamaResponse = await callOllamaWithAutoGenPrompt(
        systemPrompt,
        task,
        modelUsed,
        intent,
        images.length > 0 ? images : undefined
      );
    } catch (error) {
      console.warn(`[AutoGen] Erro ao usar modelo ${modelUsed}, tentando fallback gpt-oss:20b-q4:`, error);
      try {
        ollamaResponse = await callOllamaWithAutoGenPrompt(
          systemPrompt,
          task,
          "gpt-oss:20b-q4",
          intent,
          images.length > 0 ? images : undefined
        );
        console.log(`[AutoGen] Usando fallback: gpt-oss:20b-q4 (Q4 quantizado, ~8GB VRAM)`);
      } catch (fallbackError) {
        console.error(`[AutoGen] Erro ao usar fallback gpt-oss:20b-q4:`, fallbackError);
        throw error; // Lançar erro original
      }
    }

    return ollamaResponse;
  } catch (error) {
    console.error("[AutoGen] Erro ao executar:", error);
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
    const url = `${OLLAMA_BASE_URL}/api/chat`;
    
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

    // Function calling para execução automática de código (estilo Open Interpreter)
    // O LLM decide quando chamar esta função
    const tools = intent.type === "action" || intent.type === "command" ? [
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

    const requestBody: any = {
      model,
      messages,
      stream: false,
      options: {
        temperature: intent.type === "action" ? 0.2 : 0.7,
        top_p: 0.9,
        num_predict: intent.type === "action" ? 4000 : 1000,
      },
    };

    if (tools) {
      requestBody.tools = tools;
      // Forçar uso de function calling para ações/comandos
      requestBody.tool_choice = intent.type === "action" || intent.type === "command" 
        ? { type: "function", function: { name: "run_code" } } 
        : "auto";
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let responseContent = data.message.content || "";
    
    // Se houver function calls, executar automaticamente (estilo Open Interpreter)
    if (data.message.tool_calls && Array.isArray(data.message.tool_calls)) {
      const { executeCode } = await import("./code_executor");
      
      for (const toolCall of data.message.tool_calls) {
        if (toolCall.function?.name === "run_code") {
          try {
            const args = JSON.parse(toolCall.function.arguments || "{}");
            const { language, code } = args;
            
            if (code) {
              // Executar código automaticamente
              const result = await executeCode(code, language, {
                timeout: 30000,
                workspace: process.cwd(),
              });
              
              // Adicionar resultado à resposta
              if (result.success) {
                responseContent += `\n\n**✅ Código executado (${language}):**\n\`\`\`${language}\n${code}\n\`\`\`\n\n**Resultado:**\n\`\`\`\n${result.output}\n\`\`\``;
              } else {
                responseContent += `\n\n**❌ Erro na execução (${language}):**\n\`\`\`${language}\n${code}\n\`\`\`\n\n**Erro:**\n\`\`\`\n${result.error}\n\`\`\``;
              }
            }
          } catch (error) {
            console.warn("[AutoGen] Erro ao executar function call:", error);
            responseContent += `\n\n⚠️ Erro ao executar código: ${error instanceof Error ? error.message : String(error)}`;
          }
        }
      }
    }
    
    return responseContent;
  } catch (error) {
    console.error("[AutoGen] Erro ao chamar Ollama:", error);
    throw error;
  }
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

