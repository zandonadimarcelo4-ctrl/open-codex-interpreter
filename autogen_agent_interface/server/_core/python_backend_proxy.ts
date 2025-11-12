/**
 * 🔄 Proxy para Backend Python
 * 
 * Este arquivo cria um proxy que redireciona todas as requisições de API
 * e WebSocket para o backend Python na porta 8000.
 * 
 * O servidor TypeScript agora serve APENAS:
 * - Frontend React (via Vite)
 * - Proxy para backend Python
 * 
 * TODA a lógica de processamento está no backend Python!
 */

import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Server } from "http";

// URL do backend Python
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const USE_PYTHON_BACKEND = process.env.USE_PYTHON_BACKEND !== "false"; // Padrão: true

/**
 * Configurar proxy para backend Python
 * 
 * Redireciona todas as requisições de API para o backend Python:
 * - /api/chat → http://localhost:8000/api/chat
 * - /api/tools → http://localhost:8000/api/tools
 * - /health → http://localhost:8000/health
 * 
 * Nota: WebSocket é configurado no frontend para conectar diretamente ao backend Python
 */
export function setupPythonBackendProxy(app: express.Application, _server: Server) {
  if (!USE_PYTHON_BACKEND) {
    console.log(`[Proxy] ⚠️ Proxy para backend Python DESABILITADO (USE_PYTHON_BACKEND=false)`);
    return;
  }
  
  console.log(`[Proxy] 🔄 Configurando proxy para backend Python: ${PYTHON_BACKEND_URL}`);
  
  // Configuração comum do proxy
  const proxyOptions: Options = {
    target: PYTHON_BACKEND_URL,
    changeOrigin: true,
    ws: false, // WebSocket é tratado no frontend diretamente
    logLevel: "info",
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] 📨 ${req.method} ${req.url} → ${PYTHON_BACKEND_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Proxy] ✅ ${proxyRes.statusCode} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy] ❌ Erro ao redirecionar ${req.url}:`, err.message);
      if (!res.headersSent && res.writeHead) {
        res.writeHead(500, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({
          error: "Erro ao conectar com backend Python",
          message: err.message,
          backend_url: PYTHON_BACKEND_URL
        }));
      }
    },
  };
  
  // Proxy para /api/chat
  app.use("/api/chat", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/chat": "/api/chat",
    },
  }));
  
  // Proxy para /api/tools
  app.use("/api/tools", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tools": "/api/tools",
    },
  }));
  
  // Proxy para /api/tts (TTS do backend Python, se disponível)
  app.use("/api/tts", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tts": "/api/tts",
    },
  }));
  
  // Proxy para /health
  app.use("/health", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/health": "/health",
    },
  }));
  
  console.log(`[Proxy] ✅ Proxy configurado para backend Python: ${PYTHON_BACKEND_URL}`);
  console.log(`[Proxy] 📡 Endpoints redirecionados:`);
  console.log(`[Proxy]   - POST /api/chat → ${PYTHON_BACKEND_URL}/api/chat`);
  console.log(`[Proxy]   - GET /api/tools → ${PYTHON_BACKEND_URL}/api/tools`);
  console.log(`[Proxy]   - POST /api/tts → ${PYTHON_BACKEND_URL}/api/tts`);
  console.log(`[Proxy]   - GET /health → ${PYTHON_BACKEND_URL}/health`);
  console.log(`[Proxy]   - WebSocket /ws → ws://localhost:8000/ws (configurado no frontend)`);
}

/**
 * Verificar se o backend Python está rodando
 */
export async function checkPythonBackend(): Promise<boolean> {
  if (!USE_PYTHON_BACKEND) {
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`[Proxy] ⚠️ Backend Python não está rodando em ${PYTHON_BACKEND_URL}`);
    console.warn(`[Proxy] 💡 Certifique-se de que o backend Python está rodando: python backend_python.py`);
    return false;
  }
}

/**
 * Obter URL do backend Python
 */
export function getPythonBackendUrl(): string {
  return PYTHON_BACKEND_URL;
}

/**
 * Verificar se o proxy está habilitado
 */
export function isPythonBackendEnabled(): boolean {
  return USE_PYTHON_BACKEND;
}


 * 
 * Este arquivo cria um proxy que redireciona todas as requisições de API
 * e WebSocket para o backend Python na porta 8000.
 * 
 * O servidor TypeScript agora serve APENAS:
 * - Frontend React (via Vite)
 * - Proxy para backend Python
 * 
 * TODA a lógica de processamento está no backend Python!
 */

import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Server } from "http";

// URL do backend Python
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const USE_PYTHON_BACKEND = process.env.USE_PYTHON_BACKEND !== "false"; // Padrão: true

/**
 * Configurar proxy para backend Python
 * 
 * Redireciona todas as requisições de API para o backend Python:
 * - /api/chat → http://localhost:8000/api/chat
 * - /api/tools → http://localhost:8000/api/tools
 * - /health → http://localhost:8000/health
 * 
 * Nota: WebSocket é configurado no frontend para conectar diretamente ao backend Python
 */
