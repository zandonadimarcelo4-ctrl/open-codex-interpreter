import express from "express";
import { createServer } from "http";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startDevServer() {
  const app = express();
  const server = createServer(app);

  // Criar servidor Vite
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: { server },
    },
  });

  // Usar middleware do Vite
  app.use(vite.middlewares);

  // Servir index.html para todas as rotas
  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const template = await vite.transformIndexHtml(url, `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Open Codex Interpreter</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
      `);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      next(e);
    }
  });

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log(`Frontend dev server running on http://localhost:${port}/`);
    console.log(`Backend API should be running on http://localhost:8080/api`);
  });
}

startDevServer().catch(console.error);

