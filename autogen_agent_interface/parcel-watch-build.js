/**
 * Script para fazer build contínuo do Parcel
 * Executa parcel build a cada mudança nos arquivos
 */

import { watch } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDir = path.join(__dirname, 'client');
const distDir = path.join(__dirname, '.parcel-dist');

console.log('🚀 Parcel Build Watch iniciado');
console.log('📍 Monitorando:', clientDir);
console.log('📍 Output:', distDir);
console.log('');

// Função para executar build
async function runBuild() {
  try {
    console.log('🔨 Executando build...');
    const { stdout, stderr } = await execAsync(
      `cross-env PARCEL_CACHE_DIR=.parcel-cache NODE_ENV=production parcel build client/index.html --dist-dir .parcel-dist --public-url / --no-minify --no-source-maps`,
      { cwd: __dirname }
    );
    
    if (stdout) {
      console.log(stdout);
    }
    if (stderr && !stderr.includes('Built in')) {
      console.error(stderr);
    }
    
    console.log('✅ Build concluído!\n');
  } catch (error) {
    console.error('❌ Erro no build:', error.message);
  }
}

// Executar build inicial
await runBuild();

// Monitorar mudanças
console.log('👀 Monitorando mudanças...\n');

let buildTimeout;
watch(clientDir, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  
  // Ignorar arquivos de cache e temporários
  if (filename.includes('node_modules') || 
      filename.includes('.parcel-cache') ||
      filename.includes('.parcel-dist') ||
      filename.startsWith('.')) {
    return;
  }
  
  // Debounce: aguardar 500ms antes de fazer build
  clearTimeout(buildTimeout);
  buildTimeout = setTimeout(() => {
    console.log(`📝 Arquivo alterado: ${filename}`);
    runBuild();
  }, 500);
});

console.log('✅ Monitoramento ativo. Pressione Ctrl+C para parar.\n');

