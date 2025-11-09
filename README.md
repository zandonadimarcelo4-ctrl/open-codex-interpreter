<h1 align="center">● Open Interpreter</h1>

<p align="center">
    <a href="https://discord.gg/YG7APUyJ5"><img alt="Discord" src="https://img.shields.io/discord/1146610656779440188?logo=discord&style=flat&logoColor=white"></a> <img src="https://img.shields.io/static/v1?label=license&message=MIT&color=white&style=flat" alt="License">
<br>
    <b>Let language models run code on your computer.</b><br>
    An open-source, locally running implementation of OpenAI's Code Interpreter.
</p>

<br>

![poster](https://github.com/KillianLucas/open-interpreter/assets/63927363/08f0d493-956b-4d49-982e-67d4b20c4b56)

<br>

```shell
pip install open-interpreter
```

```shell
interpreter
```

<br>

**Open Interpreter** lets LLMs run code (Python, Javascript, Shell, and more) locally. You can chat with Open Interpreter through a ChatGPT-like interface in your terminal by running `$ interpreter` after installing.

This provides a natural-language interface to your computer's general-purpose capabilities:

- Create and edit photos, videos, PDFs, etc.
- Control a Chrome browser to perform research
- Plot, clean, and analyze large datasets
- ...etc.

**⚠️ Note: You'll be asked to approve code before it's run.**

<br>

## Demo

https://github.com/KillianLucas/open-interpreter/assets/63927363/37152071-680d-4423-9af3-64836a6f7b60

#### An interactive demo is also available on Google Colab:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1WKmRXZgsErej2xUriKzxrEAXdxMSgWbb?usp=sharing)

## Quick Start

```shell
pip install open-interpreter
```

### Unified Dev Agent (Ollama + AutoGen + Open Interpreter)

The repository now bundles a "Unified Dev Agent" that orchestrates DeepSeek-R1 running on [Ollama](https://ollama.ai/), Open Interpreter's execution engine, AutoGen's multi-agent coordination and persistent memory backed by [ChromaDB](https://docs.trychroma.com/).

### Instalação local

O fluxo unificado roda **100% localmente**. Para configurá-lo em um ambiente Python 3.10+ basta seguir os passos abaixo diretamente neste repositório:

```shell
git clone https://github.com/KillianLucas/open-interpreter.git open-interpreter
cd open-interpreter
python -m venv .venv
source .venv/bin/activate  # No Windows use: .venv\Scripts\activate
pip install --upgrade pip

# Instalação base (somente Open Interpreter + CLI cinematográfica)
pip install -e .

# Para habilitar o fluxo com AutoGen execute UMA das linhas abaixo:
# pip install -e .[autogen]
# poetry install --extras "autogen"

# Dependências opcionais para as integrações (rodam localmente)
git clone https://github.com/VolksRat71/after-effects-mcp-vision.git integrations/after-effects-mcp-vision
git clone https://github.com/microsoft/autogen.git integrations/autogen
git clone https://github.com/microsoft/UFO.git integrations/ufo
```

Com o ambiente criado, garanta que o [Ollama](https://ollama.ai/download) esteja ativo localmente com o modelo `deepseek-r1` disponível. Em seguida execute o agente unificado utilizando o modo local do Open Interpreter:

```shell
unified-agent --after-effects integrations/after-effects-mcp-vision \
              --ufo-workspace integrations/ufo
```

Forneça uma meta em linguagem natural, como *"Crie uma API Flask com rotas /add, /list e /delete"*. O agente irá planejar com o AutoGen (usando o servidor Ollama local), gerar código com o DeepSeek-R1, executar e validar o resultado via Open Interpreter local (`interpreter --local`) e registrar o contexto no ChromaDB para iterações futuras. As integrações do [After-Effects MCP Vision toolkit](https://github.com/VolksRat71/after-effects-mcp-vision) e do [Microsoft UFO](https://github.com/microsoft/UFO) mantêm o agente consciente dos ativos criativos e do estado do IDE.

#### Recursos avançados do Unified Dev Agent

O *Unified Dev Agent* agora inclui uma série de capacidades inéditas pensadas para projetos ambiciosos:

- **Auto-Context Memory** (ChromaDB): registra histórico, decisões e execuções, e permite recuperar contexto com `AutoContextMemory.recall()`.
- **Observe & Automate Mode**: usando `pyautogui` + `pynput`, o agente observa suas interações no desktop e registra ações que podem virar automações.
- **Agente Multimodal (voz + visão)**: captura screenshots, executa OCR com `pytesseract` e aceita comandos de voz via `speech_recognition`.
- **Auto-Fork / Self-Update**: clona automaticamente projetos estratégicos (After Effects MCP Vision, AutoGen, UFO, ChatDev, agenticSeek, browser-use) usando `AutoForkManager` para estudos, melhorias e PRs.
- **Plugin Layer**: qualquer pessoa pode publicar novas "skills" registrando-as no namespace `dev_framework.plugins`.
- **Auto-Explanation Mode**: sempre que gerar ou revisar código, o agente registra o raciocínio em memória para auditoria.
- **Sistema de Recompensas ChatDev**: cada execução recebe pontuação positiva ou negativa, visível via `ChatDevRewardSystem.leaderboard()`.
- **Planejamento com agenticSeek**: detecção de intenção identifica quando o usuário quer planos (`IntentionDetector`) e delega para o `AgenticSeekPlanner`.
- **Pesquisa na Web (browser-use)**: prompts contendo "pesquise" ou "search" disparam buscas automáticas registradas na memória.
- **Modo consciente**: memória persistente mantém o agente atualizado sobre edições em projetos After Effects, UFO e demais subsistemas.

As dependências opcionais necessárias para os recursos multimodais e de observação podem ser instaladas com:

```shell
pip install pyautogui pynput pillow pytesseract speechrecognition sounddevice numpy browser-use
```

Instale `pytesseract` localmente conforme a documentação oficial para habilitar OCR. Para experimentar os recursos de planejamento, execute `unified-agent` normalmente e utilize prompts como "Planeje um roadmap de lançamento" ou prefixe uma habilidade com `plugin:minha_skill argumento` para invocar plugins.

### Qual script usar?

Depois de preparar o ambiente, escolha o fluxo desejado:

| Comando | Quando usar | O que acontece |
| --- | --- | --- |
| `interpreter` | Somente o Open Interpreter clássico | Abre o chat local padrão sem AutoGen ou memória estendida. |
| `unified-agent` | Fluxo completo com AutoGen, memória, observação e integrações | Executa `dev_framework/__main__.py`, que valida a instalação do `pyautogen`, carrega o **UnifiedDevAgent** (definido em `dev_framework/main.py`) e inicia o terminal cinematográfico com suporte a planejamento, execução local e memória ChromaDB. |
| `unified-agent <prompt>` | Rodada única automatizada | Pula o modo interativo e executa imediatamente o prompt informado com AutoGen + Ollama. |
| `unified-agent-web` | Interface web estilo "nível Apple" | Inicia o servidor FastAPI definido em `webui/app.py`, com UI paralaxe e timeline animada. |

Caso o extra `autogen` não esteja instalado, o comando `unified-agent` exibirá uma mensagem informando como habilitar o suporte (`pip install -e .[autogen]`).

> 💡 **Rodando sem instalar o pacote:** se você apenas clonou o repositório, execute `python -m unified_agent` (repare no sublinhado) a partir da raiz do projeto para obter o mesmo comportamento do comando `unified-agent`.

#### Perfis e configuração declarativa

O orquestrador agora oferece perfis prontos e carregamento de arquivos de configuração para que você ajuste o comportamento sem editar código:

- `unified-agent --list-profiles` lista os perfis internos com uma descrição resumida.
- `--profile innovation` ativa todos os recursos multimodais e de automação sem exigir flags extras.
- `--profile minimal` desliga observação, multimodalidade e auto-fork para rodar de forma enxuta.
- `--config settings.json` aplica overrides vindos de um arquivo JSON/TOML/YAML (exige `pyyaml` para YAML).

Exemplo de arquivo `settings.json` carregado com `--config`:

```json
{
  "ollama_model": "deepseek-r1:14b",
  "enable_auto_execution": false,
  "plugin_auto_discover": false,
  "auto_fork_repos": [
    "https://github.com/seu-usuario/projeto-experimental.git"
  ]
}
```

Essas opções são combináveis — por exemplo, rode `unified-agent --profile innovation --config settings.json` para começar do preset completo e aplicar ajustes locais. Todas as chaves válidas estão documentadas no arquivo `dev_framework/configuration.py` e podem ser fornecidas no arquivo de configuração ou diretamente via CLI.

### Perfis de dependência compatíveis

O `open-interpreter` agora depende exclusivamente do shim LiteLLM incluído no repositório, eliminando qualquer requisito direto do pacote `openai` e privilegiando provedores locais como o Ollama.

Para adicionar recursos multiagente, basta instalar o extra `autogen` quando quiser experimentar o fluxo completo com AutoGen:

| Caso de uso | Comando sugerido | Observações |
| --- | --- | --- |
| **Somente Open Interpreter** | `pip install -e .` | Mantém o comportamento original com LiteLLM. |
| **Fluxo multiagente com AutoGen** | `pip install -e .[autogen]` <br>ou `poetry install --extras "autogen"` | Adiciona `pyautogen` e as dependências transitivas exigidas por ele. |

Todos os módulos do `dev_framework` verificam automaticamente se o pacote `autogen` está disponível e exibem uma mensagem guiando a instalação do extra quando necessário. Assim você pode alternar entre os dois perfis sem editar manualmente o `pyproject.toml` ou instalar bibliotecas que não pretende usar.

### CLI cinematográfica

Execute o agente com `unified-agent` e descubra a nova interface inspirada em terminais futuristas. Ela utiliza [Rich](https://github.com/Textualize/rich) para apresentar um cabeçalho animado, linha do tempo viva e cartões coloridos com planos, resultados de pesquisa, execuções e notificações. Toda interação fica registrada na sessão, oferecendo uma visualização elegante dos passos do agente.

```shell
unified-agent
```

Use `Ctrl+C` para encerrar — um painel de despedida confirma o término das automações.

### Unified Dev Agent Studio (frontend web)

Para uma experiência realmente "nível Apple", o projeto adiciona um estúdio web com paralaxe, vidro fosco e microinterações. Inicie o servidor FastAPI localmente com:

```shell
unified-agent-web
```

Depois acesse <http://127.0.0.1:8000>. O painel oferece:

- Hero com camadas paralaxe animadas e CTA.
- Console inteligente para enviar prompts e acompanhar resultados em cards de vidro.
- Linha do tempo interativa que destaca planos, notificações, pesquisas e execuções.
- Sessão "Camadas de experiência" com animações suaves, globos luminosos e cards explicativos.

O frontend consome a API `/api/run`, entrega o resultado em painéis animados e registra cada missão no timeline sem recarregar a página.

### Terminal

After installation, simply run `interpreter`:

```shell
interpreter
```

### Python

```python
import interpreter

interpreter.chat("Plot APPL and META's normalized stock prices") # Executes a single command
interpreter.chat() # Starts an interactive chat
```

## Comparison to ChatGPT's Code Interpreter

OpenAI's release of [Code Interpreter](https://openai.com/blog/chatgpt-plugins#code-interpreter) with GPT-4 presents a fantastic opportunity to accomplish real-world tasks with ChatGPT.

However, OpenAI's service is hosted, closed-source, and heavily restricted:
- No internet access.
- [Limited set  of pre-installed packages](https://wfhbrian.com/mastering-chatgpts-code-interpreter-list-of-python-packages/).
- 100 MB maximum upload, 120.0 second runtime limit.
- State is cleared (along with any generated files or links) when the environment dies.

---

Open Interpreter overcomes these limitations by running on your local environment. It has full access to the internet, isn't restricted by time or file size, and can utilize any package or library.

This combines the power of GPT-4's Code Interpreter with the flexibility of your local development environment.

## Commands

#### Interactive Chat

To start an interactive chat in your terminal, either run `interpreter` from the command line:

```shell
interpreter
```

Or `interpreter.chat()` from a .py file:

```python
interpreter.chat()
```

#### Programmatic Chat

For more precise control, you can pass messages directly to `.chat(message)`:

```python
interpreter.chat("Add subtitles to all videos in /videos.")

# ... Streams output to your terminal, completes task ...

interpreter.chat("These look great but can you make the subtitles bigger?")

# ...
```

#### Start a New Chat

In Python, Open Interpreter remembers conversation history. If you want to start fresh, you can reset it:

```python
interpreter.reset()
```

#### Save and Restore Chats

`interpreter.chat()` returns a List of messages when return_messages=True, which can be used to resume a conversation with `interpreter.load(messages)`:

```python
messages = interpreter.chat("My name is Killian.", return_messages=True) # Save messages to 'messages'
interpreter.reset() # Reset interpreter ("Killian" will be forgotten)

interpreter.load(messages) # Resume chat from 'messages' ("Killian" will be remembered)
```

#### Customize System Message

You can inspect and configure Open Interpreter's system message to extend its functionality, modify permissions, or give it more context.

```python
interpreter.system_message += """
Run shell commands with -y so the user doesn't have to confirm them.
"""
print(interpreter.system_message)
```

#### Change the Model

You can run `interpreter` in local mode from the command line to use `Code Llama`:

```shell
interpreter --local
```

For `gpt-3.5-turbo`, use fast mode:

```shell
interpreter --fast
```

Or, in Python, set the model manually:

```python
interpreter.model = "gpt-3.5-turbo"
```

## Safety Notice

Since generated code is executed in your local environment, it can interact with your files and system settings, potentially leading to unexpected outcomes like data loss or security risks.

**⚠️ Open Interpreter will ask for user confirmation before executing code.**

You can run `interpreter -y` or set `interpreter.auto_run = True` to bypass this confirmation, in which case:

- Be cautious when requesting commands that modify files or system settings.
- Watch Open Interpreter like a self-driving car, and be prepared to end the process by closing your terminal.
- Consider running Open Interpreter in a restricted environment like Google Colab or Replit. These environments are more isolated, reducing the risks associated with executing arbitrary code.

## How Does it Work?

Open Interpreter equips a [function-calling language model](https://platform.openai.com/docs/guides/gpt/function-calling) with an `exec()` function, which accepts a `language` (like "python" or "javascript") and `code` to run.

We then stream the model's messages, code, and your system's outputs to the terminal as Markdown.

## Contributing

This is a community-made project. If it looks exciting to you, please don't hesitate to contribute!

## License

Open Interpreter is licensed under the MIT License. You are permitted to use, copy, modify, distribute, sublicense and sell copies of the software.

**Note**: This software is not affiliated with OpenAI.

<br>

> Having access to a junior programmer working at the speed of your fingertips ... can make new workflows effortless and efficient, as well as open the benefits of programming to new audiences.
>
> — _OpenAI's Code Interpreter Release_

<br>

_Looking for the desktop application? [Sign up for early access.](https://openinterpreter.com)_
