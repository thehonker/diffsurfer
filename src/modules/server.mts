import http from 'node:http';
import { parse } from 'node:url';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  loadRepository,
  getCommitHistory,
  getCommitFileChanges,
  getFileDiff,
  getFileContent,
  getAllFiles,
} from '../services/gitService.mjs';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files
async function serveStaticFile(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  filePath: string
): Promise<void> {
  try {
    // Determine content type based on file extension
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const contentType = getContentType(ext);

    // Read the file
    const fileContent = await readFile(filePath);

    // Set headers
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': fileContent.length,
    });

    // Send the file
    res.end(fileContent);
  } catch (error) {
    // File not found or other error
    console.error('Error serving static file:', error);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
  }
}

// Serve static files from the dist directory
async function serveStaticAssets(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  pathname: string
): Promise<void> {
  // Normalize the pathname to prevent directory traversal
  const normalizedPath = pathname
    .replace(/(\.\.[/\\])+/, '')
    .replace(/^\/+/, '');

  // Default to index.html for root path
  const assetPath =
    normalizedPath === ''
      ? join(__dirname, '../renderer/index/index.html')
      : join(__dirname, '..', normalizedPath);

  await serveStaticFile(req, res, assetPath);
}

// Get content type based on file extension
function getContentType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    txt: 'text/plain',
    mtl: 'text/plain',
    obj: 'text/plain',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Start HTTP server for API access
 */
export async function startServer(): Promise<void> {
  const server = http.createServer(async (req, res) => {
    const url = parse(req.url || '', true);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Serve API endpoints
    if (url.pathname === '/api/load-repository' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer | string) => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { url: repoUrl } = JSON.parse(body);
          const result = await loadRepository(repoUrl);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error: unknown) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error),
            })
          );
        }
      });
    } else if (
      url.pathname === '/api/commit-history' &&
      req.method === 'POST'
    ) {
      let body = '';
      req.on('data', (chunk: Buffer | string) => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { repoPath } = JSON.parse(body);
          const result = await getCommitHistory(repoPath);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, commits: result }));
        } catch (error: unknown) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error),
            })
          );
        }
      });
    } else if (
      url.pathname === '/api/commit-file-changes' &&
      req.method === 'POST'
    ) {
      let body = '';
      req.on('data', (chunk: Buffer | string) => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { repoPath, commitHash } = JSON.parse(body);
          const result = await getCommitFileChanges(repoPath, commitHash);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, files: result }));
        } catch (error: unknown) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error),
            })
          );
        }
      });
    } else if (url.pathname === '/api/file-diff' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer | string) => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { repoPath, commitHash, filePath } = JSON.parse(body);
          const result = await getFileDiff(repoPath, commitHash, filePath);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, diff: result }));
        } catch (error: unknown) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error),
            })
          );
        }
      });
    } else if (url.pathname === '/api/file-content' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer | string) => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { repoPath, commitHash, filePath } = JSON.parse(body);
          const result = await getFileContent(repoPath, commitHash, filePath);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, content: result }));
        } catch (error: unknown) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error),
            })
          );
        }
      });
    } else if (url.pathname === '/api/all-files' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer | string) => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { repoPath } = JSON.parse(body);
          const result = await getAllFiles(repoPath);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, files: result }));
        } catch (error: unknown) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error),
            })
          );
        }
      });
    } else {
      // Serve static assets for GET requests
      if (req.method === 'GET') {
        await serveStaticAssets(req, res, url.pathname || '');
        return;
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    }
  });

  server.listen(3000, () => {
    console.log('DiffSurfer server running on http://localhost:3000');
  });
}
