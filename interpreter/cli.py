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
  parser.add_argument('--host',
                      default='localhost',
                      help='host for WebSocket server (default: localhost)')
  parser.add_argument('--port',
                      type=int,
                      default=8000,
                      help='port for WebSocket server (default: 8000)')
  args = parser.parse_args()

  # Se --server, iniciar servidor WebSocket
  if args.server:
    from .server import OpenInterpreterServer
    server = OpenInterpreterServer(
      host=args.host,
      port=args.port,
      auto_run=args.yes,
      local=args.local,
      model=args.model,
      debug_mode=args.debug,
      use_ollama=True,
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