export function setupPythonBackendProxy(app: express.Application, _server: Server) {
  if (!USE_PYTHON_BACKEND) {
    console.log(`[Proxy] ⚠️ Proxy para backend Python DESABILITADO (USE_PYTHON_BACKEND=false)`);
    return;
  }
  
  console.log(`[Proxy] 🔄 Configurando proxy para backend Python: ${PYTHON_BACKEND_URL}`);
  
  // Configuração comum do proxy
  const proxyOptions: Options = {
    target: PYTHON_BACKEND_URL,
    changeOrigin: true,
    ws: false, // WebSocket é tratado no frontend diretamente
    logLevel: "info",
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] 📨 ${req.method} ${req.url} → ${PYTHON_BACKEND_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Proxy] ✅ ${proxyRes.statusCode} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy] ❌ Erro ao redirecionar ${req.url}:`, err.message);
      if (!res.headersSent && res.writeHead) {
        res.writeHead(500, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({
          error: "Erro ao conectar com backend Python",
          message: err.message,
          backend_url: PYTHON_BACKEND_URL
        }));
      }
    },
  };
  
  // Proxy para /api/chat
  app.use("/api/chat", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/chat": "/api/chat",
    },
  }));
  
  // Proxy para /api/tools
  app.use("/api/tools", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tools": "/api/tools",
    },
  }));
  
  // Proxy para /api/tts (TTS do backend Python, se disponível)
  app.use("/api/tts", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tts": "/api/tts",
    },
  }));
  
  // Proxy para /health
  app.use("/health", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/health": "/health",
    },
  }));
  
  console.log(`[Proxy] ✅ Proxy configurado para backend Python: ${PYTHON_BACKEND_URL}`);
  console.log(`[Proxy] 📡 Endpoints redirecionados:`);
  console.log(`[Proxy]   - POST /api/chat → ${PYTHON_BACKEND_URL}/api/chat`);
  console.log(`[Proxy]   - GET /api/tools → ${PYTHON_BACKEND_URL}/api/tools`);
  console.log(`[Proxy]   - POST /api/tts → ${PYTHON_BACKEND_URL}/api/tts`);
  console.log(`[Proxy]   - GET /health → ${PYTHON_BACKEND_URL}/health`);
  console.log(`[Proxy]   - WebSocket /ws → ws://localhost:8000/ws (configurado no frontend)`);
}

/**
 * Verificar se o backend Python está rodando
 */
export async function checkPythonBackend(): Promise<boolean> {
  if (!USE_PYTHON_BACKEND) {
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`[Proxy] ⚠️ Backend Python não está rodando em ${PYTHON_BACKEND_URL}`);
    console.warn(`[Proxy] 💡 Certifique-se de que o backend Python está rodando: python backend_python.py`);
    return false;
  }
}

/**
 * Obter URL do backend Python
 */
export function getPythonBackendUrl(): string {
  return PYTHON_BACKEND_URL;
}

/**
 * Verificar se o proxy está habilitado
 */
export function isPythonBackendEnabled(): boolean {
  return USE_PYTHON_BACKEND;
}


 * 
 * Este arquivo cria um proxy que redireciona todas as requisições de API
 * e WebSocket para o backend Python na porta 8000.
 * 
 * O servidor TypeScript agora serve APENAS:
 * - Frontend React (via Vite)
 * - Proxy para backend Python
 * 
 * TODA a lógica de processamento está no backend Python!
 */

import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Server } from "http";

// URL do backend Python
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const USE_PYTHON_BACKEND = process.env.USE_PYTHON_BACKEND !== "false"; // Padrão: true

/**
 * Configurar proxy para backend Python
 * 
 * Redireciona todas as requisições de API para o backend Python:
 * - /api/chat → http://localhost:8000/api/chat
 * - /api/tools → http://localhost:8000/api/tools
 * - /health → http://localhost:8000/health
 * 
 * Nota: WebSocket é configurado no frontend para conectar diretamente ao backend Python
 */
