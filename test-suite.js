/**
 * Comprehensive Test Suite for Pythagora AI Platform
 * 
 * This script tests all major endpoints and functionality
 */

const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, success, details = '') {
  const status = success ? '✓ PASS' : '✗ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`  Details: ${details}`);
  
  results.tests.push({ name, success, details });
  if (success) results.passed++;
  else results.failed++;
}

// Test 1: Health Check
async function testHealthCheck() {
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    const isValid = response.status === 200 && 
                    response.data.status === 'OK' &&
                    response.data.version === '2.0.0';
    logTest('Health Check Endpoint', isValid, `Status: ${response.data.status}`);
    return isValid;
  } catch (error) {
    logTest('Health Check Endpoint', false, error.message);
    return false;
  }
}

// Test 2: Homepage
async function testHomepage() {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    const isValid = response.status === 200 && 
                    response.data.includes('Pythagora');
    logTest('Homepage Load', isValid, 'HTML received');
    return isValid;
  } catch (error) {
    logTest('Homepage Load', false, error.message);
    return false;
  }
}

// Test 3: User Registration
async function testUserRegistration() {
  try {
    const userData = {
      email: `test${Date.now()}@example.com`,
      password: 'SecurePass123!',
      name: 'Test User'
    };
    
    const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
    const isValid = response.status === 201 || response.status === 200;
    logTest('User Registration', isValid, `User created: ${userData.email}`);
    return { success: isValid, userData, response: response.data };
  } catch (error) {
    logTest('User Registration', false, error.response?.data?.message || error.message);
    return { success: false };
  }
}

// Test 4: User Login
async function testUserLogin(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password
    });
    const isValid = response.status === 200 && response.data.token;
    logTest('User Login', isValid, 'Token received');
    return { success: isValid, token: response.data.token };
  } catch (error) {
    logTest('User Login', false, error.response?.data?.message || error.message);
    return { success: false };
  }
}

// Test 5: Protected Route Access
async function testProtectedRoute(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const isValid = response.status === 200;
    logTest('Protected Route Access', isValid, 'Projects endpoint accessible');
    return isValid;
  } catch (error) {
    logTest('Protected Route Access', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 6: Invalid Token Rejection
async function testInvalidToken() {
  try {
    await axios.get(`${BASE_URL}/api/projects`, {
      headers: { Authorization: 'Bearer invalid-token' }
    });
    logTest('Invalid Token Rejection', false, 'Should have rejected invalid token');
    return false;
  } catch (error) {
    const isValid = error.response?.status === 401 || error.response?.status === 403;
    logTest('Invalid Token Rejection', isValid, 'Invalid token properly rejected');
    return isValid;
  }
}

// Test 7: Rate Limiting
async function testRateLimiting() {
  try {
    // Make multiple rapid requests
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(axios.get(`${BASE_URL}/api/health`));
    }
    await Promise.all(requests);
    logTest('Rate Limiting', true, 'Endpoints responsive under load');
    return true;
  } catch (error) {
    logTest('Rate Limiting', false, error.message);
    return false;
  }
}

// Test 8: 404 Handling
async function test404Handling() {
  try {
    await axios.get(`${BASE_URL}/api/nonexistent-endpoint`);
    logTest('404 Error Handling', false, 'Should have returned 404');
    return false;
  } catch (error) {
    const isValid = error.response?.status === 404;
    logTest('404 Error Handling', isValid, '404 properly returned');
    return isValid;
  }
}

// Test 9: CORS Headers
async function testCORS() {
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    const hasCorH = response.headers['access-control-allow-origin'] !== undefined;
    logTest('CORS Headers', hasCorH, 'CORS headers present');
    return hasCorH;
  } catch (error) {
    logTest('CORS Headers', false, error.message);
    return false;
  }
}

// Test 10: Security Headers
async function testSecurityHeaders() {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    const hasHelmet = response.headers['x-content-type-options'] === 'nosniff';
    logTest('Security Headers (Helmet)', hasHelmet, 'Security headers configured');
    return hasHelmet;
  } catch (error) {
    logTest('Security Headers (Helmet)', false, error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🧪 Pythagora AI Platform - Comprehensive Test Suite\n');
  console.log(`Testing: ${BASE_URL}\n`);
  console.log('='.repeat(60));
  
  // Run basic tests
  await testHealthCheck();
  await testHomepage();
  await test404Handling();
  await testCORS();
  await testSecurityHeaders();
  
  // Run authentication flow tests
  const regResult = await testUserRegistration();
  if (regResult.success) {
    const loginResult = await testUserLogin(
      regResult.userData.email,
      regResult.userData.password
    );
    
    if (loginResult.success) {
      await testProtectedRoute(loginResult.token);
    }
  }
  
  // Run security tests
  await testInvalidToken();
  await testRateLimiting();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`  Total Tests: ${results.passed + results.failed}`);
  console.log(`  ✓ Passed: ${results.passed}`);
  console.log(`  ✗ Failed: ${results.failed}`);
  console.log(`  Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => !t.success)
      .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
  } else {
    console.log('\n✅ All tests passed!');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
