import argparse
import inquirer

def cli(interpreter):
  """
  Takes an instance of interpreter.
  Modifies it according to command line flags, then runs chat.
  """

  # Setup CLI
  parser = argparse.ArgumentParser(description='Chat with Open Interpreter.')
  
  parser.add_argument('-y',
                      '--yes',
                      action='store_true',
                      help='execute code without user confirmation')
  parser.add_argument('-f',
                      '--fast',
                      action='store_true',
                      help='use gpt-3.5-turbo instead of gpt-4')
  parser.add_argument('-l',
                      '--local',
                      action='store_true',
                      default=True,  # Padrão: usar modo local com Ollama
                      help='run fully local with Ollama (default: True)')
  parser.add_argument('-d',
                      '--debug',
                      action='store_true',
                      help='prints extra information')
  parser.add_argument('--model',
                      help='model to use (default: from environment or deepseek-coder-v2-16b-q4_k_m-rtx)')
  parser.add_argument('--server',
                      action='store_true',
                      help='start WebSocket server instead of interactive chat')
  parser.add_argument('--ws',
                      action='store_true',
                      help='alias for --server (start WebSocket server)')
  parser.add_argument('--host',
                      default='localhost',
                      help='host for WebSocket server (default: localhost)')
  parser.add_argument('--port',
                      type=int,
                      default=4000,
                      help='port for WebSocket server (default: 4000)')
  parser.add_argument('--workdir',
                      help='working directory (sandbox) for WebSocket server')
  parser.add_argument('--allow-remote',
                      action='store_true',
                      help='allow remote connections (not recommended)')
  args = parser.parse_args()

  # Se --server ou --ws, iniciar servidor WebSocket
  if args.server or args.ws:
    from .server import OpenInterpreterServer
    server = OpenInterpreterServer(
      host=args.host if args.allow_remote else "localhost",
      port=args.port,
      auto_run=args.yes if args.yes else True,  # Default True para servidor
      local=args.local if args.local else True,  # Default True para servidor
      model=args.model,
      debug_mode=args.debug,
      use_ollama=True,
      workdir=args.workdir,
    )
    server.run()
    return

  # Modify interpreter according to command line flags
  if args.yes:
    interpreter.auto_run = True
  if args.fast:
    interpreter.model = "gpt-3.5-turbo"
  if args.local:
    interpreter.local = True
  if args.debug:
    interpreter.debug_mode = True
  if args.model:
    interpreter.model = args.model
    # Reinicializar adaptador Ollama se necessário
    if interpreter.use_ollama and hasattr(interpreter, 'ollama_adapter'):
      from .ollama_adapter import OllamaAdapter
      interpreter.ollama_adapter = OllamaAdapter(model=args.model)
      if interpreter.ollama_adapter.verify_connection():
        interpreter.use_ollama = True

  # Run the chat method
  interpreter.chat()


def main():
  """Função principal para CLI"""
  from .interpreter import Interpreter
  interpreter = Interpreter()
  cli(interpreter)
