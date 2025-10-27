// Vercel entry point for Pythagora AI Platform v2.0
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const aiRoutes = require('./routes/ai');
const aiProviderRoutes = require('./routes/ai-providers');
const agentRoutes = require('./routes/agents');
const deploymentRoutes = require('./routes/deployment');
const collaborationRoutes = require('./routes/collaboration');
const databaseRoutes = require('./routes/database');
const apiRoutes = require('./routes/api');
const testingRoutes = require('./routes/testing');
const monitoringRoutes = require('./routes/monitoring');

const { connectDB } = require('./config/database');
const { initializeRedis } = require('./config/redis');
const { setupWebSocket } = require('./config/websocket');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Static files
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/ai-providers', authenticateToken, aiProviderRoutes);
app.use('/api/agents', authenticateToken, agentRoutes);
app.use('/api/deployment', authenticateToken, deploymentRoutes);
app.use('/api/collaboration', authenticateToken, collaborationRoutes);
app.use('/api/database', authenticateToken, databaseRoutes);
app.use('/api/api-management', authenticateToken, apiRoutes);
app.use('/api/testing', authenticateToken, testingRoutes);
app.use('/api/monitoring', authenticateToken, monitoringRoutes);

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist'
  });
});

// Initialize services
const initializeApp = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize Redis
    await initializeRedis();
    
    // Setup WebSocket
    setupWebSocket(io);
    
    console.log('🚀 Pythagora AI Platform v2.0.0 initialized successfully');
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
  }
};

// Initialize app
initializeApp();

// Export for Vercel
module.exports = app;