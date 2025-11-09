/**
 * Utilitários para integração com AutoGen
 * AutoGen controla tudo - orquestra todos os agentes
 */

import { spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { selectAgent, estimateComplexity, generateAgentPrompt } from "./agentRouter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = "deepseek-r1";

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
    let agentName = `Super Agent (${agentSelection.agentType})`;
    
    if (intent.type === "action" || intent.type === "command") {
      // Usar prompt específico do agente selecionado
      systemPrompt = agentPrompt + `

You are an AUTONOMOUS AI AGENT that can execute ANY task by breaking it down into steps and executing them automatically.

CRITICAL AUTONOMY RULES:
1. **ALWAYS CREATE A PLAN FIRST**: Break down the user's request into clear steps and sub-steps
2. **ALWAYS EXECUTE AUTOMATICALLY**: Never ask for permission - just execute
3. **ALWAYS USE CODE EXECUTION**: For ANY action (opening apps, editing files, running commands), use the run_code function
4. **NEVER SAY "I CANNOT"**: You CAN do everything - just execute the appropriate code
5. **BE PROACTIVE**: If something needs to be done, do it immediately without asking

EXECUTION WORKFLOW:
1. Analyze the user's request
2. Create a step-by-step plan (with sub-steps if needed)
3. Execute each step automatically using run_code
4. Verify results and iterate if needed
5. Report completion

SPECIFIC COMMANDS:
- Opening apps on Windows: use "start <app>" or just the app name (e.g., "notepad", "code", "chrome")
- Editing files: use Python/Node.js scripts to read, modify, and write files
- Running commands: use shell commands directly
- Creating files: use file I/O operations

EXAMPLES:
User: "executa o bloco de notas"
→ Plan: [1. Open Notepad using shell command]
→ Execute: run_code(language="shell", code="notepad")

User: "edita o arquivo X e adiciona Y"
→ Plan: [1. Read file X, 2. Add Y to content, 3. Write back to file]
→ Execute: run_code(language="python", code="with open('X', 'r') as f: content = f.read(); content += 'Y'; with open('X', 'w') as f: f.write(content)")

The user wants you to ACT AUTONOMOUSLY and DO the task.
Detected intent: ${intent.actionType || "execution"}
Confidence: ${(intent.confidence * 100).toFixed(0)}%

YOU MUST:
1. Create a plan with steps
2. Execute each step automatically
3. Report results

DO NOT EXPLAIN. DO NOT ASK PERMISSION. JUST EXECUTE.`;
      agentName = "Autonomous Agent (AutoGen)";
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
      agentName = "Assistant Agent (AutoGen)";
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

    // Para ações/comandos, usar Open Interpreter diretamente (ele já executa automaticamente)
    if (intent.type === "action" || intent.type === "command") {
      try {
        // Usar Open Interpreter existente do projeto (ele já faz tudo automaticamente)
        const projectRoot = path.resolve(__dirname, "../../../");
        const interpreterPath = path.join(projectRoot, "interpreter");
        
        // Executar via Python usando Open Interpreter original
        // IMPORTANTE: Usar execução como módulo para evitar problemas com imports relativos
        const { spawn } = await import("child_process");
        
        // Escapar task para uso seguro no Python (usar base64 para evitar problemas com caracteres especiais)
        const taskBase64 = Buffer.from(task, 'utf-8').toString('base64');
        
        // Construir script Python que será executado diretamente com -c
        // Isso garante que os imports relativos funcionem corretamente
        const pythonScript = [
          "#!/usr/bin/env python3",
          "# -*- coding: utf-8 -*-",
          "import sys",
          "import os",
          "import json",
          "import base64",
          "",
          `# Adicionar caminhos ao sys.path ANTES de qualquer import`,
          `project_root = r"${projectRoot.replace(/\\/g, '/')}"`,
          `interpreter_path = r"${interpreterPath.replace(/\\/g, '/')}"`,
          "",
          `# IMPORTANTE: Adicionar ao sys.path na ordem correta`,
          `# Primeiro o diretório raiz do projeto (onde está o pacote interpreter)`,
          `if project_root not in sys.path:`,
          `    sys.path.insert(0, project_root)`,
          `# Depois o diretório interpreter (caso precise)`,
          `if interpreter_path not in sys.path:`,
          `    sys.path.insert(0, interpreter_path)`,
          "",
          `# Mudar para o diretório do projeto para que os imports relativos funcionem`,
          `os.chdir(project_root)`,
          "",
          `# Importar Interpreter diretamente do módulo`,
          `# O __init__.py do interpreter já faz sys.modules["interpreter"] = Interpreter()`,
          `# Então precisamos importar a classe diretamente`,
          `try:`,
          `    # Primeiro, garantir que o diretório interpreter está no sys.path`,
          `    # e que os imports relativos funcionarão`,
          `    import importlib.util`,
          `    spec = importlib.util.spec_from_file_location("interpreter.interpreter", os.path.join(project_root, "interpreter", "interpreter.py"))`,
          `    if spec and spec.loader:`,
          `        interpreter_module = importlib.util.module_from_spec(spec)`,
          `        # Criar um módulo pai 'interpreter' para que os imports relativos funcionem`,
          `        import types`,
          `        parent_module = types.ModuleType("interpreter")`,
          `        sys.modules["interpreter"] = parent_module`,
          `        sys.modules["interpreter.interpreter"] = interpreter_module`,
          `        spec.loader.exec_module(interpreter_module)`,
          `        Interpreter = interpreter_module.Interpreter`,
          `        print(f"[DEBUG] Interpreter importado via importlib", file=sys.stderr)`,
          `    else:`,
          `        raise ImportError("Não foi possível criar spec para interpreter.interpreter")`,
          `except Exception as e:`,
          `    print(f"[DEBUG] Erro ao importar via importlib: {e}", file=sys.stderr)`,
          `    # Fallback: tentar importação normal`,
          `    try:`,
          `        from interpreter.interpreter import Interpreter`,
          `        print(f"[DEBUG] Interpreter importado via importação normal", file=sys.stderr)`,
          `    except ImportError as import_err:`,
          `        print(f"[DEBUG] Erro ao importar Interpreter: {import_err}", file=sys.stderr)`,
          `        print(f"[DEBUG] sys.path: {sys.path}", file=sys.stderr)`,
          `        raise import_err`,
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
          `# Open Interpreter já executa código automaticamente`,
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
        
        // Executar script Python diretamente com -c (não precisa salvar arquivo)
        // Isso garante que o diretório de trabalho está correto e os imports relativos funcionam
        const python = spawn("python", ["-c", pythonScript], {
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
        
        const result = await new Promise<string>((resolve, reject) => {
          python.on("close", (code) => {
            // Não precisa limpar arquivo temporário (não estamos usando mais)
            
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
    let ollamaResponse = await callOllamaWithAutoGenPrompt(
      systemPrompt,
      task,
      framework.model,
      intent,
      images.length > 0 ? images : undefined
    );

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
                workingDirectory: process.cwd(),
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

