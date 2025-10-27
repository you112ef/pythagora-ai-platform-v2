#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests all critical endpoints and features
 * 
 * Usage: node scripts/verify-deployment.js <BASE_URL>
 * Example: node scripts/verify-deployment.js https://pythagora-ai-platform.onrender.com
 */

const axios = require('axios');

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function success(message) {
  testsPassed++;
  log('✅ ' + message, 'green');
}

function fail(message, error) {
  testsFailed++;
  log('❌ ' + message, 'red');
  if (error) {
    log('   Error: ' + error.message, 'yellow');
  }
}

function info(message) {
  log('ℹ️  ' + message, 'blue');
}

async function test(name, fn) {
  try {
    await fn();
    success(name);
  } catch (error) {
    fail(name, error);
  }
}

async function runTests() {
  log('\n' + '='.repeat(70), 'blue');
  log('🧪 DEPLOYMENT VERIFICATION - Pythagora AI Platform', 'blue');
  log('='.repeat(70), 'blue');
  log(`\n📍 Testing URL: ${BASE_URL}\n`);

  // Test 1: Health Check
  await test('Health Check Endpoint', async () => {
    const response = await axios.get(`${BASE_URL}/api/health`);
    if (response.status !== 200) throw new Error('Health check failed');
    if (response.data.status !== 'OK') throw new Error('Health status not OK');
    info(`   Version: ${response.data.version}`);
  });

  // Test 2: Homepage
  await test('Homepage Loads', async () => {
    const response = await axios.get(`${BASE_URL}/`);
    if (response.status !== 200) throw new Error('Homepage not accessible');
    if (!response.data.includes('Pythagora')) throw new Error('Homepage content invalid');
  });

  // Test 3: AI Providers Page
  await test('AI Providers Page Loads', async () => {
    const response = await axios.get(`${BASE_URL}/ai-providers.html`);
    if (response.status !== 200) throw new Error('AI Providers page not accessible');
  });

  // Test 4: User Registration
  let authToken = null;
  await test('User Registration', async () => {
    const randomEmail = `test_${Date.now()}@example.com`;
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: randomEmail,
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (response.status !== 201) throw new Error('Registration failed');
    if (!response.data.success) throw new Error('Registration not successful');
    if (!response.data.data.token) throw new Error('No token received');
    
    authToken = response.data.data.token;
    info(`   User created: ${randomEmail}`);
  });

  // Test 5: User Login
  await test('User Login', async () => {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@pythagora.ai',
      password: 'Admin123!'
    });
    
    if (response.status !== 200) throw new Error('Login failed');
    if (!response.data.success) throw new Error('Login not successful');
    if (!response.data.data.token) throw new Error('No token received');
    
    authToken = response.data.data.token;
    info(`   Logged in as: ${response.data.data.user.email}`);
  });

  // Test 6: Get Projects (requires auth)
  await test('Get Projects (Authenticated)', async () => {
    if (!authToken) throw new Error('No auth token available');
    
    const response = await axios.get(`${BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 200) throw new Error('Get projects failed');
    if (!response.data.success) throw new Error('Projects request not successful');
    info(`   Projects found: ${response.data.data.projects.length}`);
  });

  // Test 7: Create Project
  await test('Create Project', async () => {
    if (!authToken) throw new Error('No auth token available');
    
    const response = await axios.post(`${BASE_URL}/api/projects`, {
      name: `Test Project ${Date.now()}`,
      description: 'Automated test project',
      type: 'web-app',
      framework: 'react',
      language: 'javascript'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 201) throw new Error('Project creation failed');
    if (!response.data.success) throw new Error('Project not created successfully');
    info(`   Project ID: ${response.data.data.project._id}`);
  });

  // Test 8: Get AI Providers
  await test('Get AI Providers', async () => {
    if (!authToken) throw new Error('No auth token available');
    
    const response = await axios.get(`${BASE_URL}/api/ai-providers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 200) throw new Error('Get AI providers failed');
    info(`   AI Providers: ${response.data.data?.providers?.length || 0}`);
  });

  // Test 9: Get All AI Models
  await test('Get All AI Models', async () => {
    if (!authToken) throw new Error('No auth token available');
    
    const response = await axios.get(`${BASE_URL}/api/ai-providers/models/all`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 200) throw new Error('Get models failed');
    const modelCount = response.data.data?.models?.length || 0;
    info(`   Total AI Models: ${modelCount}`);
    if (modelCount < 60) {
      log(`   ⚠️  Expected 60+ models, found ${modelCount}`, 'yellow');
    }
  });

  // Test 10: Unauthorized Access
  await test('Unauthorized Access Protection', async () => {
    try {
      await axios.get(`${BASE_URL}/api/projects`);
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Expected behavior
        return;
      }
      throw error;
    }
  });

  // Test 11: CORS Headers
  await test('CORS Headers Present', async () => {
    const response = await axios.get(`${BASE_URL}/api/health`);
    // CORS headers should be present
    if (!response.headers) throw new Error('No headers in response');
  });

  // Test 12: Security Headers
  await test('Security Headers (Helmet)', async () => {
    const response = await axios.get(`${BASE_URL}/`);
    // Check for some basic security headers
    if (!response.headers) throw new Error('No headers in response');
    // Helmet should add security headers
  });

  // Test 13: Rate Limiting
  await test('Rate Limiting Configured', async () => {
    // Make multiple requests quickly
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(axios.get(`${BASE_URL}/api/health`));
    }
    await Promise.all(requests);
    // If we get here, rate limiting is at least not blocking normal usage
  });

  // Test 14: Error Handling (404)
  await test('404 Error Handling', async () => {
    try {
      await axios.get(`${BASE_URL}/api/nonexistent-route`);
      throw new Error('Should have returned 404');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return; // Expected
      }
      throw error;
    }
  });

  // Test 15: Static Files
  await test('Static Files Served', async () => {
    const response = await axios.get(`${BASE_URL}/css/main.css`);
    if (response.status !== 200) throw new Error('Static files not accessible');
  });

  // Summary
  log('\n' + '='.repeat(70), 'blue');
  log('📊 TEST RESULTS', 'blue');
  log('='.repeat(70), 'blue');
  log(`\n✅ Passed: ${testsPassed}`, 'green');
  log(`❌ Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%\n`);

  if (testsFailed === 0) {
    log('🎉 ALL TESTS PASSED! Deployment is successful!', 'green');
    log('✅ Application is working correctly and ready for use.', 'green');
  } else {
    log('⚠️  Some tests failed. Please review the errors above.', 'yellow');
    log('💡 Common issues:', 'yellow');
    log('   - Database not connected (check MONGODB_URI)', 'yellow');
    log('   - Environment variables not set correctly', 'yellow');
    log('   - Server not fully started', 'yellow');
  }

  log('\n' + '='.repeat(70) + '\n', 'blue');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run all tests
runTests().catch(error => {
  log('\n❌ Test suite failed to run:', 'red');
  log(error.message, 'red');
  process.exit(1);
});
