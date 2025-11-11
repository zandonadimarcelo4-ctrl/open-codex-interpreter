from .cli import cli
from .utils import merge_deltas, parse_partial_json
from .message_block import MessageBlock
from .code_block import CodeBlock
from .code_interpreter import CodeInterpreter
from .llama_2 import get_llama_2_instance

import os
import time
import json
import platform
import getpass
import requests
import readline
import urllib.parse
import tokentrim as tt
from rich import print
from rich.markdown import Markdown
from rich.rule import Rule

# OpenAI é opcional - só importar se necessário
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    openai = None

# Tentar importar adaptador Ollama
try:
    from .ollama_adapter import OllamaAdapter
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    OllamaAdapter = None

# Function schema for gpt-4
function_schema = {
  "name": "run_code",
  "description":
  "Executes code on the user's machine and returns the output",
  "parameters": {
    "type": "object",
    "properties": {
      "language": {
        "type": "string",
        "description":
        "The programming language",
        "enum": ["python", "shell", "applescript", "javascript", "html"]
      },
      "code": {
        "type": "string",
        "description": "The code to execute"
      }
    },
    "required": ["language", "code"]
  },
}

# Message for when users don't have an OpenAI API key.
missing_api_key_message = """> OpenAI API key not found

To use `GPT-4` (recommended) please provide an OpenAI API key.

To use `Code-Llama` (free but less capable) press `enter`.
"""

confirm_mode_message = """
**Open Interpreter** will require approval before running code. Use `interpreter -y` to bypass this.

Press `CTRL-C` to exit.
"""