export function setupPythonBackendProxy(app: express.Application, _server: Server) {
  if (!USE_PYTHON_BACKEND) {
    console.log(`[Proxy] ⚠️ Proxy para backend Python DESABILITADO (USE_PYTHON_BACKEND=false)`);
    return;
  }
  
  console.log(`[Proxy] 🔄 Configurando proxy para backend Python: ${PYTHON_BACKEND_URL}`);
  
  // Configuração comum do proxy
  const proxyOptions: Options = {
    target: PYTHON_BACKEND_URL,
    changeOrigin: true,
    ws: false, // WebSocket é tratado no frontend diretamente
    logLevel: "info",
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] 📨 ${req.method} ${req.url} → ${PYTHON_BACKEND_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Proxy] ✅ ${proxyRes.statusCode} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy] ❌ Erro ao redirecionar ${req.url}:`, err.message);
      if (!res.headersSent && res.writeHead) {
        res.writeHead(500, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({
          error: "Erro ao conectar com backend Python",
          message: err.message,
          backend_url: PYTHON_BACKEND_URL
        }));
      }
    },
  };
  
  // Proxy para /api/chat
  app.use("/api/chat", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/chat": "/api/chat",
    },
  }));
  
  // Proxy para /api/tools
  app.use("/api/tools", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tools": "/api/tools",
    },
  }));
  
  // Proxy para /api/tts (TTS do backend Python, se disponível)
  app.use("/api/tts", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tts": "/api/tts",
    },
  }));
  
  // Proxy para /health
  app.use("/health", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/health": "/health",
    },
  }));
  
  console.log(`[Proxy] ✅ Proxy configurado para backend Python: ${PYTHON_BACKEND_URL}`);
  console.log(`[Proxy] 📡 Endpoints redirecionados:`);
  console.log(`[Proxy]   - POST /api/chat → ${PYTHON_BACKEND_URL}/api/chat`);
  console.log(`[Proxy]   - GET /api/tools → ${PYTHON_BACKEND_URL}/api/tools`);
  console.log(`[Proxy]   - POST /api/tts → ${PYTHON_BACKEND_URL}/api/tts`);
  console.log(`[Proxy]   - GET /health → ${PYTHON_BACKEND_URL}/health`);
  console.log(`[Proxy]   - WebSocket /ws → ws://localhost:8000/ws (configurado no frontend)`);
}

/**
 * Verificar se o backend Python está rodando
 */
export async function checkPythonBackend(): Promise<boolean> {
  if (!USE_PYTHON_BACKEND) {
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`[Proxy] ⚠️ Backend Python não está rodando em ${PYTHON_BACKEND_URL}`);
    console.warn(`[Proxy] 💡 Certifique-se de que o backend Python está rodando: python backend_python.py`);
    return false;
  }
}

/**
 * Obter URL do backend Python
 */
export function getPythonBackendUrl(): string {
  return PYTHON_BACKEND_URL;
}

/**
 * Verificar se o proxy está habilitado
 */
export function isPythonBackendEnabled(): boolean {
  return USE_PYTHON_BACKEND;
}


 * 
 * Este arquivo cria um proxy que redireciona todas as requisições de API
 * e WebSocket para o backend Python na porta 8000.
 * 
 * O servidor TypeScript agora serve APENAS:
 * - Frontend React (via Vite)
 * - Proxy para backend Python
 * 
 * TODA a lógica de processamento está no backend Python!
 */

import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Server } from "http";

// URL do backend Python
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const USE_PYTHON_BACKEND = process.env.USE_PYTHON_BACKEND !== "false"; // Padrão: true

/**
 * Configurar proxy para backend Python
 * 
 * Redireciona todas as requisições de API para o backend Python:
 * - /api/chat → http://localhost:8000/api/chat
 * - /api/tools → http://localhost:8000/api/tools
 * - /health → http://localhost:8000/health
 * 
 * Nota: WebSocket é configurado no frontend para conectar diretamente ao backend Python
 */
export function setupPythonBackendProxy(app: express.Application, _server: Server) {
  if (!USE_PYTHON_BACKEND) {
    console.log(`[Proxy] ⚠️ Proxy para backend Python DESABILITADO (USE_PYTHON_BACKEND=false)`);
    return;
  }
  
  console.log(`[Proxy] 🔄 Configurando proxy para backend Python: ${PYTHON_BACKEND_URL}`);
  
  // Configuração comum do proxy
  const proxyOptions: Options = {
    target: PYTHON_BACKEND_URL,
    changeOrigin: true,
    ws: false, // WebSocket é tratado no frontend diretamente
    logLevel: "info",
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] 📨 ${req.method} ${req.url} → ${PYTHON_BACKEND_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Proxy] ✅ ${proxyRes.statusCode} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy] ❌ Erro ao redirecionar ${req.url}:`, err.message);
      if (!res.headersSent && res.writeHead) {
        res.writeHead(500, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({
          error: "Erro ao conectar com backend Python",
          message: err.message,
          backend_url: PYTHON_BACKEND_URL
        }));
      }
    },
  };
  
  // Proxy para /api/chat
  app.use("/api/chat", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/chat": "/api/chat",
    },
  }));
  
  // Proxy para /api/tools
  app.use("/api/tools", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tools": "/api/tools",
    },
  }));
  
  // Proxy para /api/tts (TTS do backend Python, se disponível)
  app.use("/api/tts", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tts": "/api/tts",
    },
  }));
  
  // Proxy para /health
  app.use("/health", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/health": "/health",
    },
  }));
  
  console.log(`[Proxy] ✅ Proxy configurado para backend Python: ${PYTHON_BACKEND_URL}`);
  console.log(`[Proxy] 📡 Endpoints redirecionados:`);
  console.log(`[Proxy]   - POST /api/chat → ${PYTHON_BACKEND_URL}/api/chat`);
  console.log(`[Proxy]   - GET /api/tools → ${PYTHON_BACKEND_URL}/api/tools`);
  console.log(`[Proxy]   - POST /api/tts → ${PYTHON_BACKEND_URL}/api/tts`);
  console.log(`[Proxy]   - GET /health → ${PYTHON_BACKEND_URL}/health`);
  console.log(`[Proxy]   - WebSocket /ws → ws://localhost:8000/ws (configurado no frontend)`);
}

