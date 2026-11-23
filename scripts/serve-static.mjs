import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] || 4173);
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".webp": "image/webp" };

http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname);
    const file = path.resolve(root, pathname === "/" ? "index.html" : pathname.slice(1));
    if (file !== path.join(root, "index.html") && !file.startsWith(`${root}${path.sep}`)) throw new Error("Invalid path");
    const body = await fs.readFile(file);
    const type = types[path.extname(file)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": type.startsWith("text/") || type === "application/json" ? `${type}; charset=utf-8` : type, "Cache-Control": "no-store" });
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Serving ${root} on http://127.0.0.1:${port}`));
