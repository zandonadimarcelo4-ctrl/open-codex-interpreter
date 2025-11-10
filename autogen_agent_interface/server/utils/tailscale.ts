import { spawn } from 'child_process';
import { promisify } from 'util';

/**
 * Verifica se o Tailscale está instalado e rodando
 */
export async function checkTailscaleInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    // Tentar múltiplos comandos para verificar se o Tailscale está instalado
    const commands = [
      ['status'],
      ['version'],
      ['ip', '-4']
    ];
    
    let attempts = 0;
    const maxAttempts = commands.length;
    
    const tryCommand = (index: number) => {
      if (index >= maxAttempts) {
        resolve(false);
        return;
      }
      
      const process = spawn('tailscale', commands[index], { 
        shell: true,
        stdio: 'pipe',
        windowsHide: true
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
        // Se o comando retornou 0, o Tailscale está instalado e rodando
        if (code === 0) {
          resolve(true);
        } else {
          // Tentar próximo comando
          tryCommand(index + 1);
        }
      });
      
      process.on('error', (error) => {
        // Se houver erro, tentar próximo comando
        if (index < maxAttempts - 1) {
          tryCommand(index + 1);
        } else {
          resolve(false);
        }
      });
      
      // Timeout de 2 segundos por comando
      setTimeout(() => {
        if (!process.killed) {
          process.kill();
          if (index < maxAttempts - 1) {
            tryCommand(index + 1);
          } else {
            resolve(false);
          }
        }
      }, 2000);
    };
    
    tryCommand(0);
  });
}

/**
 * Verifica se o Tailscale Funnel está ativo para uma porta específica
 */
