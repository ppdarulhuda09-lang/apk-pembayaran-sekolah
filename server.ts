/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route: Google Sheets Sync Proxy
  app.post("/api/proxy", async (req, res) => {
    const { url, action, payload } = req.body;

    if (!url) {
      res.status(400).json({ error: "Missing Target Web App URL" });
      return;
    }

    try {
      if (action === "get") {
        console.log(`[Proxy GET] Fetching from Apps Script URL: ${url}`);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        res.json({ success: true, data });
      } else if (action === "post") {
        console.log(`[Proxy POST] Posting to Apps Script URL: ${url}`);
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        // Google Apps Script can respond with redirects (302) but native fetch handles it
        // when redirect: 'follow' (default).
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        res.json({ success: true, data });
      } else {
        res.status(400).json({ error: "Invalid action. Use 'get' or 'post'." });
      }
    } catch (error: any) {
      console.error("[Proxy Error]:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to communicate with Google Sheets via Apps Script."
      });
    }
  });

  // Serve other API endpoints (like a status or simple test endpoint)
  app.get("/api/status", (req, res) => {
    res.json({ status: "running", time: new Date().toISOString() });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
});
