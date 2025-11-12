# 🚀 Quick Start: After Effects MCP Vision - ANIMA

## 📋 Pré-requisitos

- **Adobe After Effects 2020+** instalado
- **Node.js v18+** instalado
- **Python 3.11+** (para ANIMA)
- **Windows 10/11** ou **macOS Sonoma+**

---

## 🔧 Instalação Rápida

### 1. Clonar e Instalar After Effects MCP Vision

```bash
# Clonar repositório
git clone https://github.com/VolksRat71/after-effects-mcp-vision.git
cd after-effects-mcp-vision

# Instalar dependências
npm install

# Build TypeScript e JSX
npm run build

# Instalar bridge no After Effects
npm run bridge-install
```

### 2. Configurar After Effects

**No After Effects:**
1. Abrir After Effects
2. Ir em **Edit > Preferences > Scripting & Expressions**
3. Habilitar **"Allow Scripts to Write Files and Access Network"**
4. Reiniciar After Effects

**Abrir Bridge Panel:**
1. Ir em **Window > mcp-bridge-auto.jsx**
2. Habilitar **"Auto-run"**
3. Deixar painel aberto

### 3. Iniciar Servidor MCP

```bash
# No diretório after-effects-mcp-vision
npm start
```

O servidor MCP estará rodando e pronto para receber comandos.

---

## 🔌 Integração com ANIMA

### 1. Configurar MCP no ANIMA

**Adicionar ao arquivo de configuração MCP:**

```json
{
  "mcpServers": {
    "after-effects": {
      "command": "node",
      "args": ["/caminho/para/after-effects-mcp-vision/build/server/index.js"],
      "env": {
        "MCP_TEMP_PATH": "./build/temp"
      }
    }
  }
}
```

### 2. Usar Editor Agent

```python
from anima.agents.editor_agent_ae import AnimaEditorAgent
from anima.core.mcp_client import MCPClient

# Inicializar cliente MCP
mcp_client = MCPClient(config={
    "after-effects": {
        "command": "node",
        "args": ["/caminho/para/after-effects-mcp-vision/build/server/index.js"]
    }
})

# Inicializar Editor Agent
editor_agent = AnimaEditorAgent(mcp_client=mcp_client)

# Criar vídeo
task = {
    "name": "My Video",
    "width": 1920,
    "height": 1080,
    "duration": 60.0,
    "layers": [
        {
            "type": "text",
            "name": "Title",
            "text": "Hello World"
        },
        {
            "type": "solid",
            "name": "Background",
            "color": [0, 0, 0]
        }
    ]
}

result = await editor_agent.create_video(task, output_path="output.mp4")
print(f"Vídeo criado: {result['video_path']}")
```

---

## 🎬 Casos de Uso

### 1. Criar Composição Simples

```python
# Criar composição
comp = await editor_agent.ae_client.create_composition(
    name="My Comp",
    width=1920,
    height=1080,
    duration=10.0
)

# Visualizar composição
preview = await editor_agent.ae_client.visualize_composition(comp.name)
print(f"Preview: {preview}")
```

### 2. Aplicar Template

```python
# Aplicar template
comp = await editor_agent.ae_client.apply_template(
    template_path="/path/to/template.aep",
    comp_name="Main Comp",
    variables={
        "title": "My Video Title",
        "subtitle": "My Video Subtitle",
        "color": [255, 0, 0]  # Vermelho
    }
)
```

### 3. Adicionar Camadas e Animações

```python
# Adicionar camada de texto
layer = await editor_agent.ae_client.add_layer(
    comp_name="Main Comp",
    layer_type="text",
    name="Title Layer"
)

# Adicionar keyframes
await editor_agent.ae_client.add_keyframe(
    comp_name="Main Comp",
    layer_name="Title Layer",
    property="Position",
    time=0.0,
    value=[960, 540],
    easing="easeInOut"
)

await editor_agent.ae_client.add_keyframe(
    comp_name="Main Comp",
    layer_name="Title Layer",
    property="Position",
    time=1.0,
    value=[960, 400],
    easing="easeInOut"
)
```

### 4. Renderizar Vídeo

```python
# Renderizar vídeo
video_path = await editor_agent.ae_client.render_video(
    comp_name="Main Comp",
    output_path="output.mp4",
    settings=RenderSettings(
        format="mp4",
        quality="high",
        codec="h264"
    )
)
print(f"Vídeo renderizado: {video_path}")
```

### 5. Analisar Composição (com VLM)

```python
# Analisar composição
analysis = await editor_agent.analyze_composition("Main Comp")

print(f"Score: {analysis.score}")
print(f"Issues: {analysis.issues}")
print(f"Suggestions: {analysis.suggestions}")
```

---

## 🛠️ Ferramentas Disponíveis

### Composições
- `ae_create_composition` - Criar composição
- `ae_list_compositions` - Listar composições
- `ae_open_composition` - Abrir composição
- `ae_close_composition` - Fechar composição
- `ae_get_composition_info` - Obter informações

### Camadas
- `ae_add_layer` - Adicionar camada
- `ae_remove_layer` - Remover camada
- `ae_modify_layer` - Modificar camada
- `ae_get_layer_info` - Obter informações da camada
- `ae_set_layer_property` - Definir propriedade

### Animações
- `ae_add_keyframe` - Adicionar keyframe
- `ae_remove_keyframe` - Remover keyframe
- `ae_set_keyframe_value` - Definir valor do keyframe
- `ae_apply_easing` - Aplicar easing
- `ae_apply_template` - Aplicar template

### Efeitos
- `ae_apply_effect` - Aplicar efeito
- `ae_remove_effect` - Remover efeito
- `ae_modify_effect` - Modificar efeito
- `ae_get_effect_info` - Obter informações do efeito

### Mídia
- `ae_import_media` - Importar mídia
- `ae_replace_media` - Substituir mídia
- `ae_organize_media` - Organizar mídia

### Visualização
- `ae_render_frame` - Renderizar frame
- `ae_visualize_composition` - Visualizar composição
- `ae_render_animation` - Renderizar animação

### Scripting
- `ae_execute_script` - Executar script customizado
- `ae_get_command_history` - Obter histórico de comandos

---

## 🐛 Troubleshooting

### Problema: Bridge Panel não aparece

**Solução:**
1. Verificar se o bridge foi instalado corretamente
2. Verificar se o After Effects foi reiniciado
3. Verificar se o script está em `Scripts/ScriptUI Panels/`

### Problema: Comandos não executam

**Solução:**
1. Verificar se o Bridge Panel está aberto
2. Verificar se "Auto-run" está habilitado
3. Verificar se o servidor MCP está rodando
4. Verificar permissões de arquivo

### Problema: Erro de permissão

**Solução:**
1. **Windows**: Executar como administrador
2. **macOS**: Dar permissão "Full Disk Access" ao After Effects
3. Verificar se "Allow Scripts to Write Files" está habilitado

### Problema: TIFF não converte para PNG

**Solução:**
1. Verificar se o servidor MCP está rodando
2. Verificar se o diretório `build/temp/` existe
3. Verificar permissões de escrita

---

## 📚 Referências

- [After Effects MCP Vision GitHub](https://github.com/VolksRat71/after-effects-mcp-vision)
- [Documentação MCP Tools](https://github.com/VolksRat71/after-effects-mcp-vision/blob/main/MCP_TOOLS_GUIDE.md)
- [Quick Start MCP](https://github.com/VolksRat71/after-effects-mcp-vision/blob/main/MCP_QUICK_START.md)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

**Última Atualização**: Novembro 2025
**Versão**: 1.0
**Status**: Ready for Integration 🚀

