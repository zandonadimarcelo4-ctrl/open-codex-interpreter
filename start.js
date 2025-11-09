#!/usr/bin/env node
/**
 * Script de inicialização moderno
 * Substitui os scripts .bat antigos
 */

import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_DIR = join(__dirname, 'autogen_agent_interface');
const IS_WINDOWS = process.platform === 'win32';
const PNPM_CMD = IS_WINDOWS ? 'pnpm.cmd' : 'pnpm';
const NPM_CMD = IS_WINDOWS ? 'npm.cmd' : 'npm';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPackageManager() {
  // Verificar se pnpm está instalado
  try {
    execSync(`${PNPM_CMD} --version`, { stdio: 'ignore' });
    return 'pnpm';
  } catch {
    // Fallback para npm
    try {
      execSync(`${NPM_CMD} --version`, { stdio: 'ignore' });
      return 'npm';
    } catch {
      log('❌ Erro: pnpm ou npm não encontrado!', 'yellow');
      log('', 'reset');
      log('📦 Soluções:', 'cyan');
      log('1. Instale Node.js: https://nodejs.org/', 'cyan');
      log('2. Instale pnpm: npm install -g pnpm', 'cyan');
      log('3. Ou use npm diretamente (já vem com Node.js)', 'cyan');
      log('', 'reset');
      process.exit(1);
    }
  }
}

function checkDependencies() {
  const nodeModulesPath = join(PROJECT_DIR, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    log('📦 Instalando dependências...', 'yellow');
    return false;
  }
  return true;
}

function installDependencies(packageManager) {
  return new Promise((resolve, reject) => {
    log('📦 Instalando dependências...', 'yellow');
    const cmd = packageManager === 'pnpm' ? PNPM_CMD : NPM_CMD;
    const install = spawn(cmd, ['install'], {
      cwd: PROJECT_DIR,
      stdio: 'inherit',
      shell: true,
    });

    install.on('close', (code) => {
      if (code === 0) {
        log('✅ Dependências instaladas!', 'green');
        resolve();
      } else {
        log('❌ Erro ao instalar dependências!', 'yellow');
        reject(new Error(`Install failed with code ${code}`));
      }
    });
  });
}

function startDev(packageManager) {
  log('🚀 Iniciando servidor de desenvolvimento...', 'cyan');
  const cmd = packageManager === 'pnpm' ? PNPM_CMD : NPM_CMD;
  const dev = spawn(cmd, ['run', 'dev'], {
    cwd: PROJECT_DIR,
    stdio: 'inherit',
    shell: true,
  });

  dev.on('close', (code) => {
    if (code !== 0) {
      log(`❌ Servidor encerrado com código ${code}`, 'yellow');
    }
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    log('\n🛑 Encerrando servidor...', 'yellow');
    dev.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('\n🛑 Encerrando servidor...', 'yellow');
    dev.kill('SIGTERM');
    process.exit(0);
  });
}

async function main() {
  log('═══════════════════════════════════════', 'bright');
  log('🚀 AutoGen Agent Interface', 'bright');
  log('═══════════════════════════════════════', 'bright');
  log('');

  // Verificar package manager
  const packageManager = checkPackageManager();
  log(`📦 Package Manager: ${packageManager}`, 'blue');
  log('');

  // Verificar dependências
  const depsInstalled = checkDependencies();
  if (!depsInstalled) {
    try {
      await installDependencies(packageManager);
      log('');
    } catch (error) {
      log('❌ Erro ao instalar dependências!', 'yellow');
      process.exit(1);
    }
  } else {
    log('✅ Dependências já instaladas', 'green');
    log('');
  }

  // Iniciar servidor
  startDev(packageManager);
}

main().catch((error) => {
  log(`❌ Erro: ${error.message}`, 'yellow');
  process.exit(1);
});

