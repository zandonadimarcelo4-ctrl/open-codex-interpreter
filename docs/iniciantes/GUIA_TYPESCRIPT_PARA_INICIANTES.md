# 🎯 Guia TypeScript para Iniciantes - Comparação com Python

## 📚 Você sabe Python básico? Perfeito!

Se você entende Python básico (variáveis, if/else, loops, funções, dicionários), você consegue entender TypeScript! 🎉

**TypeScript é JavaScript com tipos** - e JavaScript é muito parecido com Python em muitos aspectos.

---

## 🔄 TypeScript vs Python - Comparação Rápida

### 1. Variáveis

#### Python:
```python
nome = "Marcelo"
idade = 20
altura = 1.75
tem_convite = True
```

#### TypeScript:
```typescript
let nome: string = "Marcelo";      // Tipo: string (texto)
let idade: number = 20;             // Tipo: number (número)
let altura: number = 1.75;          // Tipo: number (número decimal)
let tem_convite: boolean = true;    // Tipo: boolean (verdadeiro/falso)
```

**Diferenças:**
- Python: `nome = "Marcelo"` (sem tipo)
- TypeScript: `let nome: string = "Marcelo"` (com tipo)
- `let` = variável que pode mudar (como `nome = "João"` em Python)
- `const` = constante que não muda (como `PI = 3.14` em Python)

---

### 2. Condicionais (if/else)

#### Python:
```python
idade = 18
if idade >= 18:
    print("Maior de idade")
else:
    print("Menor de idade")
```

#### TypeScript:
```typescript
let idade: number = 18;
if (idade >= 18) {
    console.log("Maior de idade");
} else {
    console.log("Menor de idade");
}
```

**Diferenças:**
- Python: `if idade >= 18:` (sem parênteses)
- TypeScript: `if (idade >= 18) {` (com parênteses e chaves)
- Python: `print()` → TypeScript: `console.log()`
- Python: indentação → TypeScript: chaves `{}`

---

### 3. Loops (for)

#### Python:
```python
for i in range(5):
    print(i)
```

#### TypeScript:
```typescript
for (let i = 0; i < 5; i++) {
    console.log(i);
}
```

**Diferenças:**
- Python: `for i in range(5):` (mais simples)
- TypeScript: `for (let i = 0; i < 5; i++)` (mais explícito)
- `i++` = `i = i + 1` (incrementa i)

---

### 4. Listas/Arrays

#### Python:
```python
nomes = ["Ana", "João", "Marcelo"]
print(nomes[0])  # Ana
```

#### TypeScript:
```typescript
let nomes: string[] = ["Ana", "João", "Marcelo"];
console.log(nomes[0]);  // Ana
```

**Diferenças:**
- Python: `nomes = [...]` (lista)
- TypeScript: `let nomes: string[] = [...]` (array de strings)
- Python: `# comentário` → TypeScript: `// comentário`

---

### 5. Dicionários/Objetos

#### Python:
```python
pessoa = {"nome": "Marcelo", "idade": 20}
print(pessoa["nome"])
```

#### TypeScript:
```typescript
let pessoa: {nome: string, idade: number} = {
    nome: "Marcelo",
    idade: 20
};
console.log(pessoa.nome);  // ou pessoa["nome"]
```

**Diferenças:**
- Python: `pessoa["nome"]` (sempre colchetes)
- TypeScript: `pessoa.nome` (ponto) ou `pessoa["nome"]` (colchetes)
- TypeScript: define tipos `{nome: string, idade: number}`

---

### 6. Funções

#### Python:
```python
def somar(a, b):
    return a + b

resultado = somar(3, 5)
print(resultado)
```

#### TypeScript:
```typescript
function somar(a: number, b: number): number {
    return a + b;
}

let resultado: number = somar(3, 5);
console.log(resultado);
```

**Diferenças:**
- Python: `def somar(a, b):` (sem tipos)
- TypeScript: `function somar(a: number, b: number): number` (com tipos)
- `: number` após `)` = tipo de retorno

---

### 7. Funções Assíncronas (async/await)

