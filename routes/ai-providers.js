const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Demo AI providers data
const demoProviders = [
  {
    id: 'provider_1',
    name: 'openai',
    displayName: 'OpenAI GPT-4',
    isActive: true,
    priority: 1,
    models: [
      { id: 'gpt-4', name: 'GPT-4', category: 'chat', description: 'Most capable GPT-4 model' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', category: 'chat', description: 'Fast and efficient' }
    ],
    usage: {
      totalRequests: 1250,
      totalTokens: 450000,
      totalCost: 12.50
    }
  },
  {
    id: 'provider_2',
    name: 'anthropic',
    displayName: 'Anthropic Claude',
    isActive: true,
    priority: 2,
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus', category: 'chat', description: 'Most powerful Claude model' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', category: 'chat', description: 'Balanced performance' }
    ],
    usage: {
      totalRequests: 890,
      totalTokens: 320000,
      totalCost: 8.90
    }
  }
];

// Get all AI providers
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: { providers: demoProviders }
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI providers'
    });
  }
});

// Get all models
router.get('/models/all', async (req, res) => {
  try {
    const allModels = [];
    const modelsByCategory = {};

    demoProviders.forEach(provider => {
      provider.models.forEach(model => {
        const modelWithProvider = {
          ...model,
          provider: provider.name,
          providerId: provider.id
        };
        allModels.push(modelWithProvider);

        if (!modelsByCategory[model.category]) {
          modelsByCategory[model.category] = [];
        }
        modelsByCategory[model.category].push(modelWithProvider);
      });
    });

    res.json({
      success: true,
      data: {
        models: allModels,
        modelsByCategory
      }
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models'
    });
  }
});

// Add new AI provider
router.post('/', [
  body('name').trim().notEmpty().withMessage('Provider name is required'),
  body('displayName').trim().notEmpty().withMessage('Display name is required'),
  body('apiKey').trim().notEmpty().withMessage('API key is required'),
  body('baseUrl').optional().isURL().withMessage('Invalid base URL'),
  body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, displayName, apiKey, baseUrl, priority = 3 } = req.body;

    const newProvider = {
      id: 'provider_' + Date.now(),
      name,
      displayName,
      isActive: true,
      priority,
      models: [],
      usage: {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0
      }
    };

    demoProviders.push(newProvider);

    res.status(201).json({
      success: true,
      message: 'AI provider added successfully',
      data: { provider: newProvider }
    });
  } catch (error) {
    console.error('Add provider error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add AI provider'
    });
  }
});

// Update AI provider
router.put('/:id', [
  body('displayName').optional().trim().notEmpty(),
  body('apiKey').optional().trim().notEmpty(),
  body('baseUrl').optional().isURL(),
  body('priority').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const providerIndex = demoProviders.findIndex(p => p.id === req.params.id);
    
    if (providerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'AI provider not found'
      });
    }

    const updates = req.body;
    demoProviders[providerIndex] = {
      ...demoProviders[providerIndex],
      ...updates
    };

    res.json({
      success: true,
      message: 'AI provider updated successfully',
      data: { provider: demoProviders[providerIndex] }
    });
  } catch (error) {
    console.error('Update provider error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update AI provider'
    });
  }
});

// Delete AI provider
router.delete('/:id', async (req, res) => {
  try {
    const providerIndex = demoProviders.findIndex(p => p.id === req.params.id);
    
    if (providerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'AI provider not found'
      });
    }

    demoProviders.splice(providerIndex, 1);

    res.json({
      success: true,
      message: 'AI provider deleted successfully'
    });
  } catch (error) {
    console.error('Delete provider error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete AI provider'
    });
  }
});

// Test AI provider
router.post('/:id/test', async (req, res) => {
  try {
    const provider = demoProviders.find(p => p.id === req.params.id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'AI provider not found'
      });
    }

    // Simulate test
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      success: true,
      data: {
        success: true,
        responseTime: Math.random() * 1000 + 500,
        message: 'Provider test successful'
      }
    });
  } catch (error) {
    console.error('Test provider error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test AI provider'
    });
  }
});

module.exports = router;