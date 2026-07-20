import { createServer as createViteServer } from "vite";
import path from "path";
import rawApp from "../backend/src/app";
import { close as closeDb } from "../backend/src/db/connection";
import express, { Request, Response, NextFunction } from "express";

const app = (rawApp as any).default || rawApp;
const PORT = 3000;

async function startServer() {
  // In development, merge Express APIs on port 3000 and proxy Vite static HMR
  if (process.env.NODE_ENV !== "production") {
    console.log("SERVER: Injecting Vite middleware into Express on port 3000 (Development Mode).");
    
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // 1. Serve Vite's asset and hot-module-replacement middlewares
    app.use(vite.middlewares);

    // 2. Catch all remaining non-API page requests and feed them into Vite's HTML transformer 🚀
    app.get("*", async (req: Request, res: Response, next: NextFunction) => {
  if (req.url.startsWith("/api") || req.url.startsWith("/uploads")) {
    return next();
  }

  try {
    const fs = await import("fs");
    let html = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
    html = await vite.transformIndexHtml(req.url, html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e as Error);
    next(e);
  }
});

  } else {
  // In production, serve the compiled static build output of the React SPA
  console.log("SERVER: Serving static files from react production build (Production Mode).");
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  // Add Request and Response types here 🚀
  app.get("*", (req: Request, res: Response) => { 
    res.sendFile(path.join(distPath, "index.html"));
  });
}

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SERVER: Combined Core listening at http://localhost:${PORT}`);
  });
}

// Graceful shutdown handlers
async function gracefulShutdown(signal: string) {
  console.log(`SERVER: Received ${signal}. Starting graceful shutdown...`);
  try {
    await closeDb();
    console.log("SERVER: Graceful shutdown complete.");
    process.exit(0);
  } catch (err) {
    console.error("SERVER: Error during graceful shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

startServer();