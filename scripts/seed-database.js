#!/usr/bin/env node

/**
 * Database Seeding Script
 * Seeds the database with real sample data for development and testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Project = require('../models/Project');
const AIProvider = require('../models/AIProvider');

// Connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pythagora-ai';

// Sample data
const sampleUsers = [
  {
    email: 'admin@pythagora.ai',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    subscription: {
      plan: 'enterprise',
      tokens: 10000000,
      maxProjects: 100
    }
  },
  {
    email: 'demo@pythagora.ai',
    password: 'Demo123!',
    firstName: 'Demo',
    lastName: 'User',
    role: 'user',
    isActive: true,
    subscription: {
      plan: 'pro',
      tokens: 1000000,
      maxProjects: 20
    }
  },
  {
    email: 'developer@pythagora.ai',
    password: 'Dev123!',
    firstName: 'John',
    lastName: 'Developer',
    role: 'developer',
    isActive: true,
    subscription: {
      plan: 'free',
      tokens: 100000,
      maxProjects: 5
    }
  }
];

const sampleProjects = [
  {
    name: 'E-Commerce Platform',
    description: 'Full-stack e-commerce platform with React frontend, Node.js backend, and MongoDB database.',
    type: 'web-app',
    framework: 'react',
    language: 'javascript',
    status: 'production',
    deployment: {
      status: 'deployed',
      url: 'https://demo-ecommerce.pythagora.ai',
      provider: 'vercel',
      lastDeployed: new Date()
    }
  },
  {
    name: 'AI Chatbot Service',
    description: 'Intelligent customer support chatbot powered by GPT-4.',
    type: 'ai-model',
    framework: 'fastapi',
    language: 'python',
    status: 'testing',
    deployment: {
      status: 'not-deployed',
      provider: 'aws'
    }
  },
  {
    name: 'Mobile Banking App',
    description: 'Secure cross-platform mobile banking application with biometric authentication.',
    type: 'mobile-app',
    framework: 'other',
    language: 'typescript',
    status: 'development',
    deployment: {
      status: 'not-deployed',
      provider: 'custom'
    }
  },
  {
    name: 'Analytics Dashboard API',
    description: 'RESTful API for business analytics dashboard with real-time data.',
    type: 'api',
    framework: 'express',
    language: 'javascript',
    status: 'production',
    deployment: {
      status: 'deployed',
      url: 'https://api-analytics.pythagora.ai',
      provider: 'heroku',
      lastDeployed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  },
  {
    name: 'Data Science Notebook',
    description: 'Jupyter notebook environment for data analysis and ML experiments.',
    type: 'data-science',
    framework: 'other',
    language: 'python',
    status: 'development',
    deployment: {
      status: 'not-deployed',
      provider: 'custom'
    }
  }
];

const sampleAIProviders = [
  {
    name: 'openai',
    displayName: 'OpenAI',
    apiKey: 'sk-demo-openai-key-placeholder',
    baseUrl: 'https://api.openai.com/v1',
    isActive: true,
    priority: 1,
    models: [
      {
        id: 'gpt-4-turbo-preview',
        name: 'GPT-4 Turbo',
        description: 'Most capable GPT-4 model',
        contextLength: 128000,
        inputCost: 0.01,
        outputCost: 0.03,
        isAvailable: true,
        capabilities: ['chat', 'completion', 'function-calling'],
        category: 'advanced'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient model',
        contextLength: 16385,
        inputCost: 0.0005,
        outputCost: 0.0015,
        isAvailable: true,
        capabilities: ['chat', 'completion'],
        category: 'standard'
      }
    ],
    limits: {
      requestsPerMinute: 60,
      tokensPerMinute: 150000
    }
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic',
    apiKey: 'sk-ant-demo-key-placeholder',
    baseUrl: 'https://api.anthropic.com',
    isActive: true,
    priority: 2,
    models: [
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        description: 'Most capable Claude model',
        contextLength: 200000,
        inputCost: 0.015,
        outputCost: 0.075,
        isAvailable: true,
        capabilities: ['chat', 'analysis', 'coding'],
        category: 'advanced'
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance model',
        contextLength: 200000,
        inputCost: 0.003,
        outputCost: 0.015,
        isAvailable: true,
        capabilities: ['chat', 'analysis'],
        category: 'standard'
      }
    ],
    limits: {
      requestsPerMinute: 50,
      tokensPerMinute: 100000
    }
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI.replace(/mongodb\+srv:\/\/[^:]+:[^@]+@/, 'mongodb+srv://***:***@')}`);

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      AIProvider.deleteMany({})
    ]);
    console.log('✅ Existing data cleared');

    // Create users
    console.log('👤 Creating users...');
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (user) => {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return {
          ...user,
          password: hashedPassword
        };
      })
    );

    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Print user credentials
    console.log('\n📧 User Credentials:');
    sampleUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} / ${user.password} (${user.role})`);
    });

    // Create projects (assign to first user - admin)
    console.log('\n📁 Creating projects...');
    const projectsWithOwners = sampleProjects.map(project => ({
      ...project,
      owner: createdUsers[0]._id, // Assign to admin user
      collaborators: []
    }));

    const createdProjects = await Project.insertMany(projectsWithOwners);
    console.log(`✅ Created ${createdProjects.length} projects`);

    // Add some collaborators to projects
    console.log('👥 Adding collaborators...');
    if (createdProjects.length > 0 && createdUsers.length > 1) {
      // Add demo user as collaborator to first project
      createdProjects[0].collaborators.push({
        user: createdUsers[1]._id,
        role: 'editor',
        addedAt: new Date()
      });
      await createdProjects[0].save();

      // Add developer as collaborator to second project
      if (createdProjects.length > 1 && createdUsers.length > 2) {
        createdProjects[1].collaborators.push({
          user: createdUsers[2]._id,
          role: 'viewer',
          addedAt: new Date()
        });
        await createdProjects[1].save();
      }
    }
    console.log('✅ Collaborators added');

    // Create AI providers (assign to admin user)
    console.log('\n🤖 Creating AI providers...');
    const providersWithUsers = sampleAIProviders.map(provider => ({
      ...provider,
      user: createdUsers[0]._id
    }));

    const createdProviders = await AIProvider.insertMany(providersWithUsers);
    console.log(`✅ Created ${createdProviders.length} AI providers`);

    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Database seeding completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Users:        ${createdUsers.length}`);
    console.log(`   Projects:     ${createdProjects.length}`);
    console.log(`   AI Providers: ${createdProviders.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin:     admin@pythagora.ai / Admin123!');
    console.log('   Demo:      demo@pythagora.ai / Demo123!');
    console.log('   Developer: developer@pythagora.ai / Dev123!');
    console.log('\n💡 You can now start the server and login with these credentials!');
    console.log('   Run: npm start');
    console.log('   Visit: http://localhost:3000');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