/**
 * Verificar se o backend Python está rodando
 */
export async function checkPythonBackend(): Promise<boolean> {
  if (!USE_PYTHON_BACKEND) {
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`[Proxy] ⚠️ Backend Python não está rodando em ${PYTHON_BACKEND_URL}`);
    console.warn(`[Proxy] 💡 Certifique-se de que o backend Python está rodando: python backend_python.py`);
    return false;
  }
}

/**
 * Obter URL do backend Python
 */
export function getPythonBackendUrl(): string {
  return PYTHON_BACKEND_URL;
}

/**
 * Verificar se o proxy está habilitado
 */
export function isPythonBackendEnabled(): boolean {
  return USE_PYTHON_BACKEND;
}


 * 
 * Este arquivo cria um proxy que redireciona todas as requisições de API
 * e WebSocket para o backend Python na porta 8000.
 * 
 * O servidor TypeScript agora serve APENAS:
 * - Frontend React (via Vite)
 * - Proxy para backend Python
 * 
 * TODA a lógica de processamento está no backend Python!
 */

import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Server } from "http";

// URL do backend Python
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const USE_PYTHON_BACKEND = process.env.USE_PYTHON_BACKEND !== "false"; // Padrão: true

/**
 * Configurar proxy para backend Python
 * 
 * Redireciona todas as requisições de API para o backend Python:
 * - /api/chat → http://localhost:8000/api/chat
 * - /api/tools → http://localhost:8000/api/tools
 * - /health → http://localhost:8000/health
 * 
 * Nota: WebSocket é configurado no frontend para conectar diretamente ao backend Python
 */
export function setupPythonBackendProxy(app: express.Application, _server: Server) {
  if (!USE_PYTHON_BACKEND) {
    console.log(`[Proxy] ⚠️ Proxy para backend Python DESABILITADO (USE_PYTHON_BACKEND=false)`);
    return;
  }
  
  console.log(`[Proxy] 🔄 Configurando proxy para backend Python: ${PYTHON_BACKEND_URL}`);
  
  // Configuração comum do proxy
  const proxyOptions: Options = {
    target: PYTHON_BACKEND_URL,
    changeOrigin: true,
    ws: false, // WebSocket é tratado no frontend diretamente
    logLevel: "info",
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] 📨 ${req.method} ${req.url} → ${PYTHON_BACKEND_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Proxy] ✅ ${proxyRes.statusCode} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy] ❌ Erro ao redirecionar ${req.url}:`, err.message);
      if (!res.headersSent && res.writeHead) {
        res.writeHead(500, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({
          error: "Erro ao conectar com backend Python",
          message: err.message,
          backend_url: PYTHON_BACKEND_URL
        }));
      }
    },
  };
  
  // Proxy para /api/chat
  app.use("/api/chat", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/chat": "/api/chat",
    },
  }));
  
  // Proxy para /api/tools
  app.use("/api/tools", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tools": "/api/tools",
    },
  }));
  
  // Proxy para /api/tts (TTS do backend Python, se disponível)
  app.use("/api/tts", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tts": "/api/tts",
    },
  }));
  
  // Proxy para /health
  app.use("/health", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/health": "/health",
    },
  }));
  
  console.log(`[Proxy] ✅ Proxy configurado para backend Python: ${PYTHON_BACKEND_URL}`);
  console.log(`[Proxy] 📡 Endpoints redirecionados:`);
  console.log(`[Proxy]   - POST /api/chat → ${PYTHON_BACKEND_URL}/api/chat`);
  console.log(`[Proxy]   - GET /api/tools → ${PYTHON_BACKEND_URL}/api/tools`);
  console.log(`[Proxy]   - POST /api/tts → ${PYTHON_BACKEND_URL}/api/tts`);
  console.log(`[Proxy]   - GET /health → ${PYTHON_BACKEND_URL}/health`);
  console.log(`[Proxy]   - WebSocket /ws → ws://localhost:8000/ws (configurado no frontend)`);
}

/**
 * Verificar se o backend Python está rodando
 */
export async function checkPythonBackend(): Promise<boolean> {
  if (!USE_PYTHON_BACKEND) {
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`[Proxy] ⚠️ Backend Python não está rodando em ${PYTHON_BACKEND_URL}`);
    console.warn(`[Proxy] 💡 Certifique-se de que o backend Python está rodando: python backend_python.py`);
    return false;
  }
}

/**
 * Obter URL do backend Python
 */
export function getPythonBackendUrl(): string {
  return PYTHON_BACKEND_URL;
}

/**
 * Verificar se o proxy está habilitado
 */
