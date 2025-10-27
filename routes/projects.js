const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');

const router = express.Router();

// Get all projects for user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;
    const userId = req.user._id;

    // Build query
    let query = {
      $or: [
        { owner: userId },
        { 'collaborators.user': userId }
      ]
    };

    // Apply filters
    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get projects with pagination
    const [projects, total] = await Promise.all([
      Project.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('owner', 'firstName lastName email')
        .populate('collaborators.user', 'firstName lastName email'),
      Project.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProjects: total,
          projectsPerPage: parseInt(limit)
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

// Get single project by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const project = await Project.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('collaborators.user', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has access to this project
    const hasAccess = project.owner._id.toString() === userId.toString() ||
                     project.collaborators.some(c => c.user._id.toString() === userId.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this project'
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
  body('type').isIn(['web-app', 'mobile-app', 'api', 'ai-model', 'automation', 'other']),
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

    const { name, description, type, framework, language, techStack } = req.body;
    const userId = req.user._id;

    const project = await Project.create({
      name,
      description,
      type,
      framework,
      language,
      techStack: techStack || [],
      owner: userId,
      status: 'development',
      collaborators: [],
      files: [],
      deployment: {
        status: 'not-deployed',
        url: null
      }
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project: populatedProject }
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
  body('type').optional().isIn(['web-app', 'mobile-app', 'api', 'ai-model', 'automation', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user is owner
    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can update the project'
      });
    }

    const allowedUpdates = ['name', 'description', 'status', 'type', 'framework', 'language', 'techStack'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    updates.updatedAt = new Date();

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email')
     .populate('collaborators.user', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject }
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
    const userId = req.user._id;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user is owner
    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can delete the project'
      });
    }

    await Project.findByIdAndDelete(req.params.id);

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

// Add collaborator to project
router.post('/:id/collaborators', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('role').optional().isIn(['viewer', 'editor', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const ownerId = req.user._id;
    const { userId, role = 'editor' } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if requester is owner
    if (project.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can add collaborators'
      });
    }

    // Check if user is already a collaborator
    const existingCollaborator = project.collaborators.find(
      c => c.user.toString() === userId
    );

    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        error: 'User is already a collaborator on this project'
      });
    }

    project.collaborators.push({
      user: userId,
      role,
      addedAt: new Date()
    });

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'firstName lastName email')
      .populate('collaborators.user', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Collaborator added successfully',
      data: { project: updatedProject }
    });

  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add collaborator'
    });
  }
});

// Get project statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has access
    const hasAccess = project.owner.toString() === userId.toString() ||
                     project.collaborators.some(c => c.user.toString() === userId.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this project'
      });
    }

    const stats = {
      filesCount: project.files?.length || 0,
      collaboratorsCount: project.collaborators?.length || 0,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      status: project.status,
      deployment: project.deployment,
      aiUsage: project.aiUsage || { totalRequests: 0, totalTokens: 0 }
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project statistics'
    });
  }
});

module.exports = router;
