import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import net from "net";
import { generateInvitationLetter, type InvitationData } from "./src/lib/gemini.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const DEFAULT_PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post("/api/generate-letter", async (req, res) => {
    try {
      const data = req.body as InvitationData;
      const letter = await generateInvitationLetter(data);
      res.json({ letter });
    } catch (error) {
      console.error("API error generating letter:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to generate the letter right now.";
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    // Middleware mode + frequent parallel sessions can collide on Vite's default HMR port.
    process.env.DISABLE_HMR = "true";
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = await findAvailablePort(DEFAULT_PORT);
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();

function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = (port: number) => {
      const server = net.createServer();
      server.unref();
      server.once("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") {
          probe(port + 1);
          return;
        }
        reject(error);
      });
      server.once("listening", () => {
        server.close(() => resolve(port));
      });
      server.listen(port, "0.0.0.0");
    };

    probe(startPort);
  });
}
