import { spawn } from 'child_process';
import { promisify } from 'util';

/**
 * Verifica se o Tailscale está instalado e rodando
 */
export async function checkTailscaleInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn('tailscale', ['status'], { 
      shell: true,
      stdio: 'pipe'
    });
    
    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      // Se o comando retornou 0, o Tailscale está instalado e rodando
      resolve(code === 0);
    });
    
    process.on('error', () => {
      // Se houver erro, o Tailscale não está instalado ou não está no PATH
      resolve(false);
    });
    
    // Timeout de 3 segundos
    setTimeout(() => {
      process.kill();
      resolve(false);
    }, 3000);
  });
}

/**
 * Verifica se o Tailscale Funnel está ativo para uma porta específica
 */
export async function checkTailscaleFunnel(port: number): Promise<{ active: boolean; url?: string }> {
  return new Promise((resolve) => {
    const process = spawn('tailscale', ['funnel', 'status'], { 
      shell: true,
      stdio: 'pipe'
    });
    
    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0 && output.includes(`:${port}`)) {
        // Extrair URL do Funnel do output
        const urlMatch = output.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
          resolve({ active: true, url: urlMatch[0] });
        } else {
          resolve({ active: true });
        }
      } else {
        resolve({ active: false });
      }
    });
    
    process.on('error', () => {
      resolve({ active: false });
    });
    
    // Timeout de 3 segundos
    setTimeout(() => {
      process.kill();
      resolve({ active: false });
    }, 3000);
  });
}

/**
 * Inicia o Tailscale Funnel para uma porta específica
 */
export async function startTailscaleFunnel(port: number): Promise<{ success: boolean; url?: string; error?: string }> {
  return new Promise((resolve) => {
    const process = spawn('tailscale', ['funnel', '--bg', port.toString()], { 
      shell: true,
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        // Extrair URL do Funnel do output
        const urlMatch = output.match(/https:\/\/[^\s]+/) || output.match(/https:\/\/[^\n]+/);
        if (urlMatch) {
          resolve({ success: true, url: urlMatch[0] });
        } else {
          resolve({ success: true });
        }
      } else {
        resolve({ 
          success: false, 
          error: errorOutput || `Tailscale Funnel falhou com código ${code}` 
        });
      }
    });
    
    process.on('error', (error) => {
      resolve({ 
        success: false, 
        error: error.message || 'Erro ao executar comando Tailscale' 
      });
    });
    
    // Timeout de 10 segundos
    setTimeout(() => {
      process.kill();
      resolve({ 
        success: false, 
        error: 'Timeout ao iniciar Tailscale Funnel' 
      });
    }, 10000);
  });
}

/**
 * Para o Tailscale Funnel para uma porta específica
 */
export async function stopTailscaleFunnel(port: number): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const process = spawn('tailscale', ['funnel', '--bg', '--off', port.toString()], { 
      shell: true,
      stdio: 'pipe'
    });
    
    let errorOutput = '';
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({ 
          success: false, 
          error: errorOutput || `Falha ao parar Tailscale Funnel (código ${code})` 
        });
      }
    });
    
    process.on('error', (error) => {
      resolve({ 
        success: false, 
        error: error.message || 'Erro ao executar comando Tailscale' 
      });
    });
    
    // Timeout de 5 segundos
    setTimeout(() => {
      process.kill();
      resolve({ 
        success: false, 
        error: 'Timeout ao parar Tailscale Funnel' 
      });
    }, 5000);
  });
}

