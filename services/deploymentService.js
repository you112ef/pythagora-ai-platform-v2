const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const Docker = require('dockerode');
const execAsync = promisify(exec);

class DeploymentService {
  constructor() {
    this.docker = new Docker();
    this.deployments = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    this.providers = {
      vercel: {
        name: 'Vercel',
        type: 'serverless',
        supported: true,
        cli: 'vercel',
        config: {
          token: process.env.VERCEL_TOKEN,
          teamId: process.env.VERCEL_TEAM_ID
        }
      },
      netlify: {
        name: 'Netlify',
        type: 'static',
        supported: true,
        cli: 'netlify',
        config: {
          token: process.env.NETLIFY_TOKEN,
          siteId: process.env.NETLIFY_SITE_ID
        }
      },
      heroku: {
        name: 'Heroku',
        type: 'container',
        supported: true,
        cli: 'heroku',
        config: {
          apiKey: process.env.HEROKU_API_KEY,
          appName: process.env.HEROKU_APP_NAME
        }
      },
      aws: {
        name: 'AWS',
        type: 'cloud',
        supported: true,
        cli: 'aws',
        config: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1'
        }
      },
      docker: {
        name: 'Docker',
        type: 'container',
        supported: true,
        cli: 'docker',
        config: {}
      },
      kubernetes: {
        name: 'Kubernetes',
        type: 'orchestration',
        supported: true,
        cli: 'kubectl',
        config: {
          kubeconfig: process.env.KUBECONFIG
        }
      }
    };
  }

  async deploy(provider, environment, configuration, context = {}) {
    const deploymentId = this.generateDeploymentId();
    const startTime = Date.now();

    try {
      this.addLog(deploymentId, `Starting deployment to ${provider} (${environment})`);
      
      // Check if provider is supported
      if (!this.providers[provider]?.supported) {
        throw new Error(`Provider ${provider} is not supported`);
      }

      // Ensure required CLIs are available
      await this.ensureCLIs(provider);

      let result;
      switch (provider) {
        case 'vercel':
          result = await this.deployToVercel(environment, configuration, context);
          break;
        case 'netlify':
          result = await this.deployToNetlify(environment, configuration, context);
          break;
        case 'heroku':
          result = await this.deployToHeroku(environment, configuration, context);
          break;
        case 'aws':
          result = await this.deployToAWS(environment, configuration, context);
          break;
        case 'docker':
          result = await this.deployWithDocker(environment, configuration, context);
          break;
        case 'kubernetes':
          result = await this.deployToKubernetes(environment, configuration, context);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      const duration = Date.now() - startTime;
      
      this.deployments.set(deploymentId, {
        id: deploymentId,
        provider,
        environment,
        status: 'completed',
        startTime: new Date(startTime),
        endTime: new Date(),
        duration,
        configuration,
        result,
        logs: this.getLogs(deploymentId)
      });

      this.addLog(deploymentId, `Deployment completed successfully in ${duration}ms`);
      
      return {
        success: true,
        deploymentId,
        provider,
        environment,
        duration,
        result
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.deployments.set(deploymentId, {
        id: deploymentId,
        provider,
        environment,
        status: 'failed',
        startTime: new Date(startTime),
        endTime: new Date(),
        duration,
        configuration,
        error: error.message,
        logs: this.getLogs(deploymentId)
      });

      this.addLog(deploymentId, `Deployment failed: ${error.message}`);
      
      return {
        success: false,
        deploymentId,
        provider,
        environment,
        duration,
        error: error.message
      };
    }
  }

  async deployToVercel(environment, configuration, context) {
    const { projectPath, buildCommand, outputDirectory } = configuration;
    
    this.addLog(context.deploymentId, 'Deploying to Vercel...');
    
    // Check if Vercel CLI is installed
    try {
      await execAsync('vercel --version');
    } catch (error) {
      throw new Error('Vercel CLI not found. Please install it: npm i -g vercel');
    }

    // Login to Vercel
    if (process.env.VERCEL_TOKEN) {
      await execAsync(`vercel login --token ${process.env.VERCEL_TOKEN}`);
    }

    // Deploy
    const command = `cd ${projectPath} && vercel --prod --yes`;
    const { stdout, stderr } = await execAsync(command);
    
    // Parse deployment URL from output
    const urlMatch = stdout.match(/https:\/\/[^\s]+/);
    const deploymentUrl = urlMatch ? urlMatch[0] : null;
    
    return {
      url: deploymentUrl,
      provider: 'vercel',
      environment,
      logs: stdout,
      errors: stderr
    };
  }

  async deployToNetlify(environment, configuration, context) {
    const { projectPath, buildCommand, outputDirectory } = configuration;
    
    this.addLog(context.deploymentId, 'Deploying to Netlify...');
    
    // Check if Netlify CLI is installed
    try {
      await execAsync('netlify --version');
    } catch (error) {
      throw new Error('Netlify CLI not found. Please install it: npm i -g netlify-cli');
    }

    // Login to Netlify
    if (process.env.NETLIFY_TOKEN) {
      await execAsync(`netlify login --token ${process.env.NETLIFY_TOKEN}`);
    }

    // Build if build command provided
    if (buildCommand) {
      this.addLog(context.deploymentId, `Building project: ${buildCommand}`);
      await execAsync(`cd ${projectPath} && ${buildCommand}`);
    }

    // Deploy
    const deployCommand = `cd ${projectPath} && netlify deploy --prod --dir=${outputDirectory || 'dist'}`;
    const { stdout, stderr } = await execAsync(deployCommand);
    
    // Parse deployment URL from output
    const urlMatch = stdout.match(/https:\/\/[^\s]+/);
    const deploymentUrl = urlMatch ? urlMatch[0] : null;
    
    return {
      url: deploymentUrl,
      provider: 'netlify',
      environment,
      logs: stdout,
      errors: stderr
    };
  }

  async deployToHeroku(environment, configuration, context) {
    const { projectPath, appName, buildpacks } = configuration;
    
    this.addLog(context.deploymentId, 'Deploying to Heroku...');
    
    // Check if Heroku CLI is installed
    try {
      await execAsync('heroku --version');
    } catch (error) {
      throw new Error('Heroku CLI not found. Please install it: https://devcenter.heroku.com/articles/heroku-cli');
    }

    // Login to Heroku
    if (process.env.HEROKU_API_KEY) {
      await execAsync(`echo "${process.env.HEROKU_API_KEY}" | heroku auth:token`);
    }

    // Create app if it doesn't exist
    if (appName) {
      try {
        await execAsync(`heroku apps:info ${appName}`);
      } catch (error) {
        this.addLog(context.deploymentId, `Creating Heroku app: ${appName}`);
        await execAsync(`heroku create ${appName}`);
      }
    }

    // Set buildpacks
    if (buildpacks && buildpacks.length > 0) {
      for (const buildpack of buildpacks) {
        await execAsync(`heroku buildpacks:add ${buildpack} -a ${appName}`);
      }
    }

    // Deploy
    const deployCommand = `cd ${projectPath} && git push heroku main`;
    const { stdout, stderr } = await execAsync(deployCommand);
    
    const appUrl = `https://${appName}.herokuapp.com`;
    
    return {
      url: appUrl,
      provider: 'heroku',
      environment,
      appName,
      logs: stdout,
      errors: stderr
    };
  }

  async deployToAWS(environment, configuration, context) {
    const { service, region, configuration: awsConfig } = configuration;
    
    this.addLog(context.deploymentId, `Deploying to AWS ${service}...`);
    
    // Check if AWS CLI is installed
    try {
      await execAsync('aws --version');
    } catch (error) {
      throw new Error('AWS CLI not found. Please install it: https://aws.amazon.com/cli/');
    }

    // Configure AWS credentials
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      await execAsync(`aws configure set aws_access_key_id ${process.env.AWS_ACCESS_KEY_ID}`);
      await execAsync(`aws configure set aws_secret_access_key ${process.env.AWS_SECRET_ACCESS_KEY}`);
      await execAsync(`aws configure set default.region ${region || 'us-east-1'}`);
    }

    let result;
    switch (service) {
      case 's3':
        result = await this.deployToS3(awsConfig, context);
        break;
      case 'lambda':
        result = await this.deployToLambda(awsConfig, context);
        break;
      case 'ec2':
        result = await this.deployToEC2(awsConfig, context);
        break;
      case 'elastic-beanstalk':
        result = await this.deployToElasticBeanstalk(awsConfig, context);
        break;
      default:
        throw new Error(`Unsupported AWS service: ${service}`);
    }

    return {
      ...result,
      provider: 'aws',
      service,
      environment
    };
  }

  async deployToS3(config, context) {
    const { bucketName, sourcePath, region } = config;
    
    this.addLog(context.deploymentId, `Deploying to S3 bucket: ${bucketName}`);
    
    // Sync files to S3
    const syncCommand = `aws s3 sync ${sourcePath} s3://${bucketName} --region ${region || 'us-east-1'}`;
    const { stdout, stderr } = await execAsync(syncCommand);
    
    const websiteUrl = `https://${bucketName}.s3-website-${region || 'us-east-1'}.amazonaws.com`;
    
    return {
      url: websiteUrl,
      bucketName,
      logs: stdout,
      errors: stderr
    };
  }

  async deployToLambda(config, context) {
    const { functionName, sourcePath, runtime, handler } = config;
    
    this.addLog(context.deploymentId, `Deploying Lambda function: ${functionName}`);
    
    // Create deployment package
    const packageCommand = `cd ${sourcePath} && zip -r function.zip .`;
    await execAsync(packageCommand);
    
    // Update function code
    const updateCommand = `aws lambda update-function-code --function-name ${functionName} --zip-file fileb://function.zip`;
    const { stdout, stderr } = await execAsync(updateCommand);
    
    return {
      functionName,
      logs: stdout,
      errors: stderr
    };
  }

  async deployToEC2(config, context) {
    const { instanceId, sourcePath, deployScript } = config;
    
    this.addLog(context.deploymentId, `Deploying to EC2 instance: ${instanceId}`);
    
    // Copy files to EC2 instance
    const copyCommand = `scp -r ${sourcePath}/* ec2-user@${instanceId}:~/app/`;
    await execAsync(copyCommand);
    
    // Run deployment script on EC2
    const deployCommand = `ssh ec2-user@${instanceId} "cd ~/app && ${deployScript || 'npm install && npm start'}"`;
    const { stdout, stderr } = await execAsync(deployCommand);
    
    return {
      instanceId,
      logs: stdout,
      errors: stderr
    };
  }

  async deployToElasticBeanstalk(config, context) {
    const { applicationName, environmentName, sourcePath, versionLabel } = config;
    
    this.addLog(context.deploymentId, `Deploying to Elastic Beanstalk: ${applicationName}`);
    
    // Create application version
    const versionCommand = `aws elasticbeanstalk create-application-version --application-name ${applicationName} --version-label ${versionLabel || 'v1'} --source-bundle S3Bucket=${sourcePath}`;
    await execAsync(versionCommand);
    
    // Deploy to environment
    const deployCommand = `aws elasticbeanstalk update-environment --environment-name ${environmentName} --version-label ${versionLabel || 'v1'}`;
    const { stdout, stderr } = await execAsync(deployCommand);
    
    return {
      applicationName,
      environmentName,
      logs: stdout,
      errors: stderr
    };
  }

  async deployWithDocker(environment, configuration, context) {
    const { imageName, tag, dockerfile, buildArgs, ports } = configuration;
    
    this.addLog(context.deploymentId, `Building Docker image: ${imageName}`);
    
    // Build Docker image
    let buildCommand = `docker build -t ${imageName}:${tag || 'latest'}`;
    if (dockerfile) {
      buildCommand += ` -f ${dockerfile}`;
    }
    if (buildArgs) {
      for (const [key, value] of Object.entries(buildArgs)) {
        buildCommand += ` --build-arg ${key}=${value}`;
      }
    }
    buildCommand += ' .';
    
    const { stdout, stderr } = await execAsync(buildCommand);
    
    // Run container
    let runCommand = `docker run -d --name ${imageName}-${Date.now()}`;
    if (ports) {
      for (const port of ports) {
        runCommand += ` -p ${port}`;
      }
    }
    runCommand += ` ${imageName}:${tag || 'latest'}`;
    
    const { stdout: runStdout, stderr: runStderr } = await execAsync(runCommand);
    
    return {
      imageName,
      tag: tag || 'latest',
      containerId: runStdout.trim(),
      logs: stdout,
      errors: stderr
    };
  }

  async deployToKubernetes(environment, configuration, context) {
    const { namespace, deploymentName, imageName, replicas, ports } = configuration;
    
    this.addLog(context.deploymentId, `Deploying to Kubernetes: ${deploymentName}`);
    
    // Generate Kubernetes deployment YAML
    const deploymentYaml = this.generateKubernetesDeployment({
      name: deploymentName,
      image: imageName,
      replicas: replicas || 1,
      ports: ports || [3000]
    });
    
    // Apply deployment
    const { stdout, stderr } = await execAsync(`echo '${deploymentYaml}' | kubectl apply -f -`);
    
    return {
      deploymentName,
      namespace: namespace || 'default',
      logs: stdout,
      errors: stderr
    };
  }

  async getDeploymentStatus(deploymentId) {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    return {
      id: deploymentId,
      status: deployment.status,
      provider: deployment.provider,
      environment: deployment.environment,
      startTime: deployment.startTime,
      endTime: deployment.endTime,
      duration: deployment.duration,
      result: deployment.result,
      error: deployment.error
    };
  }

  async getDeploymentLogs(deploymentId) {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    return {
      id: deploymentId,
      logs: deployment.logs
    };
  }

  async rollbackDeployment(deploymentId) {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    // Implementation would depend on the provider
    // This is a simplified version
    return {
      success: true,
      deploymentId,
      message: 'Rollback initiated'
    };
  }

  // Helper methods
  generateDeploymentId() {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addLog(deploymentId, message) {
    if (!this.deployments.has(deploymentId)) {
      this.deployments.set(deploymentId, {
        id: deploymentId,
        logs: []
      });
    }
    
    const deployment = this.deployments.get(deploymentId);
    if (!deployment.logs) {
      deployment.logs = [];
    }
    
    deployment.logs.push({
      timestamp: new Date(),
      message
    });
  }

  getLogs(deploymentId) {
    const deployment = this.deployments.get(deploymentId);
    return deployment ? deployment.logs : [];
  }

  async ensureCLIs(provider) {
    const providerConfig = this.providers[provider];
    if (!providerConfig?.cli) return;

    try {
      await execAsync(`${providerConfig.cli} --version`);
    } catch (error) {
      throw new Error(`${providerConfig.name} CLI not found. Please install it.`);
    }
  }

  generateKubernetesDeployment(config) {
    const { name, image, replicas, ports } = config;
    
    return `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
      - name: ${name}
        image: ${image}
        ports:
        ${ports.map(port => `- containerPort: ${port}`).join('\n        ')}
---
apiVersion: v1
kind: Service
metadata:
  name: ${name}-service
spec:
  selector:
    app: ${name}
  ports:
  ${ports.map(port => `- port: ${port}\n    targetPort: ${port}`).join('\n  ')}
  type: LoadBalancer
    `.trim();
  }

  // Status check methods for different providers
  async getVercelStatus(deploymentId) {
    // Implementation would check Vercel API
    return { status: 'deployed', url: 'https://example.vercel.app' };
  }

  async getNetlifyStatus(deploymentId) {
    // Implementation would check Netlify API
    return { status: 'deployed', url: 'https://example.netlify.app' };
  }

  async getHerokuStatus(deploymentId) {
    // Implementation would check Heroku API
    return { status: 'deployed', url: 'https://example.herokuapp.com' };
  }

  async getAWSStatus(deploymentId) {
    // Implementation would check AWS API
    return { status: 'deployed', url: 'https://example.amazonaws.com' };
  }

  async getDockerStatus(deploymentId) {
    // Implementation would check Docker daemon
    return { status: 'running', containerId: 'abc123' };
  }

  async getKubernetesStatus(deploymentId) {
    // Implementation would check Kubernetes API
    return { status: 'running', pods: 3 };
  }
}

module.exports = new DeploymentService();