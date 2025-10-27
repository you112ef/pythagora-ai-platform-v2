const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  type: { 
    type: String, 
    required: true, 
    enum: ['capy', 'same', 'kilo', 'cline', 'assistant', 'custom'],
    index: true
  },
  displayName: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  capabilities: [{
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['code_generation', 'issue_management', 'ui_generation', 'task_management', 'code_editing', 'git', 'file_system', 'database', 'api', 'deployment', 'testing', 'monitoring'],
      required: true
    },
    parameters: mongoose.Schema.Types.Mixed,
    isEnabled: { type: Boolean, default: true }
  }],
  tools: [{
    name: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    configuration: mongoose.Schema.Types.Mixed,
    isActive: { type: Boolean, default: true }
  }],
  workflow: {
    steps: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      type: { 
        type: String, 
        enum: ['ai_generation', 'code_analysis', 'file_operation', 'git_operation', 'deployment', 'testing', 'api_call', 'database_operation', 'custom'],
        required: true
      },
      parameters: mongoose.Schema.Types.Mixed,
      dependencies: [{ type: String }],
      timeout: { type: Number, default: 30000 },
      retryCount: { type: Number, default: 3 },
      isEnabled: { type: Boolean, default: true }
    }],
    triggers: [{
      type: { 
        type: String, 
        enum: ['manual', 'scheduled', 'webhook', 'event'],
        required: true
      },
      configuration: mongoose.Schema.Types.Mixed,
      isActive: { type: Boolean, default: true }
    }],
    errorHandling: {
      strategy: { 
        type: String, 
        enum: ['stop', 'retry', 'skip', 'fallback'],
        default: 'retry'
      },
      maxRetries: { type: Number, default: 3 },
      fallbackAction: { type: String },
      notificationOnError: { type: Boolean, default: true }
    }
  },
  configuration: {
    apiKeys: mongoose.Schema.Types.Mixed,
    endpoints: mongoose.Schema.Types.Mixed,
    settings: mongoose.Schema.Types.Mixed,
    limits: {
      maxExecutionsPerHour: { type: Number, default: 100 },
      maxConcurrentExecutions: { type: Number, default: 5 },
      timeout: { type: Number, default: 300000 }
    }
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'maintenance', 'error'], 
    default: 'active',
    index: true
  },
  performance: {
    executions: { type: Number, default: 0 },
    successfulExecutions: { type: Number, default: 0 },
    failedExecutions: { type: Number, default: 0 },
    averageExecutionTime: { type: Number, default: 0 },
    lastExecution: { type: Date },
    uptime: { type: Number, default: 0 }
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  project: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project',
    index: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for success rate
agentSchema.virtual('successRate').get(function() {
  if (this.performance.executions === 0) return 0;
  return (this.performance.successfulExecutions / this.performance.executions) * 100;
});

// Indexes for better performance
agentSchema.index({ user: 1, status: 1 });
agentSchema.index({ type: 1, status: 1 });
agentSchema.index({ 'workflow.steps.type': 1 });

// Methods
agentSchema.methods.executeWorkflow = async function(context = {}) {
  const toolService = require('../services/toolService');
  const workflowService = require('../services/workflowService');
  
  try {
    this.performance.executions += 1;
    this.performance.lastExecution = new Date();
    await this.save();
    
    const result = await workflowService.orchestrate(this.workflow, {
      agent: this,
      context,
      userId: this.user
    });
    
    this.performance.successfulExecutions += 1;
    await this.save();
    
    return result;
  } catch (error) {
    this.performance.failedExecutions += 1;
    await this.save();
    throw error;
  }
};

agentSchema.methods.executeStep = async function(stepId, context = {}) {
  const toolService = require('../services/toolService');
  
  const step = this.workflow.steps.find(s => s.id === stepId);
  if (!step) {
    throw new Error(`Step ${stepId} not found`);
  }
  
  return await toolService.executeTool(step.type, step.parameters, {
    agent: this,
    step,
    context
  });
};

agentSchema.methods.executeAIGeneration = async function(prompt, options = {}) {
  const aiService = require('../services/aiService');
  
  return await aiService.generateCode(prompt, {
    ...options,
    agent: this
  });
};

agentSchema.methods.executeCodeAnalysis = async function(code, options = {}) {
  const aiService = require('../services/aiService');
  
  return await aiService.reviewCode(code, {
    ...options,
    agent: this
  });
};

agentSchema.methods.executeFileOperation = async function(operation, parameters) {
  const fileService = require('../services/fileService');
  
  return await fileService[operation](parameters);
};

agentSchema.methods.executeGitOperation = async function(operation, parameters) {
  const gitService = require('../services/gitService');
  
  return await gitService[operation](parameters);
};

agentSchema.methods.executeDatabaseOperation = async function(operation, parameters) {
  const databaseService = require('../services/databaseService');
  
  return await databaseService[operation](parameters);
};

agentSchema.methods.executeDeployment = async function(provider, configuration) {
  const deploymentService = require('../services/deploymentService');
  
  return await deploymentService.deploy(provider, 'production', configuration, {
    agent: this
  });
};

agentSchema.methods.executeTesting = async function(testType, testFiles, configuration) {
  const testingService = require('../services/testingService');
  
  return await testingService.runTests(testType, testFiles, configuration, {
    agent: this
  });
};

// Static methods
agentSchema.statics.findByType = function(type) {
  return this.find({ type, status: 'active' });
};

agentSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).populate('project');
};

agentSchema.statics.findByProject = function(projectId) {
  return this.find({ project: projectId, status: 'active' });
};

// Pre-save middleware
agentSchema.pre('save', function(next) {
  if (this.isModified('workflow.steps')) {
    // Validate workflow steps
    for (const step of this.workflow.steps) {
      if (!step.id || !step.name || !step.type) {
        return next(new Error('Invalid workflow step: missing required fields'));
      }
    }
  }
  next();
});

module.exports = mongoose.model('Agent', agentSchema);