#### Python:
```python
import asyncio

async def buscar_dados():
    await asyncio.sleep(1)  # Espera 1 segundo
    return "Dados carregados"

# Usar
resultado = await buscar_dados()
```

#### TypeScript:
```typescript
async function buscarDados(): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000));  // Espera 1 segundo
    return "Dados carregados";
}

// Usar
let resultado: string = await buscarDados();
```

**Diferenças:**
- Python: `async def buscar_dados():` → TypeScript: `async function buscarDados():`
- Python: `await asyncio.sleep(1)` → TypeScript: `await new Promise(...)`
- TypeScript: `Promise<string>` = promessa que retorna string

---

## 🎯 Conceitos Importantes do TypeScript

### 1. Tipos Básicos

```typescript
let nome: string = "Marcelo";        // Texto
let idade: number = 20;              // Número
let ativo: boolean = true;           // Verdadeiro/Falso
let lista: string[] = ["a", "b"];    // Array de strings
let objeto: {nome: string} = {nome: "Marcelo"};  // Objeto
```

### 2. Tipos Opcionais

```typescript
// Python: idade = None
let idade: number | undefined = undefined;  // Pode ser number ou undefined
let idade?: number;  // Forma curta (mesma coisa)
```

### 3. Tipos de Função

```typescript
// Python: def somar(a, b): return a + b
function somar(a: number, b: number): number {
    return a + b;
}

// Função como variável
let somar2: (a: number, b: number) => number = (a, b) => a + b;
```

### 4. Interfaces (Estruturas de Dados)

```typescript
// Python: class Pessoa: def __init__(self, nome, idade): ...
interface Pessoa {
    nome: string;
    idade: number;
    email?: string;  // Opcional
}

let pessoa: Pessoa = {
    nome: "Marcelo",
    idade: 20
};
```

### 5. Classes

```typescript
// Python: class Pessoa: ...
class Pessoa {
    nome: string;
    idade: number;
    
    constructor(nome: string, idade: number) {
        this.nome = nome;
        this.idade = idade;
    }
    
    apresentar(): string {
        return `Olá, sou ${this.nome}`;
    }
}
```

---

## 📖 Exemplos Práticos do Projeto

### Exemplo 1: Função que Recebe Tarefa e Retorna Resposta

#### Código do Projeto (`autogen.ts`):
```typescript
export async function executeWithAutoGen(
  task: string,
  intent: { type: string; actionType?: string; confidence: number; reason?: string },
  context?: Record<string, any>
): Promise<string> {
  // ... código ...
  return "Resposta";
}
```

#### Tradução para Python:
```python
async def execute_with_autogen(
    task: str,
    intent: dict,  # {"type": str, "actionType": str, "confidence": float, "reason": str}
    context: dict = None  # Opcional
) -> str:
    # ... código ...
    return "Resposta"
```

**Explicação:**
- `export async function` = função assíncrona exportada (pode ser usada em outros arquivos)
- `task: string` = parâmetro `task` do tipo string
- `intent: { type: string; ... }` = parâmetro `intent` é um objeto com `type` (string), etc.
- `context?: Record<string, any>` = parâmetro `context` opcional, é um dicionário
- `Promise<string>` = retorna uma promessa (async) que resolve em string

---

### Exemplo 2: Verificar se AutoGen está Disponível

#### Código do Projeto (`autogen_v2_bridge.ts`):
```typescript
export async function checkAutoGenV2Available(): Promise<boolean> {
  try {
    return await initializeAutoGenV2();
  } catch {
    return false;
  }
}
```

#### Tradução para Python:
```python
async def check_autogen_v2_available() -> bool:
    try:
        return await initialize_autogen_v2()
    except:
        return False
```

**Explicação:**
- `export async function` = função assíncrona exportada
- `checkAutoGenV2Available(): Promise<boolean>` = retorna uma promessa que resolve em boolean
- `try { ... } catch { ... }` = tenta executar, se der erro retorna `false`

---

### Exemplo 3: Executar Tarefa com AutoGen v2

