/**
 * Visual Code Agent - Agente de Geração de Código a Partir de Imagens
 * 
 * Capacidades:
 * - Análise de imagens de código
 * - Geração de código a partir de screenshots
 * - Análise visual de interfaces
 * - Extração de código de imagens
 * - Integração com After Effects MCP (futuro)
 */

interface VisualCodeRequest {
  imageUrl: string; // URL ou base64 da imagem
  language?: string;
  description?: string;
  context?: string;
}

interface VisualCodeResult {
  code: string;
  language: string;
  confidence: number;
  extractedElements: Array<{ type: string; content: string; position?: { x: number; y: number; width: number; height: number } }>;
  suggestions: string[];
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
// Modelo quantizado otimizado para RTX NVIDIA (Q4_K_M)
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "deepseek-coder-v2-16b-q4_k_m-rtx";

/**
 * Analisar imagem e gerar código
 */
export async function generateCodeFromImage(request: VisualCodeRequest): Promise<VisualCodeResult> {
  console.log(`[VisualCodeAgent] 🖼️ Gerando código a partir de imagem...`);
  
  // Verificar se o modelo suporta visão (LLaVA, GPT-4 Vision, etc.)
  // Por enquanto, usar descrição de texto se disponível
  const prompt = request.description || "Extract code from this image and generate the equivalent code.";
  
  try {
    // Tentar usar modelo com visão se disponível
    const visionModels = ['llava', 'llava:13b', 'llava:7b', 'gpt-4-vision'];
    let model = DEFAULT_MODEL;
    
    // Verificar se há modelo de visão disponível
    for (const visionModel of visionModels) {
      try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (response.ok) {
          const data = await response.json();
          const models = data.models || [];
          if (models.some((m: any) => m.name.includes(visionModel))) {
            model = visionModel;
            break;
          }
        }
      } catch (error) {
        // Continuar
      }
    }
    
    // Se não há modelo de visão, usar descrição de texto
    if (!visionModels.some(vm => model.includes(vm))) {
      console.log(`[VisualCodeAgent] ⚠️ Nenhum modelo de visão disponível, usando descrição de texto`);
      
      if (!request.description) {
        throw new Error("No description provided and no vision model available");
      }
      
      // Usar Code Router para gerar código baseado na descrição
      const { generateCode, estimateCodeComplexity } = await import("./code_router");
      const language = request.language || 'python';
      const complexity = estimateCodeComplexity(request.description);
      
      const codeResult = await generateCode({
        description: request.description,
        language,
        context: request.context,
        complexity,
      });
      
      return {
        code: codeResult.code,
        language: codeResult.language,
        confidence: 0.7,
        extractedElements: [],
        suggestions: ["Code generated from text description (no vision model available)"],
      };
    }
    
    // Usar modelo de visão
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
            images: [request.imageUrl], // Base64 ou URL
          }
        ],
        options: {
          temperature: 0.3,
          num_predict: 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const codeText = data.message?.content || "";
    
    // Extrair código da resposta
    const codeMatch = codeText.match(/```[\s\S]*?```/);
    const code = codeMatch ? codeMatch[0].replace(/```\w*\n?/g, '').replace(/```/g, '').trim() : codeText.trim();
    
    // Detectar linguagem
    const languageMatch = codeText.match(/```(\w+)/);
    const language = languageMatch ? languageMatch[1] : (request.language || 'python');
    
    return {
      code,
      language,
      confidence: 0.8,
      extractedElements: [],
      suggestions: ["Code extracted from image"],
    };
  } catch (error: any) {
    console.error(`[VisualCodeAgent] ❌ Erro ao gerar código a partir de imagem:`, error);
    throw error;
  }
}

/**
 * Analisar interface e gerar código
 */
export async function analyzeInterfaceAndGenerateCode(
  imageUrl: string,
  description: string,
  language: string = 'html'
): Promise<VisualCodeResult> {
  console.log(`[VisualCodeAgent] 🎨 Analisando interface e gerando código...`);
  
  const prompt = `Analyze this UI/interface image and generate ${language} code to recreate it.

Description: ${description}

Requirements:
- Generate complete, working code
- Match the visual design
- Include all interactive elements
- Use modern best practices
- Make it responsive if applicable

Return the code in a code block.`;

  return generateCodeFromImage({
    imageUrl,
    language,
    description: prompt,
  });
}

/**
 * Extrair código de screenshot
 */
export async function extractCodeFromScreenshot(
  imageUrl: string,
  language?: string
): Promise<VisualCodeResult> {
  console.log(`[VisualCodeAgent] 📸 Extraindo código de screenshot...`);
  
  const prompt = `Extract all code visible in this screenshot. 
  
If code blocks are visible, extract them exactly as shown.
If it's a code editor, extract the code being edited.
If it's documentation, extract code examples.

Return the extracted code in the appropriate language.`;

  return generateCodeFromImage({
    imageUrl,
    language,
    description: prompt,
  });
}

export { VisualCodeRequest, VisualCodeResult };

