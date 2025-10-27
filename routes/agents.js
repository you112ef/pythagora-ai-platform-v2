const express = require('express');
const { body, validationResult } = require('express-validator');
const Agent = require('../models/Agent');
const workflowService = require('../services/workflowService');
const toolService = require('../services/toolService');
const router = express.Router();

// Get all agents
router.get('/', async (req, res) => {
  try {
    const { type, status, project } = req.query;
    let query = { user: req.user.id };
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (project) query.project = project;
    
    const agents = await Agent.find(query).populate('project');
    
    res.json({
      success: true,
      agents,
      count: agents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get agent by ID
router.get('/:id', async (req, res) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('project');
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    res.json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new agent
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('type').isIn(['capy', 'same', 'kilo', 'cline', 'assistant', 'custom']).withMessage('Invalid agent type'),
  body('displayName').notEmpty().withMessage('Display name is required'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const agentData = {
      ...req.body,
      user: req.user.id
    };
    
    const agent = new Agent(agentData);
    await agent.save();
    
    res.status(201).json({
      success: true,
      agent
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Agent name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update agent
router.put('/:id', async (req, res) => {
  try {
    const agent = await Agent.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    res.json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete agent
router.delete('/:id', async (req, res) => {
  try {
    const agent = await Agent.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute agent workflow
router.post('/:id/execute', async (req, res) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    if (agent.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Agent is not active'
      });
    }
    
    const context = req.body.context || {};
    const result = await agent.executeWorkflow(context);
    
    res.json({
      success: true,
      result,
      agent: {
        id: agent._id,
        name: agent.name,
        type: agent.type
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test agent
router.post('/:id/test', async (req, res) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    const testContext = req.body.context || {};
    const testResult = await agent.executeWorkflow(testContext);
    
    res.json({
      success: true,
      testResult,
      agent: {
        id: agent._id,
        name: agent.name,
        type: agent.type
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get agent performance
router.get('/:id/performance', async (req, res) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    res.json({
      success: true,
      performance: agent.performance,
      successRate: agent.successRate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update agent capabilities
router.put('/:id/capabilities', [
  body('capabilities').isArray().withMessage('Capabilities must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const agent = await Agent.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { capabilities: req.body.capabilities },
      { new: true, runValidators: true }
    );
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    res.json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update agent tools
router.put('/:id/tools', [
  body('tools').isArray().withMessage('Tools must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const agent = await Agent.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { tools: req.body.tools },
      { new: true, runValidators: true }
    );
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    res.json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update agent workflow
router.put('/:id/workflow', [
  body('workflow').isObject().withMessage('Workflow must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const agent = await Agent.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { workflow: req.body.workflow },
      { new: true, runValidators: true }
    );
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    res.json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available tools
router.get('/tools/available', async (req, res) => {
  try {
    const { category } = req.query;
    
    let tools;
    if (category) {
      tools = toolService.getToolsByCategory(category);
    } else {
      tools = toolService.getAllTools();
    }
    
    res.json({
      success: true,
      tools,
      count: tools.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute tool
router.post('/tools/execute', [
  body('toolId').notEmpty().withMessage('Tool ID is required'),
  body('parameters').isObject().withMessage('Parameters must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { toolId, parameters } = req.body;
    const context = {
      user: req.user,
      ...req.body.context
    };
    
    const result = await toolService.executeTool(toolId, parameters, context);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get workflow templates
router.get('/workflows/templates', async (req, res) => {
  try {
    const templates = workflowService.getWorkflowTemplates();
    
    res.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create workflow from template
router.post('/workflows/from-template', [
  body('templateId').notEmpty().withMessage('Template ID is required'),
  body('customizations').isObject().withMessage('Customizations must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { templateId, customizations } = req.body;
    const workflow = await workflowService.createWorkflowFromTemplate(templateId, customizations);
    
    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute workflow
router.post('/workflows/execute', [
  body('workflow').isObject().withMessage('Workflow is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { workflow, options = {} } = req.body;
    const context = {
      user: req.user,
      ...options.context
    };
    
    const result = await workflowService.orchestrate(workflow, { context, ...options });
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get workflow by ID
router.get('/workflows/:workflowId', async (req, res) => {
  try {
    const workflow = workflowService.getWorkflow(req.params.workflowId);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    
    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stop workflow
router.post('/workflows/:workflowId/stop', async (req, res) => {
  try {
    const result = await workflowService.stopWorkflow(req.params.workflowId);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Pause workflow
router.post('/workflows/:workflowId/pause', async (req, res) => {
  try {
    const result = await workflowService.pauseWorkflow(req.params.workflowId);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resume workflow
router.post('/workflows/:workflowId/resume', async (req, res) => {
  try {
    const result = await workflowService.resumeWorkflow(req.params.workflowId);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all workflows
router.get('/workflows/all', async (req, res) => {
  try {
    const workflows = workflowService.getAllWorkflows();
    
    res.json({
      success: true,
      workflows,
      count: workflows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get workflows by status
router.get('/workflows/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const workflows = workflowService.getWorkflowsByStatus(status);
    
    res.json({
      success: true,
      workflows,
      count: workflows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;