#### Código do Projeto (`autogen_v2_bridge.ts`):
```typescript
export async function executeWithAutoGenV2(
  request: AutoGenV2TaskRequest
): Promise<AutoGenV2TaskResponse> {
  return new Promise((resolve, reject) => {
    try {
      // ... código ...
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}
```

#### Tradução para Python:
```python
async def execute_with_autogen_v2(
    request: dict  # AutoGenV2TaskRequest
) -> dict:  # AutoGenV2TaskResponse
    try:
        # ... código ...
        return result
    except Exception as error:
        raise error
```

**Explicação:**
- `new Promise((resolve, reject) => { ... })` = cria uma promessa (async)
- `resolve(result)` = resolve a promessa com `result` (sucesso)
- `reject(error)` = rejeita a promessa com `error` (erro)
- Em Python: `return result` (sucesso) ou `raise error` (erro)

---

### Exemplo 4: Interface (Estrutura de Dados)

#### Código do Projeto (`autogen_v2_bridge.ts`):
```typescript
interface AutoGenV2TaskRequest {
  task: string;
  intent?: { type: string; confidence: number };
  context?: Record<string, any>;
  userId?: string;
  conversationId?: number;
  model?: string;
}
```

#### Tradução para Python:
```python
# Em Python, usamos TypedDict ou dataclass
from typing import TypedDict, Optional, Dict, Any

class AutoGenV2TaskRequest(TypedDict, total=False):
    task: str
    intent: Optional[Dict[str, Any]]  # {"type": str, "confidence": float}
    context: Optional[Dict[str, Any]]
    userId: Optional[str]
    conversationId: Optional[int]
    model: Optional[str]
```

**Explicação:**
- `interface` = define estrutura de dados (como classe em Python)
- `task: string` = campo obrigatório do tipo string
- `intent?: { type: string; ... }` = campo opcional do tipo objeto
- `Record<string, any>` = dicionário com chaves string e valores any

---

### Exemplo 5: Objeto com Métodos

#### Código do Projeto (`autogen.ts`):
```typescript
const framework = {
  initialized: true,
  model: DEFAULT_MODEL,
  ollamaBaseUrl: OLLAMA_BASE_URL,
  pythonModulePath: null,
};

return framework;
```

#### Tradução para Python:
```python
framework = {
    "initialized": True,
    "model": DEFAULT_MODEL,
    "ollama_base_url": OLLAMA_BASE_URL,
    "python_module_path": None
}

return framework
```

**Explicação:**
- TypeScript: `{ chave: valor }` = objeto (como dicionário em Python)
- Python: `{ "chave": valor }` = dicionário
- `null` em TypeScript = `None` em Python

---

## 🔍 Padrões Comuns no Projeto

### 1. Funções Assíncronas (async/await)

```typescript
// Padrão: async function que retorna Promise
export async function fazerAlgo(): Promise<string> {
    const resultado = await outraFuncao();
    return resultado;
}
```

**Python equivalente:**
```python
async def fazer_algo() -> str:
    resultado = await outra_funcao()
    return resultado
```

### 2. Try/Catch (Tratamento de Erros)

```typescript
// Padrão: try/catch para tratar erros
try {
    const resultado = await fazerAlgo();
    return resultado;
} catch (error) {
    console.error("Erro:", error);
    throw error;
}
```

**Python equivalente:**
```python
try:
    resultado = await fazer_algo()
    return resultado
except Exception as error:
    print(f"Erro: {error}")
    raise error
```

### 3. Condicionais com Opcionais

```typescript
// Padrão: verificar se existe antes de usar
if (context?.userId) {
    console.log("User ID:", context.userId);
}
```

**Python equivalente:**
```python
if context and context.get("userId"):
    print("User ID:", context["userId"])
```

### 4. Arrays e Loops

```typescript
// Padrão: percorrer array
const nomes = ["Ana", "João", "Marcelo"];
for (const nome of nomes) {
    console.log(nome);
}
```

**Python equivalente:**
```python
nomes = ["Ana", "João", "Marcelo"]
for nome in nomes:
    print(nome)
```

### 5. Objetos e Acesso a Propriedades