class Interpreter:

  def __init__(self, auto_run=False, local=False, model=None, debug_mode=False, use_ollama=None):
    """
    Inicializa o Interpreter.
    
    Args:
      auto_run (bool): Se True, executa código automaticamente sem pedir confirmação (equivalente a -y)
      local (bool): Se True, usa Code-Llama local (equivalente a --local). Se False e use_ollama=True, usa Ollama
      model (str): Nome do modelo a usar (padrão: gpt-4 ou modelo do Ollama)
      debug_mode (bool): Se True, imprime informações de debug
      use_ollama (bool): Se True, força uso de Ollama. Se None, detecta automaticamente
    """
    self.messages = []
    self.temperature = 0.001
    self.api_key = None
    self.auto_run = auto_run  # Parâmetro -y (auto_run)
    self.local = local  # Parâmetro --local (Code-Llama)
    self.model = model or "gpt-4"
    self.debug_mode = debug_mode
    self.use_ollama = False  # Flag para usar Ollama
    self.ollama_adapter = None  # Adaptador Ollama

    # Get default system message
    here = os.path.abspath(os.path.dirname(__file__))
    with open(os.path.join(here, 'system_message.txt'), 'r') as f:
      self.system_message = f.read().strip()

    # Store Code Interpreter instances for each language
    self.code_interpreters = {}

    # No active block to start
    # (blocks are visual representation of messages on the terminal)
    self.active_block = None

    # Note: While Open Interpreter can use Llama, we will prioritize gpt-4.
    # gpt-4 is faster, smarter, can call functions, and is all-around easier to use.
    # This makes gpt-4 better aligned with Open Interpreters priority to be easy to use.
    self.llama_instance = None
    
    # Configurar uso de Ollama
    # Se local=True, SEMPRE usar Ollama via adaptador (não Code-Llama)
    # Se use_ollama foi especificado explicitamente, usar esse valor
    # Se não, detectar automaticamente: usar Ollama se não há OPENAI_API_KEY e Ollama está disponível
    if self.local:
      # Quando local=True, usar Ollama via adaptador (não Code-Llama)
      use_ollama = True
      # Se não foi especificado um modelo, usar o padrão do ambiente
      if not self.model or self.model == "gpt-4" or self.model == "code-llama":
        self.model = os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
    elif use_ollama is None:
      # Detecção automática: usar Ollama se não há OPENAI_API_KEY
      use_ollama = not os.getenv("OPENAI_API_KEY") and OLLAMA_AVAILABLE
    
    # Se use_ollama=True, inicializar adaptador Ollama
    if use_ollama and OLLAMA_AVAILABLE:
      try:
        # Se não foi especificado um modelo, usar o padrão do ambiente
        if not self.model or self.model == "gpt-4":
          self.model = os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
        self.ollama_adapter = OllamaAdapter(model=self.model)
        if self.ollama_adapter.verify_connection():
          self.use_ollama = True
          if not self.auto_run:  # Só imprimir se não estiver em modo auto_run
            print(Markdown(f"> Usando Ollama (local) com modelo: `{self.model}`"))
        else:
          raise Exception("Ollama não está disponível ou não conseguiu conectar")
      except Exception as e:
        if self.debug_mode:
          print(Markdown(f"> Erro ao inicializar Ollama: {e}"))
        if self.local:
          # Se local=True e Ollama falhou, levantar erro (não tentar OpenAI)
          raise Exception(f"Erro ao inicializar Ollama em modo local: {e}. Certifique-se de que Ollama está rodando.")
        pass

  def cli(self):
    # The cli takes the current instance of Interpreter,
    # modifies it according to command line flags, then runs chat.
    cli(self)

  def get_info_for_system_message(self):
    """
    Gets relevent information for the system message.
    """

    info = ""

    # Add user info
    username = getpass.getuser()
    current_working_directory = os.getcwd()
    operating_system = platform.system()
    
    info += f"\n\n[User Info]\nName: {username}\nCWD: {current_working_directory}\nOS: {operating_system}"

    if not self.local:

      # Open Procedures is an open-source database of tiny, structured coding tutorials.
      # We can query it semantically and append relevant tutorials/procedures to our system message:

      # Use the last two messages' content or function call to semantically search
      query = []
      for message in self.messages[-2:]:
        message_for_semantic_search = {"role": message["role"]}
        if "content" in message:
          message_for_semantic_search["content"] = message["content"]
        if "function_call" in message and "parsed_arguments" in message["function_call"]:
          message_for_semantic_search["function_call"] = message["function_call"]["parsed_arguments"]
        query.append(message_for_semantic_search)
              
      # Use them to query Open Procedures
      url = "https://open-procedures.replit.app/search/"
      
      try:
        relevant_procedures = requests.get(url, data=json.dumps(query)).json()["procedures"]
        info += "\n\n# Recommended Procedures\n" + "\n---\n".join(relevant_procedures) + "\nIn your plan, include steps and, if present, **EXACT CODE SNIPPETS** (especially for depracation notices, **WRITE THEM INTO YOUR PLAN -- underneath each numbered step** as they will VANISH once you execute your first line of code, so WRITE THEM DOWN NOW if you need them) from the above procedures if they are relevant to the task. Again, include **VERBATIM CODE SNIPPETS** from the procedures above if they are relevent to the task **directly in your plan.**"
      except:
        # For someone, this failed for a super secure SSL reason.
        # Since it's not stricly necessary, let's worry about that another day. Should probably log this somehow though.
        pass

    elif self.local:

      # Tell Code-Llama how to run code.
      info += "\n\nTo run code, simply write a fenced code block (i.e ```python or ```shell) in markdown. When you close it with ```, it will be run. You'll then be given its output."
      # We make references in system_message.txt to the "function" it can call, "run_code".
      # But functions are not supported by Code-Llama, so:
      info = info.replace("run_code", "a markdown code block")

    return info

  def reset(self):
    self.messages = []
    self.code_interpreters = {}

  def load(self, messages):
    self.messages = messages

  def chat(self, message=None, return_messages=False):

    # Connect to an LLM (an large language model)
    # Se local=True, usar Ollama (já configurado no __init__)
    # Se não usar Ollama e não for local, tentar OpenAI
    if not self.use_ollama and not self.local:
      # gpt-4 (só se OpenAI estiver disponível)
      if OPENAI_AVAILABLE:
        self.verify_api_key()
      else:
        # Se OpenAI não está disponível, tentar usar Ollama
        if OLLAMA_AVAILABLE:
          try:
            self.model = os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
            self.ollama_adapter = OllamaAdapter(model=self.model)
            if self.ollama_adapter.verify_connection():
              self.use_ollama = True
              if not self.auto_run:
                print(Markdown(f"> OpenAI não disponível. Usando Ollama com modelo: `{self.model}`"))
            else:
              raise Exception("Ollama não está disponível")
          except Exception as e:
            raise Exception(f"OpenAI não está disponível e Ollama falhou: {e}")
        else:
          raise Exception("OpenAI não está disponível e Ollama não está instalado. Instale: pip install openai ou pip install ollama")

    # Display welcome message
    welcome_message = ""
    
    if self.debug_mode:
      welcome_message += "> Entered debug mode"

    # If self.local or self.use_ollama, we actually don't use self.model the same way
    # (self.auto_run is like advanced usage, we display no messages)
    if self.use_ollama and not self.auto_run:
      if self.local:
        welcome_message += f"\n> Model set to `{self.model}` (Ollama - Local Mode)\n\n**Tip:** Using Ollama via adapter for local execution"
      else:
        welcome_message += f"\n> Model set to `{self.model}` (Ollama)\n\n**Tip:** To use OpenAI, set `OPENAI_API_KEY` environment variable"
    elif not self.local and not self.use_ollama and not self.auto_run and OPENAI_AVAILABLE:
      welcome_message += f"\n> Model set to `{self.model.upper()}`\n\n**Tip:** To run locally with Ollama, use `interpreter --local`"
    
    # If not auto_run, tell the user we'll ask permission to run code
    # We also tell them here how to exit Open Interpreter
    if not self.auto_run:
      welcome_message += "\n\n" + confirm_mode_message

    welcome_message = welcome_message.strip()
      
    # Print welcome message with newlines on either side (aesthetic choice)
    # unless we're starting with a blockquote (aesthetic choice)
    if welcome_message != "":
      if welcome_message.startswith(">"):
        print(Markdown(welcome_message), '')
      else:
        print('', Markdown(welcome_message), '')

    # Check if `message` was passed in by user
    if message:
      # If it was, we respond non-interactivley
      self.messages.append({"role": "user", "content": message})
      self.respond()
      
    else:
      # If it wasn't, we start an interactive chat
      while True:
        try:
          user_input = input("> ").strip()
        except EOFError:
          break
        except KeyboardInterrupt:
          print()  # Aesthetic choice
          break
  
        # Use `readline` to let users up-arrow to previous user messages,
        # which is a common behavior in terminals.
        readline.add_history(user_input)
  
        # Add the user message to self.messages
        self.messages.append({"role": "user", "content": user_input})

        # Let the user turn on debug mode mid-chat
        if user_input == "%debug":
            print('', Markdown("> Entered debug mode"), '')
            print(self.messages)
            self.debug_mode = True
            continue
  
        # Respond, but gracefully handle CTRL-C / KeyboardInterrupt
        try:
          self.respond()
        except KeyboardInterrupt:
          pass
        finally:
          # Always end the active block. Multiple Live displays = issues
          self.end_active_block()

    if return_messages:
        return self.messages

  def verify_api_key(self):
    """
    Makes sure we have an OPENAI_API_KEY (só se OpenAI estiver disponível).
    """
    if not OPENAI_AVAILABLE:
      raise Exception("OpenAI não está disponível. Use Ollama com --local ou instale: pip install openai")

    if self.api_key == None:

      if 'OPENAI_API_KEY' in os.environ:
        self.api_key = os.environ['OPENAI_API_KEY']
      else:
        # This is probably their first time here!
        print('', Markdown("**Welcome to Open Interpreter.**"), '')
        time.sleep(1)

        print(Rule(style="white"))

        print(Markdown(missing_api_key_message), '', Rule(style="white"), '')
        response = input("OpenAI API key: ")
    
        if response == "":
            # User pressed `enter`, usar Ollama (local)
            self.local = True
            self.use_ollama = True
            # Reconfigurar Ollama
            try:
              self.model = os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
              self.ollama_adapter = OllamaAdapter(model=self.model)
              if self.ollama_adapter.verify_connection():
                if not self.auto_run:
                  print(Markdown("> Switching to Ollama (local mode)...\n\n**Tip:** Run `interpreter --local` to automatically use Ollama."), '')
                  time.sleep(2)
                  print(Rule(style="white"))
                return
              else:
                raise Exception("Ollama não está disponível")
            except Exception as e:
              raise Exception(f"Erro ao inicializar Ollama: {e}. Certifique-se de que Ollama está rodando.")
          
        else:
            self.api_key = response
            print('', Markdown("**Tip:** To save this key for later, run `export OPENAI_API_KEY=your_api_key` on Mac/Linux or `setx OPENAI_API_KEY your_api_key` on Windows."), '')
            time.sleep(2)
            print(Rule(style="white"))
            
    if openai:
      openai.api_key = self.api_key

  def end_active_block(self):
    if self.active_block:
      self.active_block.end()
      self.active_block = None

  def respond(self):
    # Add relevant info to system_message
    # (e.g. current working directory, username, os, etc.)
    info = self.get_info_for_system_message()
    system_message = self.system_message + "\n\n" + info

    messages = tt.trim(self.messages, self.model, system_message=system_message)
    
    if self.debug_mode:
      print("\n", "Sending `messages` to LLM:", "\n")
      print(messages)
      print()

    # Make LLM call
    if self.use_ollama and self.ollama_adapter:
      # Ollama (via adaptador)
      # Ollama não suporta streaming nativo da mesma forma, então vamos fazer uma chamada única
      try:
        response_data = self.ollama_adapter.chat_completion(
          messages=messages,
          functions=[function_schema],
          temperature=self.temperature,
        )
        # Simular streaming convertendo resposta única em chunks
        response = self._ollama_response_to_stream(response_data)
      except Exception as e:
        # Se Ollama falhar e estamos em modo local, levantar erro
        if self.local:
          raise Exception(f"Erro ao usar Ollama em modo local: {e}. Certifique-se de que Ollama está rodando.")
        # Se não estamos em modo local, tentar OpenAI (se disponível)
        if OPENAI_AVAILABLE:
          print(Markdown(f"> Erro ao usar Ollama: {e}\n> Tentando usar OpenAI..."))
          self.use_ollama = False
          if not self.api_key:
            self.verify_api_key()
          if openai:
            response = openai.ChatCompletion.create(
              model=self.model,
              messages=messages,
              functions=[function_schema],
              stream=True,
              temperature=self.temperature,
            )
          else:
            raise Exception(f"OpenAI não está disponível e Ollama falhou: {e}")
        else:
          raise Exception(f"Ollama falhou e OpenAI não está disponível: {e}")
    elif not self.local and not self.use_ollama:
      # gpt-4 (só se OpenAI estiver disponível)
      if not OPENAI_AVAILABLE:
        raise Exception("OpenAI não está disponível. Use Ollama com --local ou instale: pip install openai")
      if openai:
        response = openai.ChatCompletion.create(
          model=self.model,
          messages=messages,
          functions=[function_schema],
          stream=True,
          temperature=self.temperature,
        )
      else:
        raise Exception("OpenAI não está disponível")
    elif self.local and not self.use_ollama:
      # Isso não deveria acontecer (local sempre usa Ollama agora), mas manter compatibilidade
      raise Exception("Modo local requer Ollama. Certifique-se de que Ollama está instalado e rodando.")

    # Initialize message, function call trackers, and active block
    self.messages.append({})
    in_function_call = False
    llama_function_call_finished = False
    self.active_block = None

    for chunk in response:

      delta = chunk["choices"][0]["delta"]

      # Accumulate deltas into the last message in messages
      self.messages[-1] = merge_deltas(self.messages[-1], delta)

      # Check if we're in a function call
      if self.use_ollama:
        # Para Ollama, verificar se há function_call ou código em blocos markdown
        condition = "function_call" in self.messages[-1] or (
          "content" in self.messages[-1] and 
          self.messages[-1]["content"].count("```") % 2 == 1
        )
      elif not self.local:
        condition = "function_call" in self.messages[-1]
      elif self.local:
        # Since Code-Llama can't call functions, we just check if we're in a code block.
        # This simply returns true if the number of "```" in the message is odd.
        if "content" in self.messages[-1]:
          condition = self.messages[-1]["content"].count("```") % 2 == 1
        else:
          # If it hasn't made "content" yet, we're certainly not in a function call.
          condition = False

      if condition:
        # We are in a function call.

        # Check if we just entered a function call
        if in_function_call == False:

          # If so, end the last block,
          self.end_active_block()

          # Print newline if it was just a code block or user message
          # (this just looks nice)
          last_role = self.messages[-2]["role"]
          if last_role == "user" or last_role == "function":
            print()

          # then create a new code block
          self.active_block = CodeBlock()

        # Remember we're in a function_call
        in_function_call = True

        # Now let's parse the function's arguments:

        if self.use_ollama:
          # Ollama: tentar parsear function_call ou código de blocos markdown
          if "function_call" in self.messages[-1] and "arguments" in self.messages[-1]["function_call"]:
            # Já temos function_call do adaptador
            arguments = self.messages[-1]["function_call"]["arguments"]
            new_parsed_arguments = parse_partial_json(arguments)
            if new_parsed_arguments:
              self.messages[-1]["function_call"]["parsed_arguments"] = new_parsed_arguments
          elif "content" in self.messages[-1]:
            # Tentar extrair código de blocos markdown
            content = self.messages[-1]["content"]
            code_blocks = content.split("```")
            if len(code_blocks) >= 3:
              language = code_blocks[1].strip().split("\n")[0] or "python"
              code = "\n".join(code_blocks[1].strip().split("\n")[1:]).strip("` \n")
              if code:
                if "function_call" not in self.messages[-1]:
                  self.messages[-1]["function_call"] = {}
                self.messages[-1]["function_call"]["parsed_arguments"] = {
                  "language": language,
                  "code": code
                }
        elif not self.local:
          # gpt-4
          # Parse arguments and save to parsed_arguments, under function_call
          if "arguments" in self.messages[-1]["function_call"]:
            arguments = self.messages[-1]["function_call"]["arguments"]
            new_parsed_arguments = parse_partial_json(arguments)
            if new_parsed_arguments:
              # Only overwrite what we have if it's not None (which means it failed to parse)
              self.messages[-1]["function_call"][
                "parsed_arguments"] = new_parsed_arguments

        elif self.local:
          # Code-Llama
          # Parse current code block and save to parsed_arguments, under function_call
          if "content" in self.messages[-1]:
            current_code_block = self.messages[-1]["content"].split("```")[-1]
            
            language = current_code_block.split("\n")[0]
            # Default to python if it just did a "```" then continued writing code
            if language == "" and "\n" in current_code_block:
              language = "python"

            code = current_code_block.split("\n")[1:].strip("` \n")
            
            arguments = {"language": language, "code": code}
            
            # Code-Llama won't make a "function_call" property for us to store this under, so:
            if "function_call" not in self.messages[-1]:
              self.messages[-1]["function_call"] = {}
              
            self.messages[-1]["function_call"]["parsed_arguments"] = arguments            

      else:
        # We are not in a function call.

        # Check if we just left a function call
        if in_function_call == True:

          if self.local:
            # This is the same as when gpt-4 gives finish_reason as function_call.
            # We have just finished a code block, so now we should run it.
            llama_function_call_finished = True

        # Remember we're not in a function_call
        in_function_call = False

        # If there's no active block,
        if self.active_block == None:

          # Create a message block
          self.active_block = MessageBlock()

      # Update active_block
      self.active_block.update_from_message(self.messages[-1])

      # Check if we're finished
      if chunk["choices"][0]["finish_reason"] or llama_function_call_finished:
        if chunk["choices"][
            0]["finish_reason"] == "function_call" or llama_function_call_finished:
          # Time to call the function!
          # (Because this is Open Interpreter, we only have one function.)

          if self.debug_mode:
            print("Running function:")
            print(self.messages[-1])
            print("---")

          # Ask for user confirmation to run code
          if self.auto_run == False:

            # End the active block so you can run input() below it
            # Save language and code so we can create a new block in a moment
            self.active_block.end()
            language = self.active_block.language
            code = self.active_block.code

            # Prompt user
            response = input("  Would you like to run this code? (y/n)\n\n  ")
            print("")  # <- Aesthetic choice

            if response.strip().lower() == "y":
              # Create a new, identical block where the code will actually be run
              self.active_block = CodeBlock()
              self.active_block.language = language
              self.active_block.code = code

            else:
              # User declined to run code.
              self.active_block.end()
              self.messages.append({
                "role":
                "function",
                "name":
                "run_code",
                "content":
                "User decided not to run this code."
              })
              return

          # If we couldn't parse its arguments, we need to try again.
          if not self.local and "parsed_arguments" not in self.messages[-1]["function_call"]:

            # After collecting some data via the below instruction to users,
            # This is the most common failure pattern: https://github.com/KillianLucas/open-interpreter/issues/41
            
            # print("> Function call could not be parsed.\n\nPlease open an issue on Github (openinterpreter.com, click Github) and paste the following:")
            # print("\n", self.messages[-1]["function_call"], "\n")
            # time.sleep(2)
            # print("Informing the language model and continuing...")

            # Since it can't really be fixed without something complex,
            # let's just berate the LLM then go around again.
            
            self.messages.append({
              "role": "function",
              "name": "run_code",
              "content": """Your function call could not be parsed. Please use ONLY the `run_code` function, which takes two parameters: `code` and `language`. Your response should be formatted as a JSON."""
            })

            self.respond()
            return

          # Create or retrieve a Code Interpreter for this language
          language = self.messages[-1]["function_call"]["parsed_arguments"][
            "language"]
          if language not in self.code_interpreters:
            self.code_interpreters[language] = CodeInterpreter(language, self.debug_mode)
          code_interpreter = self.code_interpreters[language]

          # Let this Code Interpreter control the active_block
          code_interpreter.active_block = self.active_block
          code_interpreter.run()

          # End the active_block
          self.active_block.end()

          # Append the output to messages
          # Explicitly tell it if there was no output (sometimes "" = hallucinates output)
          self.messages.append({
            "role": "function",
            "name": "run_code",
            "content": self.active_block.output if self.active_block.output else "No output"
          })

          # Go around again
          self.respond()

        if chunk["choices"][0]["finish_reason"] != "function_call":
          # Done!

          # Code Llama likes to output "###" at the end of every message for some reason
          if self.local and "content" in self.messages[-1]:
            self.messages[-1]["content"] = self.messages[-1]["content"].strip().rstrip("#")
            self.active_block.update_from_message(self.messages[-1])
            time.sleep(0.1)
            
          self.active_block.end()
          return