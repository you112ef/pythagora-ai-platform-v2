const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const Agent = require('../models/Agent');
const toolService = require('./toolService');
const aiService = require('./aiService');

class WorkflowService extends EventEmitter {
  constructor() {
    super();
    this.activeWorkflows = new Map();
    this.workflowTemplates = new Map();
    this.initializeTemplates();
  }

  initializeTemplates() {
    // Capy.ai Development Workflow
    this.workflowTemplates.set('capy_development', {
      id: 'capy_development',
      name: 'Capy.ai Development Workflow',
      description: 'Complete development workflow using Capy.ai capabilities',
      steps: [
        {
          id: 'analyze_requirements',
          name: 'Analyze Requirements',
          type: 'ai_generation',
          parameters: {
            prompt: 'Analyze the project requirements and create a development plan',
            model: 'gpt-4',
            context: 'project_analysis'
          },
          dependencies: [],
          timeout: 60000,
          retryCount: 3
        },
        {
          id: 'generate_architecture',
          name: 'Generate Architecture',
          type: 'ai_generation',
          parameters: {
            prompt: 'Design the system architecture based on requirements',
            model: 'gpt-4',
            context: 'architecture_design'
          },
          dependencies: ['analyze_requirements'],
          timeout: 90000,
          retryCount: 2
        },
        {
          id: 'generate_code',
          name: 'Generate Code',
          type: 'ai_generation',
          parameters: {
            prompt: 'Generate the initial code structure',
            model: 'gpt-4',
            context: 'code_generation'
          },
          dependencies: ['generate_architecture'],
          timeout: 120000,
          retryCount: 3
        },
        {
          id: 'setup_git',
          name: 'Setup Git Repository',
          type: 'git_operation',
          parameters: {
            operation: 'init',
            repository: 'project_repo'
          },
          dependencies: ['generate_code'],
          timeout: 30000,
          retryCount: 2
        },
        {
          id: 'run_tests',
          name: 'Run Tests',
          type: 'testing',
          parameters: {
            testType: 'jest',
            testFiles: ['**/*.test.js'],
            coverage: true
          },
          dependencies: ['setup_git'],
          timeout: 180000,
          retryCount: 2
        },
        {
          id: 'deploy_application',
          name: 'Deploy Application',
          type: 'deployment',
          parameters: {
            provider: 'vercel',
            environment: 'production',
            configuration: {
              buildCommand: 'npm run build',
              outputDirectory: 'dist'
            }
          },
          dependencies: ['run_tests'],
          timeout: 300000,
          retryCount: 2
        }
      ],
      triggers: [
        {
          type: 'manual',
          configuration: {
            name: 'Start Development',
            description: 'Manually trigger the development workflow'
          }
        }
      ],
      errorHandling: {
        strategy: 'retry',
        maxRetries: 3,
        fallbackAction: 'notify_admin',
        notificationOnError: true
      }
    });

    // Same.new UI Development Workflow
    this.workflowTemplates.set('same_ui_development', {
      id: 'same_ui_development',
      name: 'Same.new UI Development Workflow',
      description: 'UI development workflow using Same.new capabilities',
      steps: [
        {
          id: 'analyze_design_requirements',
          name: 'Analyze Design Requirements',
          type: 'ai_generation',
          parameters: {
            prompt: 'Analyze UI/UX requirements and create design specifications',
            model: 'gpt-4',
            context: 'design_analysis'
          },
          dependencies: [],
          timeout: 60000,
          retryCount: 3
        },
        {
          id: 'generate_design_system',
          name: 'Generate Design System',
          type: 'ui_generation',
          parameters: {
            tool: 'same_design_system',
            brand: 'modern',
            colors: ['primary', 'secondary', 'accent'],
            typography: 'inter'
          },
          dependencies: ['analyze_design_requirements'],
          timeout: 90000,
          retryCount: 2
        },
        {
          id: 'generate_components',
          name: 'Generate UI Components',
          type: 'ui_generation',
          parameters: {
            tool: 'same_ui_generation',
            framework: 'react',
            style: 'modern',
            components: ['button', 'input', 'card', 'modal']
          },
          dependencies: ['generate_design_system'],
          timeout: 120000,
          retryCount: 3
        },
        {
          id: 'generate_responsive_layouts',
          name: 'Generate Responsive Layouts',
          type: 'ui_generation',
          parameters: {
            tool: 'same_responsive_design',
            breakpoints: ['mobile', 'tablet', 'desktop'],
            layout: 'grid'
          },
          dependencies: ['generate_components'],
          timeout: 90000,
          retryCount: 2
        },
        {
          id: 'test_ui_components',
          name: 'Test UI Components',
          type: 'testing',
          parameters: {
            testType: 'cypress',
            testFiles: ['**/*.cy.js'],
            headless: true
          },
          dependencies: ['generate_responsive_layouts'],
          timeout: 180000,
          retryCount: 2
        }
      ],
      triggers: [
        {
          type: 'manual',
          configuration: {
            name: 'Start UI Development',
            description: 'Manually trigger the UI development workflow'
          }
        }
      ],
      errorHandling: {
        strategy: 'retry',
        maxRetries: 2,
        fallbackAction: 'regenerate_component',
        notificationOnError: true
      }
    });

    // Kilo Agent Task Management Workflow
    this.workflowTemplates.set('kilo_task_management', {
      id: 'kilo_task_management',
      name: 'Kilo Agent Task Management Workflow',
      description: 'Task management and project planning workflow',
      steps: [
        {
          id: 'analyze_project_scope',
          name: 'Analyze Project Scope',
          type: 'ai_generation',
          parameters: {
            prompt: 'Analyze project scope and break down into manageable tasks',
            model: 'gpt-4',
            context: 'project_planning'
          },
          dependencies: [],
          timeout: 60000,
          retryCount: 3
        },
        {
          id: 'create_task_breakdown',
          name: 'Create Task Breakdown',
          type: 'task_management',
          parameters: {
            tool: 'kilo_task_management',
            action: 'create',
            project: 'current_project'
          },
          dependencies: ['analyze_project_scope'],
          timeout: 45000,
          retryCount: 2
        },
        {
          id: 'assign_priorities',
          name: 'Assign Priorities',
          type: 'ai_generation',
          parameters: {
            prompt: 'Assign priorities and dependencies to tasks',
            model: 'gpt-4',
            context: 'task_prioritization'
          },
          dependencies: ['create_task_breakdown'],
          timeout: 30000,
          retryCount: 2
        },
        {
          id: 'create_project_plan',
          name: 'Create Project Plan',
          type: 'task_management',
          parameters: {
            tool: 'kilo_project_planning',
            milestones: ['milestone1', 'milestone2', 'milestone3'],
            timeline: '3 months'
          },
          dependencies: ['assign_priorities'],
          timeout: 60000,
          retryCount: 2
        },
        {
          id: 'setup_progress_tracking',
          name: 'Setup Progress Tracking',
          type: 'task_management',
          parameters: {
            tool: 'kilo_progress_tracking',
            metrics: ['completion_rate', 'velocity', 'burndown']
          },
          dependencies: ['create_project_plan'],
          timeout: 30000,
          retryCount: 2
        }
      ],
      triggers: [
        {
          type: 'manual',
          configuration: {
            name: 'Start Task Management',
            description: 'Manually trigger the task management workflow'
          }
        },
        {
          type: 'scheduled',
          configuration: {
            schedule: '0 9 * * 1', // Every Monday at 9 AM
            name: 'Weekly Task Review'
          }
        }
      ],
      errorHandling: {
        strategy: 'retry',
        maxRetries: 2,
        fallbackAction: 'manual_review',
        notificationOnError: true
      }
    });

    // Cline Code Editing Workflow
    this.workflowTemplates.set('cline_code_editing', {
      id: 'cline_code_editing',
      name: 'Cline Code Editing Workflow',
      description: 'Code editing and refactoring workflow using Cline',
      steps: [
        {
          id: 'analyze_codebase',
          name: 'Analyze Codebase',
          type: 'code_analysis',
          parameters: {
            tool: 'cline_code_review',
            language: 'javascript',
            standards: 'eslint'
          },
          dependencies: [],
          timeout: 120000,
          retryCount: 2
        },
        {
          id: 'identify_issues',
          name: 'Identify Issues',
          type: 'ai_generation',
          parameters: {
            prompt: 'Identify code quality issues and improvement opportunities',
            model: 'gpt-4',
            context: 'code_analysis'
          },
          dependencies: ['analyze_codebase'],
          timeout: 90000,
          retryCount: 2
        },
        {
          id: 'refactor_code',
          name: 'Refactor Code',
          type: 'code_editing',
          parameters: {
            tool: 'cline_refactoring',
            refactoringType: 'comprehensive',
            options: {
              improveReadability: true,
              optimizePerformance: true,
              fixBugs: true
            }
          },
          dependencies: ['identify_issues'],
          timeout: 180000,
          retryCount: 3
        },
        {
          id: 'edit_code',
          name: 'Edit Code',
          type: 'code_editing',
          parameters: {
            tool: 'cline_code_editing',
            operation: 'improve',
            options: {
              addComments: true,
              improveStructure: true,
              fixLinting: true
            }
          },
          dependencies: ['refactor_code'],
          timeout: 150000,
          retryCount: 2
        },
        {
          id: 'final_review',
          name: 'Final Code Review',
          type: 'code_analysis',
          parameters: {
            tool: 'cline_code_review',
            language: 'javascript',
            standards: 'eslint'
          },
          dependencies: ['edit_code'],
          timeout: 90000,
          retryCount: 2
        }
      ],
      triggers: [
        {
          type: 'manual',
          configuration: {
            name: 'Start Code Editing',
            description: 'Manually trigger the code editing workflow'
          }
        },
        {
          type: 'webhook',
          configuration: {
            url: '/webhooks/code-changes',
            name: 'Code Change Trigger'
          }
        }
      ],
      errorHandling: {
        strategy: 'retry',
        maxRetries: 3,
        fallbackAction: 'revert_changes',
        notificationOnError: true
      }
    });

    // AI Assistant Complete Workflow
    this.workflowTemplates.set('ai_assistant_complete', {
      id: 'ai_assistant_complete',
      name: 'AI Assistant Complete Workflow',
      description: 'Complete development workflow using AI Assistant capabilities',
      steps: [
        {
          id: 'comprehensive_analysis',
          name: 'Comprehensive Analysis',
          type: 'code_analysis',
          parameters: {
            tool: 'assistant_code_analysis',
            analysisType: 'comprehensive',
            language: 'javascript'
          },
          dependencies: [],
          timeout: 120000,
          retryCount: 2
        },
        {
          id: 'generate_documentation',
          name: 'Generate Documentation',
          type: 'ai_generation',
          parameters: {
            tool: 'assistant_documentation',
            format: 'markdown',
            style: 'comprehensive'
          },
          dependencies: ['comprehensive_analysis'],
          timeout: 90000,
          retryCount: 2
        },
        {
          id: 'debug_issues',
          name: 'Debug Issues',
          type: 'code_analysis',
          parameters: {
            tool: 'assistant_debugging',
            context: 'production_issues'
          },
          dependencies: ['generate_documentation'],
          timeout: 120000,
          retryCount: 3
        },
        {
          id: 'optimize_performance',
          name: 'Optimize Performance',
          type: 'ai_generation',
          parameters: {
            prompt: 'Analyze and optimize code performance',
            model: 'gpt-4',
            context: 'performance_optimization'
          },
          dependencies: ['debug_issues'],
          timeout: 150000,
          retryCount: 2
        },
        {
          id: 'security_audit',
          name: 'Security Audit',
          type: 'ai_generation',
          parameters: {
            prompt: 'Perform security audit and identify vulnerabilities',
            model: 'gpt-4',
            context: 'security_analysis'
          },
          dependencies: ['optimize_performance'],
          timeout: 120000,
          retryCount: 2
        },
        {
          id: 'final_validation',
          name: 'Final Validation',
          type: 'testing',
          parameters: {
            testType: 'jest',
            testFiles: ['**/*.test.js'],
            coverage: true,
            verbose: true
          },
          dependencies: ['security_audit'],
          timeout: 180000,
          retryCount: 2
        }
      ],
      triggers: [
        {
          type: 'manual',
          configuration: {
            name: 'Start Complete Analysis',
            description: 'Manually trigger the complete analysis workflow'
          }
        },
        {
          type: 'scheduled',
          configuration: {
            schedule: '0 2 * * 0', // Every Sunday at 2 AM
            name: 'Weekly Complete Analysis'
          }
        }
      ],
      errorHandling: {
        strategy: 'retry',
        maxRetries: 3,
        fallbackAction: 'escalate_to_human',
        notificationOnError: true
      }
    });
  }