export function isPythonBackendEnabled(): boolean {
  return USE_PYTHON_BACKEND;
}


 * 
 * Este arquivo cria um proxy que redireciona todas as requisições de API
 * e WebSocket para o backend Python na porta 8000.
 * 
 * O servidor TypeScript agora serve APENAS:
 * - Frontend React (via Vite)
 * - Proxy para backend Python
 * 
 * TODA a lógica de processamento está no backend Python!
 */

import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Server } from "http";

// URL do backend Python
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const USE_PYTHON_BACKEND = process.env.USE_PYTHON_BACKEND !== "false"; // Padrão: true

/**
 * Configurar proxy para backend Python
 * 
 * Redireciona todas as requisições de API para o backend Python:
 * - /api/chat → http://localhost:8000/api/chat
 * - /api/tools → http://localhost:8000/api/tools
 * - /health → http://localhost:8000/health
 * 
 * Nota: WebSocket é configurado no frontend para conectar diretamente ao backend Python
 */
export function setupPythonBackendProxy(app: express.Application, _server: Server) {
  if (!USE_PYTHON_BACKEND) {
    console.log(`[Proxy] ⚠️ Proxy para backend Python DESABILITADO (USE_PYTHON_BACKEND=false)`);
    return;
  }
  
  console.log(`[Proxy] 🔄 Configurando proxy para backend Python: ${PYTHON_BACKEND_URL}`);
  
  // Configuração comum do proxy
  const proxyOptions: Options = {
    target: PYTHON_BACKEND_URL,
    changeOrigin: true,
    ws: false, // WebSocket é tratado no frontend diretamente
    logLevel: "info",
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] 📨 ${req.method} ${req.url} → ${PYTHON_BACKEND_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Proxy] ✅ ${proxyRes.statusCode} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy] ❌ Erro ao redirecionar ${req.url}:`, err.message);
      if (!res.headersSent && res.writeHead) {
        res.writeHead(500, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({
          error: "Erro ao conectar com backend Python",
          message: err.message,
          backend_url: PYTHON_BACKEND_URL
        }));
      }
    },
  };
  
  // Proxy para /api/chat
  app.use("/api/chat", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/chat": "/api/chat",
    },
  }));
  
  // Proxy para /api/tools
  app.use("/api/tools", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tools": "/api/tools",
    },
  }));
  
  // Proxy para /api/tts (TTS do backend Python, se disponível)
  app.use("/api/tts", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tts": "/api/tts",
    },
  }));
  
  // Proxy para /health
  app.use("/health", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/health": "/health",
    },
  }));
  
  console.log(`[Proxy] ✅ Proxy configurado para backend Python: ${PYTHON_BACKEND_URL}`);
  console.log(`[Proxy] 📡 Endpoints redirecionados:`);
  console.log(`[Proxy]   - POST /api/chat → ${PYTHON_BACKEND_URL}/api/chat`);
  console.log(`[Proxy]   - GET /api/tools → ${PYTHON_BACKEND_URL}/api/tools`);
  console.log(`[Proxy]   - POST /api/tts → ${PYTHON_BACKEND_URL}/api/tts`);
  console.log(`[Proxy]   - GET /health → ${PYTHON_BACKEND_URL}/health`);
  console.log(`[Proxy]   - WebSocket /ws → ws://localhost:8000/ws (configurado no frontend)`);
}

/**
 * Verificar se o backend Python está rodando
 */
export async function checkPythonBackend(): Promise<boolean> {
  if (!USE_PYTHON_BACKEND) {
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`[Proxy] ⚠️ Backend Python não está rodando em ${PYTHON_BACKEND_URL}`);
    console.warn(`[Proxy] 💡 Certifique-se de que o backend Python está rodando: python backend_python.py`);
    return false;
  }
}

/**
 * Obter URL do backend Python
 */
export function getPythonBackendUrl(): string {
  return PYTHON_BACKEND_URL;
}

/**
 * Verificar se o proxy está habilitado
 */
export function isPythonBackendEnabled(): boolean {
  return USE_PYTHON_BACKEND;
}


 * 
 * Este arquivo cria um proxy que redireciona todas as requisições de API
 * e WebSocket para o backend Python na porta 8000.
 * 
 * O servidor TypeScript agora serve APENAS:
 * - Frontend React (via Vite)
 * - Proxy para backend Python
 * 
 * TODA a lógica de processamento está no backend Python!
 */

import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Server } from "http";

// URL do backend Python
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const USE_PYTHON_BACKEND = process.env.USE_PYTHON_BACKEND !== "false"; // Padrão: true

/**
 * Configurar proxy para backend Python
 * 
 * Redireciona todas as requisições de API para o backend Python:
 * - /api/chat → http://localhost:8000/api/chat
 * - /api/tools → http://localhost:8000/api/tools
 * - /health → http://localhost:8000/health
 * 
 * Nota: WebSocket é configurado no frontend para conectar diretamente ao backend Python
 */
