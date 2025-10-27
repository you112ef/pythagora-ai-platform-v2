const express = require('express');
const { body, validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const AIProvider = require('../models/AIProvider');

const router = express.Router();

// Get all AI providers
router.get('/', async (req, res) => {
  try {
    const providers = await aiService.getAvailableProviders(req.user.id);
    res.json({
      success: true,
      data: { providers }
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
    const providers = await aiService.getAvailableProviders(req.user.id);
    const allModels = [];
    const modelsByCategory = {};

    providers.forEach(provider => {
      const models = provider.models || [];
      models.forEach(model => {
        const modelWithProvider = {
          ...model,
          provider: provider.name,
          providerId: provider.id,
          isAvailable: model.isAvailable !== false
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
        modelsByCategory,
        totalModels: allModels.length,
        totalCategories: Object.keys(modelsByCategory).length
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
  body('name').trim().notEmpty().withMessage('Provider name is required')
    .isIn(['openai', 'anthropic', 'openrouter', 'custom']).withMessage('Invalid provider name'),
  body('displayName').trim().notEmpty().withMessage('Display name is required'),
  body('apiKey').trim().notEmpty().withMessage('API key is required'),
  body('baseUrl').optional(),
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

    const providerData = {
      ...req.body,
      priority: req.body.priority || 3
    };

    // Set default base URL based on provider type
    if (!providerData.baseUrl) {
      const baseUrls = {
        openrouter: 'https://openrouter.ai/api/v1',
        openai: 'https://api.openai.com/v1',
        anthropic: 'https://api.anthropic.com/v1'
      };
      providerData.baseUrl = baseUrls[providerData.name] || '';
    }

    const provider = await aiService.addProvider(req.user.id, providerData);

    res.status(201).json({
      success: true,
      message: 'AI provider added successfully',
      data: { 
        provider: {
          id: provider._id,
          name: provider.name,
          displayName: provider.displayName,
          isActive: provider.isActive,
          priority: provider.priority,
          models: provider.models,
          usage: provider.usage,
          maskedApiKey: provider.maskedApiKey
        }
      }
    });
  } catch (error) {
    console.error('Add provider error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add AI provider'
    });
  }
});

// Update AI provider
router.put('/:id', [
  body('displayName').optional().trim().notEmpty(),
  body('apiKey').optional().trim().notEmpty(),
  body('baseUrl').optional(),
  body('priority').optional().isInt({ min: 1, max: 5 }),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const provider = await aiService.updateProvider(req.user.id, req.params.id, req.body);

    res.json({
      success: true,
      message: 'AI provider updated successfully',
      data: { 
        provider: {
          id: provider._id,
          name: provider.name,
          displayName: provider.displayName,
          isActive: provider.isActive,
          priority: provider.priority,
          models: provider.models,
          usage: provider.usage,
          maskedApiKey: provider.maskedApiKey
        }
      }
    });
  } catch (error) {
    console.error('Update provider error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update AI provider'
    });
  }
});

// Delete AI provider
router.delete('/:id', async (req, res) => {
  try {
    await aiService.deleteProvider(req.user.id, req.params.id);

    res.json({
      success: true,
      message: 'AI provider deleted successfully'
    });
  } catch (error) {
    console.error('Delete provider error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete AI provider'
    });
  }
});

// Test AI provider
router.post('/:id/test', async (req, res) => {
  try {
    const startTime = Date.now();
    const result = await aiService.testProvider(req.user.id, req.params.id);
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        ...result,
        responseTime
      }
    });
  } catch (error) {
    console.error('Test provider error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test AI provider'
    });
  }
});

module.exports = router;