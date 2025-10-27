// Simple test application without external dependencies
const express = require('express');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    services: {
      database: 'not_connected',
      redis: 'not_connected',
      websocket: 'not_available'
    }
  });
});

// Test endpoints
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Pythagora AI Platform v2.0 is working!',
    timestamp: new Date().toISOString(),
    features: [
      '6 AI Agents: Capy.ai, Same.new, Kilo Agent, Cline, AI Assistant, Custom',
      '50+ Real Tools: No simulators, everything actually works',
      'Advanced Workflows: Complex multi-step automation',
      'Real Services: Git, File System, Database, Deployment, Testing',
      'Modern UI: Responsive design with real-time updates',
      'Production Ready: Security, monitoring, error handling'
    ]
  });
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Pythagora AI Platform v2.0.0 running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Access the platform at: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});