export function setupPythonBackendProxy(app: express.Application, _server: Server) {
  if (!USE_PYTHON_BACKEND) {
    console.log(`[Proxy] ⚠️ Proxy para backend Python DESABILITADO (USE_PYTHON_BACKEND=false)`);
    return;
  }
  
  console.log(`[Proxy] 🔄 Configurando proxy para backend Python: ${PYTHON_BACKEND_URL}`);
  
  // Configuração comum do proxy
  const proxyOptions: Options = {
    target: PYTHON_BACKEND_URL,
    changeOrigin: true,
    ws: false, // WebSocket é tratado no frontend diretamente
    logLevel: "info",
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] 📨 ${req.method} ${req.url} → ${PYTHON_BACKEND_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Proxy] ✅ ${proxyRes.statusCode} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy] ❌ Erro ao redirecionar ${req.url}:`, err.message);
      if (!res.headersSent && res.writeHead) {
        res.writeHead(500, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({
          error: "Erro ao conectar com backend Python",
          message: err.message,
          backend_url: PYTHON_BACKEND_URL
        }));
      }
    },
  };
  
  // Proxy para /api/chat
  app.use("/api/chat", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/chat": "/api/chat",
    },
  }));
  
  // Proxy para /api/tools
  app.use("/api/tools", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tools": "/api/tools",
    },
  }));
  
  // Proxy para /api/tts (TTS do backend Python, se disponível)
  app.use("/api/tts", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tts": "/api/tts",
    },
  }));
  
  // Proxy para /health
  app.use("/health", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/health": "/health",
    },
  }));
  
  console.log(`[Proxy] ✅ Proxy configurado para backend Python: ${PYTHON_BACKEND_URL}`);
  console.log(`[Proxy] 📡 Endpoints redirecionados:`);
  console.log(`[Proxy]   - POST /api/chat → ${PYTHON_BACKEND_URL}/api/chat`);
  console.log(`[Proxy]   - GET /api/tools → ${PYTHON_BACKEND_URL}/api/tools`);
  console.log(`[Proxy]   - POST /api/tts → ${PYTHON_BACKEND_URL}/api/tts`);
  console.log(`[Proxy]   - GET /health → ${PYTHON_BACKEND_URL}/health`);
  console.log(`[Proxy]   - WebSocket /ws → ws://localhost:8000/ws (configurado no frontend)`);
}

/**
 * Verificar se o backend Python está rodando
 */
export async function checkPythonBackend(): Promise<boolean> {
  if (!USE_PYTHON_BACKEND) {
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`[Proxy] ⚠️ Backend Python não está rodando em ${PYTHON_BACKEND_URL}`);
    console.warn(`[Proxy] 💡 Certifique-se de que o backend Python está rodando: python backend_python.py`);
    return false;
  }
}

/**
 * Obter URL do backend Python
 */
export function getPythonBackendUrl(): string {
  return PYTHON_BACKEND_URL;
}

/**
 * Verificar se o proxy está habilitado
 */
export function isPythonBackendEnabled(): boolean {
  return USE_PYTHON_BACKEND;
}


 * 
 * Este arquivo cria um proxy que redireciona todas as requisições de API
 * e WebSocket para o backend Python na porta 8000.
 * 
 * O servidor TypeScript agora serve APENAS:
 * - Frontend React (via Vite)
 * - Proxy para backend Python
 * 
 * TODA a lógica de processamento está no backend Python!
 */

import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Server } from "http";

// URL do backend Python
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const USE_PYTHON_BACKEND = process.env.USE_PYTHON_BACKEND !== "false"; // Padrão: true

/**
 * Configurar proxy para backend Python
 * 
 * Redireciona todas as requisições de API para o backend Python:
 * - /api/chat → http://localhost:8000/api/chat
 * - /api/tools → http://localhost:8000/api/tools
 * - /health → http://localhost:8000/health
 * 
 * Nota: WebSocket é configurado no frontend para conectar diretamente ao backend Python
 */
