import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import prisma from './utils/prisma.js';

// Internal Missing Imports
import memoryGuard from './middleware/memoryGuard.js';
import correlationIdMiddleware from './middleware/correlationIdMiddleware.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import v1Router from './routes/index.js';
import traccarMockRouter from './routes/traccarMock.js';
import errorHandler from './middleware/errorMiddleware.js';
import { getStatusHtml } from './utils/statusDashboard.js';
import swaggerSpec from './config/swagger.js';

const app = express();

// Item 43: Explicitly Disable X-Powered-By
app.disable('x-powered-by');
app.set('trust proxy', true);




// Fail-Fast: Environment Validation
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`[CRITICAL] Missing required environment variables: ${missingEnv.join(', ')}`);
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

// Item 19: Sanitize TRACCAR_URL
if (process.env.TRACCAR_URL && process.env.TRACCAR_URL.endsWith('/')) {
  process.env.TRACCAR_URL = process.env.TRACCAR_URL.slice(0, -1);
}


// Autonomic Guards
app.use(memoryGuard);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://*.mapbox.com"],
      connectSrc: [
        "'self'", 
        "ws:", 
        "wss:", 
        process.env.SERVER_IP ? `http://${process.env.SERVER_IP}` : "",
        process.env.SERVER_IP ? `https://${process.env.SERVER_IP}` : "",
        process.env.DOMAIN ? `http://${process.env.DOMAIN}` : "",
        process.env.DOMAIN ? `https://${process.env.DOMAIN}` : "",
        "http://localhost:3001", 
        "http://127.0.0.1:3001", 
        "http://localhost:8082", 
        "http://127.0.0.1:8082"
      ].filter(Boolean)
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Observability & Security
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 2000, 
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many login or reset attempts, please try again later'
});

app.use(limiter);
app.use('/api/auth', authLimiter);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (same-server fetches, curl, etc.)
    if (!origin) return callback(null, true);
    
    const whitelist = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [];

    // Always allow if origin is in whitelist
    if (whitelist.includes(origin)) return callback(null, true);
    
    // In non-production, allow everything
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    
    // In production, also allow requests coming from the same server IP
    // (e.g., browser on 3.108.114.12:80 calling /api/auth)
    const serverIp = process.env.DOMAIN || process.env.SERVER_IP;
    if (serverIp && (origin.includes(serverIp) || origin === `http://${serverIp}` || origin === `https://${serverIp}`)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[GeoSure API] ${req.method} ${req.path}`);
  next();
});

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Traccar Mock & Compatibility Routes
app.use(traccarMockRouter);

// Status Dashboard
app.get('/api/status', async (req, res) => {
  const html = await getStatusHtml();
  res.send(html);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GeoSurePath SaaS API is running.' });
});

// Primary API Versioning & Routing
app.use('/api', v1Router);
app.use('/api/v1', v1Router);
app.use('/api/saas', v1Router); 

// Global Error Handler
app.use(errorHandler);

// Ultimate JSON catch-all
app.all('/api/*', (req, res) => {
  const isMock = process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production';
  
  // Final safety check: if we are in mock mode, some routes might be in traccarMockRouter
  // which is already used, but if we reached here, they didn't match.
  res.status(isMock ? 404 : 503).json({ 
    error: isMock ? 'Route not found' : 'Traccar backend unavailable', 
    path: req.path,
    mode: isMock ? 'recovery-json' : 'integrated',
    suggestion: isMock ? 'Ensure the route is defined in traccarMock.js or v1Router' : 'Check Traccar service status'
  });
});

export default app;
export { prisma };
