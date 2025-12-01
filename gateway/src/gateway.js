const express = require('express');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { randomUUID } = require('crypto');

const app = express();

// Use 5921 by default as required by the problem statement
const gatewayPort = Number(process.env.GATEWAY_PORT) || 5921;

// Default backend URL points to backend service on port 3847 inside Docker network
const backendUrl = process.env.BACKEND_URL || 'http://backend:3847';

// Security headers
app.use(helmet());

// Request ID + structured logging middleware
app.use((req, res, next) => {
  const existingId = req.headers['x-request-id'];
  const requestId = existingId || randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const log = {
      service: 'gateway',
      level: 'info',
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(log));
  });

  next();
});

// Basic rate limiting on /api routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// JSON body parsing
app.use(express.json());

async function proxyRequest(req, res, next) {
  const startTime = Date.now();
  const targetPath = req.url;
  const targetUrl = `${backendUrl}${targetPath}`;
  const requestId = req.requestId;

  try {
    console.log(
      JSON.stringify({
        service: 'gateway',
        level: 'info',
        requestId,
        direction: 'outbound',
        method: req.method,
        path: req.url,
        targetUrl,
        timestamp: new Date().toISOString(),
      })
    );

    const headers = {};

    if (req.body && Object.keys(req.body).length > 0) {
      headers['Content-Type'] = req.headers['content-type'] || 'application/json';
    }

    headers['X-Forwarded-For'] =
      req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    headers['X-Forwarded-Proto'] = req.protocol || 'http';
    headers['x-request-id'] = requestId;

    const response = await axios({
      method: req.method,
      url: targetUrl,
      params: req.query,
      data: req.body,
      headers,
      timeout: 30000,
      validateStatus: () => true,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
    });

    const duration = Date.now() - startTime;
    console.log(
      JSON.stringify({
        service: 'gateway',
        level: 'info',
        requestId,
        direction: 'inbound',
        method: req.method,
        path: req.url,
        targetUrl,
        statusCode: response.status,
        durationMs: duration,
        timestamp: new Date().toISOString(),
      })
    );

    res.status(response.status);

    const headersToForward = ['content-type', 'content-length'];
    headersToForward.forEach((header) => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header]);
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      JSON.stringify({
        service: 'gateway',
        level: 'error',
        requestId,
        message: 'Proxy error',
        errorMessage: error.message,
        code: error.code,
        url: targetUrl,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
    );

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        res.status(503).json({
          error: 'Backend service unavailable',
          message: 'The backend service is currently unavailable. Please try again later.',
          requestId,
        });
        return;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        res.status(504).json({
          error: 'Backend service timeout',
          message: 'The backend service did not respond in time. Please try again later.',
          requestId,
        });
        return;
      } else if (error.response) {
        res.status(error.response.status).json(error.response.data);
        return;
      }
    }

    if (!res.headersSent) {
      res.status(502).json({ error: 'bad gateway', requestId });
    } else {
      next(error);
    }
  }
}

// Proxy all /api requests to backend
app.all('/api/*', proxyRequest);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Start server with graceful shutdown
const server = app.listen(gatewayPort, () => {
  console.log(
    JSON.stringify({
      service: 'gateway',
      level: 'info',
      message: `Gateway listening on port ${gatewayPort}, forwarding to ${backendUrl}`,
      port: gatewayPort,
      backendUrl,
      timestamp: new Date().toISOString(),
    })
  );
});

function shutdown(signal) {
  console.log(
    JSON.stringify({
      service: 'gateway',
      level: 'info',
      message: `Received ${signal}, shutting down gracefully`,
      signal,
      timestamp: new Date().toISOString(),
    })
  );

  server.close(() => {
    console.log(
      JSON.stringify({
        service: 'gateway',
        level: 'info',
        message: 'HTTP server closed',
        timestamp: new Date().toISOString(),
      })
    );
    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      JSON.stringify({
        service: 'gateway',
        level: 'error',
        message: 'Force exiting after 10 seconds',
        timestamp: new Date().toISOString(),
      })
    );
    process.exit(1);
  }, 10_000).unref();
}

['SIGINT', 'SIGTERM'].forEach((sig) => {
  process.on(sig, () => shutdown(sig));
});