export function setupPythonBackendProxy(app: express.Application, _server: Server) {
  if (!USE_PYTHON_BACKEND) {
    console.log(`[Proxy] ⚠️ Proxy para backend Python DESABILITADO (USE_PYTHON_BACKEND=false)`);
    return;
  }
  
  console.log(`[Proxy] 🔄 Configurando proxy para backend Python: ${PYTHON_BACKEND_URL}`);
  
  // Configuração comum do proxy
  const proxyOptions: Options = {
    target: PYTHON_BACKEND_URL,
    changeOrigin: true,
    ws: false, // WebSocket é tratado no frontend diretamente
    logLevel: "info",
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] 📨 ${req.method} ${req.url} → ${PYTHON_BACKEND_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Proxy] ✅ ${proxyRes.statusCode} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy] ❌ Erro ao redirecionar ${req.url}:`, err.message);
      if (!res.headersSent && res.writeHead) {
        res.writeHead(500, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({
          error: "Erro ao conectar com backend Python",
          message: err.message,
          backend_url: PYTHON_BACKEND_URL
        }));
      }
    },
  };
  
  // Proxy para /api/chat
  app.use("/api/chat", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/chat": "/api/chat",
    },
  }));
  
  // Proxy para /api/tools
  app.use("/api/tools", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tools": "/api/tools",
    },
  }));
  
  // Proxy para /api/tts (TTS do backend Python, se disponível)
  app.use("/api/tts", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tts": "/api/tts",
    },
  }));
  
  // Proxy para /health
  app.use("/health", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/health": "/health",
    },
  }));
  
  console.log(`[Proxy] ✅ Proxy configurado para backend Python: ${PYTHON_BACKEND_URL}`);
  console.log(`[Proxy] 📡 Endpoints redirecionados:`);
  console.log(`[Proxy]   - POST /api/chat → ${PYTHON_BACKEND_URL}/api/chat`);
  console.log(`[Proxy]   - GET /api/tools → ${PYTHON_BACKEND_URL}/api/tools`);
  console.log(`[Proxy]   - POST /api/tts → ${PYTHON_BACKEND_URL}/api/tts`);
  console.log(`[Proxy]   - GET /health → ${PYTHON_BACKEND_URL}/health`);
  console.log(`[Proxy]   - WebSocket /ws → ws://localhost:8000/ws (configurado no frontend)`);
}

/**
 * Verificar se o backend Python está rodando
 */
export async function checkPythonBackend(): Promise<boolean> {
  if (!USE_PYTHON_BACKEND) {
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`[Proxy] ⚠️ Backend Python não está rodando em ${PYTHON_BACKEND_URL}`);
    console.warn(`[Proxy] 💡 Certifique-se de que o backend Python está rodando: python backend_python.py`);
    return false;
  }
}

/**
 * Obter URL do backend Python
 */
export function getPythonBackendUrl(): string {
  return PYTHON_BACKEND_URL;
}

/**
 * Verificar se o proxy está habilitado
 */
export function isPythonBackendEnabled(): boolean {
  return USE_PYTHON_BACKEND;
}


 * 
 * Este arquivo cria um proxy que redireciona todas as requisições de API
 * e WebSocket para o backend Python na porta 8000.
 * 
 * O servidor TypeScript agora serve APENAS:
 * - Frontend React (via Vite)
 * - Proxy para backend Python
 * 
 * TODA a lógica de processamento está no backend Python!
 */

import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Server } from "http";

// URL do backend Python
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const USE_PYTHON_BACKEND = process.env.USE_PYTHON_BACKEND !== "false"; // Padrão: true

/**
 * Configurar proxy para backend Python
 * 
 * Redireciona todas as requisições de API para o backend Python:
 * - /api/chat → http://localhost:8000/api/chat
 * - /api/tools → http://localhost:8000/api/tools
 * - /health → http://localhost:8000/health
 * 
 * Nota: WebSocket é configurado no frontend para conectar diretamente ao backend Python
 */
export function setupPythonBackendProxy(app: express.Application, _server: Server) {
  if (!USE_PYTHON_BACKEND) {
    console.log(`[Proxy] ⚠️ Proxy para backend Python DESABILITADO (USE_PYTHON_BACKEND=false)`);
    return;
  }
  
  console.log(`[Proxy] 🔄 Configurando proxy para backend Python: ${PYTHON_BACKEND_URL}`);
  
  // Configuração comum do proxy
  const proxyOptions: Options = {
    target: PYTHON_BACKEND_URL,
    changeOrigin: true,
    ws: false, // WebSocket é tratado no frontend diretamente
    logLevel: "info",
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] 📨 ${req.method} ${req.url} → ${PYTHON_BACKEND_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Proxy] ✅ ${proxyRes.statusCode} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy] ❌ Erro ao redirecionar ${req.url}:`, err.message);
      if (!res.headersSent && res.writeHead) {
        res.writeHead(500, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({
          error: "Erro ao conectar com backend Python",
          message: err.message,
          backend_url: PYTHON_BACKEND_URL
        }));
      }
    },
  };
  
  // Proxy para /api/chat
  app.use("/api/chat", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/chat": "/api/chat",
    },
  }));
  
  // Proxy para /api/tools
  app.use("/api/tools", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tools": "/api/tools",
    },
  }));
  
  // Proxy para /api/tts (TTS do backend Python, se disponível)
  app.use("/api/tts", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tts": "/api/tts",
    },
  }));
  
  // Proxy para /health
  app.use("/health", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/health": "/health",
    },
  }));
  
  console.log(`[Proxy] ✅ Proxy configurado para backend Python: ${PYTHON_BACKEND_URL}`);
  console.log(`[Proxy] 📡 Endpoints redirecionados:`);
  console.log(`[Proxy]   - POST /api/chat → ${PYTHON_BACKEND_URL}/api/chat`);
  console.log(`[Proxy]   - GET /api/tools → ${PYTHON_BACKEND_URL}/api/tools`);
  console.log(`[Proxy]   - POST /api/tts → ${PYTHON_BACKEND_URL}/api/tts`);
  console.log(`[Proxy]   - GET /health → ${PYTHON_BACKEND_URL}/health`);
  console.log(`[Proxy]   - WebSocket /ws → ws://localhost:8000/ws (configurado no frontend)`);
}