```typescript
// Padrão: acessar propriedades de objeto
const pessoa = { nome: "Marcelo", idade: 20 };
console.log(pessoa.nome);  // ou pessoa["nome"]
```

**Python equivalente:**
```python
pessoa = {"nome": "Marcelo", "idade": 20}
print(pessoa["nome"])  # ou pessoa.get("nome")
```

---

## 🎯 Arquivos Principais do Projeto (TypeScript)

### 1. `autogen.ts` - Lógica Principal

**O que faz:** Decide se é conversa ou ação, e delega para Python ou Ollama.

**Conceitos principais:**
- `async function` = função assíncrona
- `Promise<string>` = retorna promessa que resolve em string
- `if (intent.type === "action")` = condicional
- `await executeWithAutoGenV2(...)` = espera resultado assíncrono

### 2. `autogen_v2_bridge.ts` - Ponte para Python

**O que faz:** Chama processo Python que executa AutoGen.

**Conceitos principais:**
- `spawn("python", ["-c", script])` = executa processo Python
- `new Promise((resolve, reject) => { ... })` = cria promessa
- `pythonProcess.stdin.write(payload)` = envia dados para Python
- `pythonProcess.stdout.on("data", ...)` = recebe dados de Python

### 3. `websocket.ts` - Comunicação em Tempo Real

**O que faz:** Gerencia comunicação WebSocket (chat em tempo real).

**Conceitos principais:**
- `WebSocket` = conexão em tempo real
- `ws.on("message", ...)` = escuta mensagens
- `ws.send(...)` = envia mensagens

---

## 💡 Dicas para Entender o Código TypeScript

### 1. **Leia de cima para baixo**
- TypeScript é executado de cima para baixo (como Python)

### 2. **Procure por `async` e `await`**
- Funções assíncronas usam `async` e `await` (como Python)

### 3. **Entenda os tipos**
- `: string` = texto
- `: number` = número
- `: boolean` = verdadeiro/falso
- `: Promise<string>` = promessa que retorna string

### 4. **Veja os exemplos práticos**
- Compare com Python que você já conhece
- Use os exemplos acima como referência

### 5. **Não se preocupe com tudo de uma vez**
- Foque em entender uma função por vez
- Use os comentários no código como guia

---

## 🚀 Próximos Passos

1. **Leia o código TypeScript do projeto**
   - Comece por `autogen.ts` (lógica principal)
   - Veja `autogen_v2_bridge.ts` (ponte para Python)
   - Explore `websocket.ts` (comunicação em tempo real)

2. **Compare com Python**
   - Use este guia como referência
   - Traduza mentalmente: TypeScript → Python

3. **Faça pequenas modificações**
   - Mude uma mensagem de log
   - Adicione um comentário
   - Teste se funciona

4. **Aprenda gradualmente**
   - Não precisa entender tudo de uma vez
   - Foque no que é necessário para o projeto

---

## 📚 Recursos Adicionais

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/intro.html
- **JavaScript para Pythonistas**: https://javascript-for-pythonistas.readthedocs.io/
- **Comparação TypeScript vs Python**: Use este guia como referência

---

## 🎯 Resumo Rápido

| Python | TypeScript |
|--------|------------|
| `nome = "Marcelo"` | `let nome: string = "Marcelo"` |
| `def somar(a, b):` | `function somar(a: number, b: number): number` |
| `if idade >= 18:` | `if (idade >= 18) {` |
| `for i in range(5):` | `for (let i = 0; i < 5; i++) {` |
| `pessoa["nome"]` | `pessoa.nome` ou `pessoa["nome"]` |
| `async def buscar():` | `async function buscar(): Promise<string>` |
| `await buscar()` | `await buscar()` |
| `try: ... except:` | `try { ... } catch { ... }` |
| `None` | `null` ou `undefined` |
| `print()` | `console.log()` |

---

**Lembre-se**: TypeScript é JavaScript com tipos, e JavaScript é muito parecido com Python em muitos aspectos. Você já sabe Python básico, então consegue entender TypeScript! 🚀

