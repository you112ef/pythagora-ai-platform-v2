const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Demo projects data
const demoProjects = [
  {
    _id: 'proj_1',
    name: 'E-commerce Platform',
    description: 'A full-stack e-commerce platform with React frontend and Node.js backend',
    type: 'web-app',
    framework: 'react',
    language: 'javascript',
    status: 'active',
    owner: {
      _id: 'demo_user_123',
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@pythagora.ai'
    },
    collaborators: [],
    totalCollaborators: 0,
    deployment: {
      status: 'deployed',
      url: 'https://demo-ecommerce.pythagora.ai'
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'proj_2',
    name: 'AI Chatbot',
    description: 'Intelligent chatbot using OpenAI GPT-4 for customer support',
    type: 'ai-model',
    framework: 'express',
    language: 'python',
    status: 'active',
    owner: {
      _id: 'demo_user_123',
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@pythagora.ai'
    },
    collaborators: [],
    totalCollaborators: 0,
    deployment: {
      status: 'testing',
      url: null
    },
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'proj_3',
    name: 'Mobile Banking App',
    description: 'Cross-platform mobile banking application with React Native',
    type: 'mobile-app',
    framework: 'react-native',
    language: 'javascript',
    status: 'development',
    owner: {
      _id: 'demo_user_123',
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@pythagora.ai'
    },
    collaborators: [],
    totalCollaborators: 0,
    deployment: {
      status: 'not-deployed',
      url: null
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
];

// Get all projects for user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;

    let filteredProjects = [...demoProjects];

    // Apply filters
    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }
    if (type) {
      filteredProjects = filteredProjects.filter(p => p.type === type);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProjects = filteredProjects.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        projects: paginatedProjects,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredProjects.length / limit),
          totalItems: filteredProjects.length,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = demoProjects.find(p => p._id === req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
});

// Create new project
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
  body('type').isIn(['web-app', 'mobile-app', 'api', 'desktop-app', 'ai-model']).withMessage('Invalid project type'),
  body('framework').optional().trim(),
  body('language').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description, type, framework, language } = req.body;

    const newProject = {
      _id: 'proj_' + Date.now(),
      name,
      description: description || '',
      type,
      framework: framework || 'react',
      language: language || 'javascript',
      status: 'development',
      owner: {
        _id: 'demo_user_123',
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@pythagora.ai'
      },
      collaborators: [],
      totalCollaborators: 0,
      deployment: {
        status: 'not-deployed',
        url: null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    demoProjects.unshift(newProject);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project: newProject }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

// Update project
router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('status').optional().isIn(['development', 'testing', 'active', 'archived']),
  body('type').optional().isIn(['web-app', 'mobile-app', 'api', 'desktop-app', 'ai-model'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const projectIndex = demoProjects.findIndex(p => p._id === req.params.id);
    
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const updates = req.body;
    demoProjects[projectIndex] = {
      ...demoProjects[projectIndex],
      ...updates,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project: demoProjects[projectIndex] }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const projectIndex = demoProjects.findIndex(p => p._id === req.params.id);
    
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    demoProjects.splice(projectIndex, 1);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
});

module.exports = router;