/**
 * Verificar se o backend Python está rodando
 */
export async function checkPythonBackend(): Promise<boolean> {
  if (!USE_PYTHON_BACKEND) {
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`[Proxy] ⚠️ Backend Python não está rodando em ${PYTHON_BACKEND_URL}`);
    console.warn(`[Proxy] 💡 Certifique-se de que o backend Python está rodando: python backend_python.py`);
    return false;
  }
}

/**
 * Obter URL do backend Python
 */
export function getPythonBackendUrl(): string {
  return PYTHON_BACKEND_URL;
}

/**
 * Verificar se o proxy está habilitado
 */
export function isPythonBackendEnabled(): boolean {
  return USE_PYTHON_BACKEND;
}


 * 
 * Este arquivo cria um proxy que redireciona todas as requisições de API
 * e WebSocket para o backend Python na porta 8000.
 * 
 * O servidor TypeScript agora serve APENAS:
 * - Frontend React (via Vite)
 * - Proxy para backend Python
 * 
 * TODA a lógica de processamento está no backend Python!
 */

import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Server } from "http";

// URL do backend Python
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const USE_PYTHON_BACKEND = process.env.USE_PYTHON_BACKEND !== "false"; // Padrão: true

/**
 * Configurar proxy para backend Python
 * 
 * Redireciona todas as requisições de API para o backend Python:
 * - /api/chat → http://localhost:8000/api/chat
 * - /api/tools → http://localhost:8000/api/tools
 * - /health → http://localhost:8000/health
 * 
 * Nota: WebSocket é configurado no frontend para conectar diretamente ao backend Python
 */
export function setupPythonBackendProxy(app: express.Application, _server: Server) {
  if (!USE_PYTHON_BACKEND) {
    console.log(`[Proxy] ⚠️ Proxy para backend Python DESABILITADO (USE_PYTHON_BACKEND=false)`);
    return;
  }
  
  console.log(`[Proxy] 🔄 Configurando proxy para backend Python: ${PYTHON_BACKEND_URL}`);
  
  // Configuração comum do proxy
  const proxyOptions: Options = {
    target: PYTHON_BACKEND_URL,
    changeOrigin: true,
    ws: false, // WebSocket é tratado no frontend diretamente
    logLevel: "info",
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] 📨 ${req.method} ${req.url} → ${PYTHON_BACKEND_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Proxy] ✅ ${proxyRes.statusCode} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy] ❌ Erro ao redirecionar ${req.url}:`, err.message);
      if (!res.headersSent && res.writeHead) {
        res.writeHead(500, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({
          error: "Erro ao conectar com backend Python",
          message: err.message,
          backend_url: PYTHON_BACKEND_URL
        }));
      }
    },
  };
  
  // Proxy para /api/chat
  app.use("/api/chat", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/chat": "/api/chat",
    },
  }));
  
  // Proxy para /api/tools
  app.use("/api/tools", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tools": "/api/tools",
    },
  }));
  
  // Proxy para /api/tts (TTS do backend Python, se disponível)
  app.use("/api/tts", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/api/tts": "/api/tts",
    },
  }));
  
  // Proxy para /health
  app.use("/health", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      "^/health": "/health",
    },
  }));
  
  console.log(`[Proxy] ✅ Proxy configurado para backend Python: ${PYTHON_BACKEND_URL}`);
  console.log(`[Proxy] 📡 Endpoints redirecionados:`);
  console.log(`[Proxy]   - POST /api/chat → ${PYTHON_BACKEND_URL}/api/chat`);
  console.log(`[Proxy]   - GET /api/tools → ${PYTHON_BACKEND_URL}/api/tools`);
  console.log(`[Proxy]   - POST /api/tts → ${PYTHON_BACKEND_URL}/api/tts`);
  console.log(`[Proxy]   - GET /health → ${PYTHON_BACKEND_URL}/health`);
  console.log(`[Proxy]   - WebSocket /ws → ws://localhost:8000/ws (configurado no frontend)`);
}

/**
 * Verificar se o backend Python está rodando
 */
export async function checkPythonBackend(): Promise<boolean> {
  if (!USE_PYTHON_BACKEND) {
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`[Proxy] ⚠️ Backend Python não está rodando em ${PYTHON_BACKEND_URL}`);
    console.warn(`[Proxy] 💡 Certifique-se de que o backend Python está rodando: python backend_python.py`);
    return false;
  }
}

/**
 * Obter URL do backend Python
 */
export function getPythonBackendUrl(): string {
  return PYTHON_BACKEND_URL;
}

/**
 * Verificar se o proxy está habilitado
 */
export function isPythonBackendEnabled(): boolean {
  return USE_PYTHON_BACKEND;
}

