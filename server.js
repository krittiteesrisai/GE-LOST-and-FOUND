import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(express.json());

// Cloud Run health check endpoints
app.get(['/health', '/_health', '/ping'], (_req, res) => {
  res.status(200).send('OK');
});

const distPath = path.resolve(__dirname, 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

// Serve static assets from dist if available
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// SPA fallback: any route serves index.html or fallback HTML
app.get('*', (_req, res) => {
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.status(200).send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Campus Lost & Found</title></head>
<body>
  <h2>Loading application...</h2>
  <script>setTimeout(() => window.location.reload(), 2000);</script>
</body>
</html>`);
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