export async function checkTailscaleFunnel(port: number): Promise<{ active: boolean; url?: string; error?: string }> {
  return new Promise((resolve) => {
    const process = spawn('tailscale', ['funnel', 'status'], { 
      shell: true,
      stdio: 'pipe',
      windowsHide: true
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
      const fullOutput = output + errorOutput;
      
      // Verificar se há erro primeiro
      const fullOutputLower = fullOutput.toLowerCase();
      if (fullOutputLower.includes('stopped') || fullOutputLower.includes('not running')) {
        resolve({ active: false, error: 'Tailscale está parado. Execute: tailscale up' });
        return;
      }
      
      // Verificar se há um Funnel ativo (independente da porta mencionada)
      if (code === 0 && fullOutput.includes('https://')) {
        // Tentar extrair URL do Funnel do output - várias formas possíveis
        let urlMatch = fullOutput.match(/https:\/\/[^\s\n\r]+/);
        if (!urlMatch) {
          // Tentar formato alternativo: https://hostname.ts.net
          urlMatch = fullOutput.match(/https:\/\/[a-zA-Z0-9\-]+\.ts\.net[^\s\n\r]*/);
        }
        if (!urlMatch) {
          // Tentar extrair hostname e construir URL
          const hostMatch = fullOutput.match(/([a-zA-Z0-9\-]+\.ts\.net)/);
          if (hostMatch) {
            urlMatch = [`https://${hostMatch[1]}`];
          }
        }
        
        if (urlMatch) {
          // Limpar a URL (remover caracteres inválidos no final)
          let url = urlMatch[0].replace(/[^\w\-\.:/\s]+$/, '').trim();
          
          // Verificar se a porta está na URL ou no output
          const portInUrl = url.match(/:(\d+)/);
          const portInOutput = fullOutput.includes(`:${port}`) || fullOutput.includes(` ${port} `) || fullOutput.includes(`port ${port}`);
          
          // Se a porta não está na URL, adicionar
          if (!portInUrl && !url.includes(`:${port}`)) {
            // Se a porta está mencionada no output, usar ela
            if (portInOutput) {
              url = `${url}:${port}`;
            } else {
              // Tentar extrair porta do output
              const portMatch = fullOutput.match(/port[:\s]+(\d+)/i) || fullOutput.match(/:(\d+)/);
              if (portMatch && portMatch[1]) {
                url = `${url}:${portMatch[1]}`;
              } else {
                // Usar a porta padrão se não encontrar
                url = `${url}:${port}`;
              }
            }
          }
          
          // Verificar se a porta no output corresponde à porta especificada
          const isCorrectPort = portInOutput || (portInUrl && portInUrl[1] === port.toString());
          
          if (isCorrectPort || !portInOutput) {
            // Funnel ativo - retornar URL (pode ser na porta especificada ou outra)
            resolve({ active: true, url });
          } else {
            // Funnel ativo mas em outra porta
            resolve({ active: false, error: `Funnel ativo em outra porta (${portInUrl?.[1] || 'desconhecida'}). Verifique: tailscale funnel status` });
          }
        } else {
          // Funnel ativo mas não conseguiu extrair URL
          resolve({ active: true, error: 'Funnel ativo mas URL não encontrada. Execute: tailscale funnel status' });
        }
      } else {
        resolve({ active: false, error: 'Nenhum Funnel ativo' });
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
 * Verifica se o Tailscale está rodando (não apenas instalado)
 */
export async function checkTailscaleRunning(): Promise<{ running: boolean; error?: string }> {
  return new Promise((resolve) => {
    const process = spawn('tailscale', ['status'], { 
      shell: true,
      stdio: 'pipe',
      windowsHide: true
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
      const fullOutput = (output + errorOutput).toLowerCase();
      
      if (code === 0) {
        // Se retornou 0, o Tailscale está rodando
        resolve({ running: true });
      } else if (fullOutput.includes('stopped') || fullOutput.includes('not running')) {
        resolve({ running: false, error: 'Tailscale está parado. Execute: tailscale up' });
      } else {
        resolve({ running: false, error: errorOutput || 'Tailscale não está rodando' });
      }
    });
    
    process.on('error', (error) => {
      resolve({ running: false, error: error.message || 'Erro ao verificar Tailscale' });
    });
    
    setTimeout(() => {
      if (!process.killed) {
        process.kill();
        resolve({ running: false, error: 'Timeout ao verificar Tailscale' });
      }
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
      stdio: 'pipe',
      windowsHide: true
    });
    
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    process.on('close', async (code) => {
      const fullOutputLower = (output + errorOutput).toLowerCase();
      
      // Verificar se o erro é porque o Tailscale está parado
      if (fullOutputLower.includes('stopped') || fullOutputLower.includes('not running')) {
        resolve({ 
          success: false, 
          error: 'Tailscale está parado. Execute: tailscale up' 
        });
        return;
      }
      
      if (code === 0) {
        // Tentar extrair URL do output
        const fullOutput = output + errorOutput;
        let urlMatch = fullOutput.match(/https:\/\/[^\s\n\r]+/);
        if (!urlMatch) {
          // Tentar formato alternativo
          urlMatch = fullOutput.match(/https:\/\/[a-zA-Z0-9\-]+\.ts\.net[^\s\n\r]*/);
        }
        if (!urlMatch) {
          // Tentar extrair hostname e construir URL
          const hostMatch = fullOutput.match(/([a-zA-Z0-9\-]+\.ts\.net)/);
          if (hostMatch) {
            urlMatch = [`https://${hostMatch[1]}:${port}`];
          }
        }
        
        if (urlMatch) {
          // Limpar a URL
          let url = urlMatch[0].replace(/[^\w\-\.:/\s]+$/, '');
          if (!url.includes(`:${port}`) && !url.endsWith('/')) {
            url = `${url}:${port}`;
          }
          resolve({ success: true, url });
        } else {
          // Se não conseguiu extrair do output, verificar status após um delay
          setTimeout(async () => {
            const status = await checkTailscaleFunnel(port);
            if (status.active && status.url) {
              resolve({ success: true, url: status.url });
            } else {
              resolve({ success: true });
            }
          }, 1000);
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