  async orchestrate(workflow, options = {}) {
    const workflowId = uuidv4();
    const startTime = Date.now();

    try {
      this.addLog(workflowId, `Starting workflow: ${workflow.name || workflow.id}`);
      
      const workflowInstance = {
        id: workflowId,
        workflow,
        status: 'running',
        startTime: new Date(startTime),
        executedSteps: new Set(),
        results: {},
        context: options.context || {},
        options
      };

      this.activeWorkflows.set(workflowId, workflowInstance);
      this.emit('workflowStarted', workflowInstance);

      // Execute workflow steps
      const result = await this.executeWorkflowSteps(workflowInstance);

      const duration = Date.now() - startTime;
      workflowInstance.status = 'completed';
      workflowInstance.endTime = new Date();
      workflowInstance.duration = duration;

      this.addLog(workflowId, `Workflow completed successfully in ${duration}ms`);
      this.emit('workflowCompleted', workflowInstance);

      return {
        success: true,
        workflowId,
        duration,
        result
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      const workflowInstance = this.activeWorkflows.get(workflowId);
      if (workflowInstance) {
        workflowInstance.status = 'failed';
        workflowInstance.endTime = new Date();
        workflowInstance.duration = duration;
        workflowInstance.error = error.message;
      }

      this.addLog(workflowId, `Workflow failed: ${error.message}`);
      this.emit('workflowError', { workflowId, error: error.message, duration });

      return {
        success: false,
        workflowId,
        duration,
        error: error.message
      };
    }
  }

  async executeWorkflowSteps(workflowInstance) {
    const { workflow, context, executedSteps, results } = workflowInstance;
    const steps = workflow.steps || [];

    for (const step of steps) {
      if (!this.canExecuteStep(step, executedSteps)) {
        this.addLog(workflowInstance.id, `Skipping step ${step.id} - dependencies not met`);
        continue;
      }

      try {
        this.addLog(workflowInstance.id, `Executing step: ${step.name}`);
        
        const stepResult = await this.executeStep(step, context, results);
        results[step.id] = stepResult;
        executedSteps.add(step.id);

        this.addLog(workflowInstance.id, `Step ${step.name} completed successfully`);
        this.emit('workflowStepCompleted', {
          workflowId: workflowInstance.id,
          stepId: step.id,
          result: stepResult
        });

      } catch (error) {
        this.addLog(workflowInstance.id, `Step ${step.name} failed: ${error.message}`);
        
        const handled = await this.handleStepError(step, error, workflowInstance);
        if (!handled) {
          throw error;
        }
      }
    }

    return results;
  }

  async executeStep(step, context, previousResults) {
    const stepContext = this.buildStepContext(step, context, previousResults);

    switch (step.type) {
      case 'ai_generation':
        return await this.executeAIStep(step, stepContext);
      case 'code_analysis':
        return await this.executeCodeAnalysisStep(step, stepContext);
      case 'file_operation':
        return await this.executeFileOperationStep(step, stepContext);
      case 'git_operation':
        return await this.executeGitOperationStep(step, stepContext);
      case 'deployment':
        return await this.executeDeploymentStep(step, stepContext);
      case 'testing':
        return await this.executeTestingStep(step, stepContext);
      case 'api_call':
        return await this.executeAPICallStep(step, stepContext);
      case 'database_operation':
        return await this.executeDatabaseOperationStep(step, stepContext);
      case 'custom':
        return await this.executeCustomStep(step, stepContext);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  async executeAIStep(step, context) {
    const { prompt, model, ...options } = step.parameters;
    
    // Build enhanced prompt with context
    const enhancedPrompt = this.buildPrompt(prompt, context);
    
    const result = await aiService.generateCode(enhancedPrompt, {
      model: model || 'gpt-4',
      ...options,
      context
    });

    return {
      type: 'ai_generation',
      prompt: enhancedPrompt,
      model: model || 'gpt-4',
      result,
      timestamp: new Date()
    };
  }

  async executeCodeAnalysisStep(step, context) {
    const { tool, ...parameters } = step.parameters;
    
    const result = await toolService.executeTool(tool, parameters, context);
    
    return {
      type: 'code_analysis',
      tool,
      result,
      timestamp: new Date()
    };
  }

  async executeFileOperationStep(step, context) {
    const { operation, ...parameters } = step.parameters;
    
    const result = await toolService.executeTool('real_file_operations', {
      operation,
      ...parameters
    }, context);
    
    return {
      type: 'file_operation',
      operation,
      result,
      timestamp: new Date()
    };
  }

  async executeGitOperationStep(step, context) {
    const { operation, ...parameters } = step.parameters;
    
    const result = await toolService.executeTool('real_git_operations', {
      operation,
      ...parameters
    }, context);
    
    return {
      type: 'git_operation',
      operation,
      result,
      timestamp: new Date()
    };
  }

  async executeDeploymentStep(step, context) {
    const { provider, environment, configuration } = step.parameters;
    
    const result = await toolService.executeTool('real_deployment', {
      provider,
      environment,
      configuration
    }, context);
    
    return {
      type: 'deployment',
      provider,
      environment,
      result,
      timestamp: new Date()
    };
  }

  async executeTestingStep(step, context) {
    const { testType, testFiles, configuration } = step.parameters;
    
    const result = await toolService.executeTool('real_testing', {
      testType,
      testFiles,
      configuration
    }, context);
    
    return {
      type: 'testing',
      testType,
      result,
      timestamp: new Date()
    };
  }

  async executeAPICallStep(step, context) {
    const { url, method, headers, body } = step.parameters;
    
    const axios = require('axios');
    const result = await axios({
      method: method || 'GET',
      url,
      headers: headers || {},
      data: body
    });
    
    return {
      type: 'api_call',
      url,
      method: method || 'GET',
      status: result.status,
      data: result.data,
      timestamp: new Date()
    };
  }

  async executeDatabaseOperationStep(step, context) {
    const { operation, ...parameters } = step.parameters;
    
    const result = await toolService.executeTool('real_database_operations', {
      operation,
      ...parameters
    }, context);
    
    return {
      type: 'database_operation',
      operation,
      result,
      timestamp: new Date()
    };
  }

  async executeCustomStep(step, context) {
    const { tool, ...parameters } = step.parameters;
    
    const result = await toolService.executeTool(tool, parameters, context);
    
    return {
      type: 'custom',
      tool,
      result,
      timestamp: new Date()
    };
  }

  canExecuteStep(step, executedSteps) {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }
    
    return step.dependencies.every(depId => executedSteps.has(depId));
  }

  buildStepContext(step, context, previousResults) {
    return {
      ...context,
      step,
      previousResults,
      workflowContext: context
    };
  }

  buildPrompt(template, context) {
    let prompt = template;
    
    // Replace placeholders with context values
    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{{${key}}}`;
      if (prompt.includes(placeholder)) {
        prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
      }
    }
    
    return prompt;
  }

  async handleStepError(step, error, workflow) {
    const errorHandling = workflow.workflow.errorHandling || {};
    
    switch (errorHandling.strategy) {
      case 'stop':
        return false; // Don't handle, let it fail
      
      case 'retry':
        if (step.retryCount > 0) {
          step.retryCount--;
          this.addLog(workflow.id, `Retrying step ${step.id}, ${step.retryCount} retries left`);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          try {
            const result = await this.executeStep(step, workflow.context, workflow.results);
            workflow.results[step.id] = result;
            workflow.executedSteps.add(step.id);
            return true;
          } catch (retryError) {
            return await this.handleStepError(step, retryError, workflow);
          }
        }
        break;
      
      case 'skip':
        this.addLog(workflow.id, `Skipping step ${step.id} due to error`);
        return true;
      
      case 'fallback':
        if (errorHandling.fallbackAction) {
          await this.executeFallbackAction(errorHandling.fallbackAction, step, error, workflow);
          return true;
        }
        break;
    }
    
    return false;
  }

  async executeFallbackAction(action, step, error, workflow) {
    this.addLog(workflow.id, `Executing fallback action: ${action}`);
    
    switch (action) {
      case 'notify_admin':
        // Send notification to admin
        this.emit('workflowNotification', {
          type: 'error',
          workflowId: workflow.id,
          stepId: step.id,
          error: error.message
        });
        break;
      
      case 'regenerate_component':
        // Regenerate the component with different parameters
        if (step.type === 'ui_generation') {
          const newParameters = { ...step.parameters, retry: true };
          const result = await this.executeStep({ ...step, parameters: newParameters }, workflow.context, workflow.results);
          workflow.results[step.id] = result;
          workflow.executedSteps.add(step.id);
        }
        break;
      
      case 'revert_changes':
        // Revert any changes made
        this.emit('workflowRevert', {
          workflowId: workflow.id,
          stepId: step.id
        });
        break;
      
      case 'escalate_to_human':
        // Escalate to human intervention
        this.emit('workflowEscalation', {
          workflowId: workflow.id,
          stepId: step.id,
          error: error.message
        });
        break;
    }
  }

  // Workflow management methods
  addLog(workflowId, message) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      if (!workflow.logs) {
        workflow.logs = [];
      }
      workflow.logs.push({
        timestamp: new Date(),
        message
      });
    }
  }

  getWorkflow(workflowId) {
    return this.activeWorkflows.get(workflowId);
  }

  getAllWorkflows() {
    return Array.from(this.activeWorkflows.values());
  }

  getWorkflowsByStatus(status) {
    return Array.from(this.activeWorkflows.values()).filter(w => w.status === status);
  }

  getWorkflowTemplates() {
    return Array.from(this.workflowTemplates.values());
  }

  async createWorkflowFromTemplate(templateId, customizations = {}) {
    const template = this.workflowTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const workflow = {
      ...template,
      ...customizations,
      id: customizations.id || uuidv4()
    };

    return workflow;
  }

  async stopWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.status = 'stopped';
    workflow.endTime = new Date();
    
    this.addLog(workflowId, 'Workflow stopped by user');
    this.emit('workflowStopped', { workflowId });
    
    return { success: true, workflowId };
  }

  async pauseWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.status = 'paused';
    
    this.addLog(workflowId, 'Workflow paused by user');
    this.emit('workflowPaused', { workflowId });
    
    return { success: true, workflowId };
  }

  async resumeWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (workflow.status !== 'paused') {
      throw new Error(`Workflow ${workflowId} is not paused`);
    }

    workflow.status = 'running';
    
    this.addLog(workflowId, 'Workflow resumed by user');
    this.emit('workflowResumed', { workflowId });
    
    // Continue execution
    this.executeWorkflowSteps(workflow);
    
    return { success: true, workflowId };
  }
}

module.exports = new WorkflowService();