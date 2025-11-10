import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Adicionar tratamento de erro global antes de renderizar
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error, event.filename, event.lineno);
    // Não impedir o carregamento, apenas logar
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason);
    // Não impedir o carregamento, apenas logar
  });
}

try {
  const root = createRoot(rootElement);
  root.render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
} catch (error) {
  console.error("Error rendering app:", error);
  // Exibir erro de forma mais visível
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : String(error);
  
  rootElement.innerHTML = `
    <div style="padding: 20px; color: white; background: #1a1a1a; min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; font-family: system-ui, sans-serif;">
      <h1 style="font-size: 24px; margin-bottom: 16px; color: #ff6b6b;">Erro ao carregar aplicação</h1>
      <p style="color: #ffd93d; margin-bottom: 16px;">${errorMessage}</p>
      <details style="width: 100%; max-width: 800px; margin-bottom: 16px;">
        <summary style="cursor: pointer; color: #74c0fc; margin-bottom: 8px;">Detalhes do erro</summary>
        <pre style="background: #2a2a2a; padding: 16px; border-radius: 8px; overflow: auto; color: #ccc; font-size: 12px; margin-top: 8px;">${errorStack}</pre>
      </details>
      <button onclick="window.location.reload()" style="margin-top: 16px; padding: 12px 24px; background: #8a2be2; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">Recarregar Página</button>
      <p style="margin-top: 16px; color: #888; font-size: 14px;">Se o problema persistir, verifique o console do navegador para mais detalhes.</p>
    </div>
  `;
}
