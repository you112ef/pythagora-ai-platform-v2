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
    fullName: 'Admin User',
    role: 'admin',
    isActive: true,
    subscription: {
      plan: 'Enterprise',
      tokens: 10000000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  },
  {
    email: 'demo@pythagora.ai',
    password: 'Demo123!',
    firstName: 'Demo',
    lastName: 'User',
    fullName: 'Demo User',
    role: 'user',
    isActive: true,
    subscription: {
      plan: 'Pro',
      tokens: 1000000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    }
  },
  {
    email: 'developer@pythagora.ai',
    password: 'Dev123!',
    firstName: 'John',
    lastName: 'Developer',
    fullName: 'John Developer',
    role: 'user',
    isActive: true,
    subscription: {
      plan: 'Free',
      tokens: 100000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  }
];

const sampleProjects = [
  {
    name: 'E-Commerce Platform',
    description: 'Full-stack e-commerce platform with React frontend, Node.js backend, and MongoDB database. Features include user authentication, product catalog, shopping cart, and payment integration.',
    type: 'web-app',
    framework: 'react',
    language: 'javascript',
    techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Stripe', 'Redux'],
    status: 'active',
    deployment: {
      status: 'deployed',
      url: 'https://demo-ecommerce.pythagora.ai',
      lastDeployedAt: new Date()
    }
  },
  {
    name: 'AI Chatbot Service',
    description: 'Intelligent customer support chatbot powered by GPT-4. Handles common customer inquiries, provides product recommendations, and escalates complex issues to human agents.',
    type: 'ai-model',
    framework: 'fastapi',
    language: 'python',
    techStack: ['Python', 'FastAPI', 'OpenAI GPT-4', 'PostgreSQL', 'Redis', 'Docker'],
    status: 'testing',
    deployment: {
      status: 'testing',
      url: null
    }
  },
  {
    name: 'Mobile Banking App',
    description: 'Secure cross-platform mobile banking application with biometric authentication, real-time transactions, and comprehensive account management features.',
    type: 'mobile-app',
    framework: 'react-native',
    language: 'typescript',
    techStack: ['React Native', 'TypeScript', 'Redux', 'Firebase', 'FaceID', 'TouchID'],
    status: 'development',
    deployment: {
      status: 'not-deployed',
      url: null
    }
  },
  {
    name: 'Analytics Dashboard API',
    description: 'RESTful API for business analytics dashboard. Provides real-time data aggregation, visualization endpoints, and customizable reporting features.',
    type: 'api',
    framework: 'express',
    language: 'javascript',
    techStack: ['Node.js', 'Express', 'MongoDB', 'Redis', 'Chart.js', 'JWT'],
    status: 'active',
    deployment: {
      status: 'deployed',
      url: 'https://api-analytics.pythagora.ai',
      lastDeployedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  },
  {
    name: 'Task Automation Framework',
    description: 'Automated workflow system for business process automation. Supports scheduled tasks, webhooks, and integration with popular SaaS platforms.',
    type: 'automation',
    framework: 'nodejs',
    language: 'javascript',
    techStack: ['Node.js', 'Bull Queue', 'Redis', 'MongoDB', 'Webhooks', 'Cron'],
    status: 'active',
    deployment: {
      status: 'deployed',
      url: null,
      lastDeployedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    }
  }
];

const sampleAIProviders = [
  {
    name: 'openai',
    displayName: 'OpenAI',
    apiKey: 'demo-openai-key-placeholder',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
    enabled: true,
    isDefault: true,
    priority: 1,
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 150000
    },
    usage: {
      totalRequests: 1523,
      totalTokens: 456789,
      totalCost: 45.67
    }
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic',
    apiKey: 'demo-anthropic-key-placeholder',
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    enabled: true,
    isDefault: false,
    priority: 2,
    rateLimit: {
      requestsPerMinute: 50,
      tokensPerMinute: 100000
    },
    usage: {
      totalRequests: 892,
      totalTokens: 234567,
      totalCost: 23.45
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
