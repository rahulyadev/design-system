import { createReadStream } from "node:fs";
import { lstat, readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  fileURLToPath(new URL("..", import.meta.url)),
);
const previewRoot = path.resolve(repositoryRoot, ".preview");
const hostname = "127.0.0.1";
const port = 4179;
const nonce = "design-system-preview-nonce";
const contentSecurityPolicy = [
  "default-src 'none'",
  `script-src 'self' 'nonce-${nonce}'`,
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'none'",
].join("; ");

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(message),
  });
  response.end(message);
}

if (
  path.dirname(previewRoot) !== repositoryRoot ||
  path.basename(previewRoot) !== ".preview"
) {
  throw new Error(`Unsafe preview root: ${previewRoot}`);
}

const indexPath = path.join(previewRoot, "index.html");
if (!(await lstat(indexPath)).isFile()) {
  throw new Error(
    "Packed preview is missing. Run npm run preview:build first.",
  );
}

const server = http.createServer(async (request, response) => {
  response.setHeader("Content-Security-Policy", contentSecurityPolicy);
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    sendText(response, 405, "Method not allowed.");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url ?? "/", `http://${hostname}:${port}`).pathname,
    );
  } catch {
    sendText(response, 400, "Invalid request path.");
    return;
  }

  if (pathname.includes("\0") || pathname.split("/").includes("..")) {
    sendText(response, 403, "Forbidden path.");
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const requestedPath = path.resolve(previewRoot, relativePath);
  if (!requestedPath.startsWith(`${previewRoot}${path.sep}`)) {
    sendText(response, 403, "Forbidden path.");
    return;
  }

  let fileStatus;
  try {
    fileStatus = await lstat(requestedPath);
  } catch {
    sendText(response, 404, "Not found.");
    return;
  }

  if (!fileStatus.isFile() || fileStatus.isSymbolicLink()) {
    sendText(response, 404, "Not found.");
    return;
  }

  const contentType = contentTypes.get(path.extname(requestedPath));
  if (!contentType) {
    sendText(response, 415, "Unsupported file type.");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Length": fileStatus.size,
    "Content-Type": contentType,
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(requestedPath).pipe(response);
});

server.on("clientError", (error, socket) => {
  if (!socket.destroyed) {
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  }
  if (error.code !== "ECONNRESET") {
    console.error(error);
  }
});

server.listen(port, hostname, () => {
  console.log(`Packed preview listening at http://${hostname}:${port}`);
});

let shuttingDown = false;
function shutDown() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", shutDown);
process.once("SIGTERM", shutDown);

// Confirm the document is readable before leaving the long-running server active.
await readFile(indexPath);
