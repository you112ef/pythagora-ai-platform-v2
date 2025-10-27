#!/usr/bin/env node

// Test script for Pythagora AI Platform v2.0 deployment
const http = require('http');
const https = require('https');

console.log('🧪 Testing Pythagora AI Platform v2.0 Deployment...\n');

// Test configuration
const tests = [
  {
    name: 'Health Check',
    url: '/api/health',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Root Endpoint',
    url: '/',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'API Routes',
    url: '/api/auth/register',
    method: 'POST',
    expectedStatus: 400 // Should return validation error, not 404
  }
];

// Test function
function testEndpoint(baseUrl, test) {
  return new Promise((resolve) => {
    const url = new URL(test.url, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Pythagora-AI-Platform-Test/2.0.0'
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode === test.expectedStatus;
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${res.statusCode} (expected ${test.expectedStatus})`);
        
        if (!success) {
          console.log(`   Response: ${data.substring(0, 100)}...`);
        }
        
        resolve(success);
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${test.name}: Connection failed - ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log(`❌ ${test.name}: Timeout`);
      req.destroy();
      resolve(false);
    });

    if (test.method === 'POST') {
      req.write(JSON.stringify({}));
    }
    
    req.end();
  });
}

// Main test function
async function runTests(baseUrl) {
  console.log(`🔗 Testing against: ${baseUrl}\n`);
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await testEndpoint(baseUrl, test);
    if (success) passed++;
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Deployment is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the deployment configuration.');
  }
  
  return passed === total;
}

// Get base URL from command line or use default
const baseUrl = process.argv[2] || 'http://localhost:3000';

// Run tests
runTests(baseUrl).then((success) => {
  process.exit(success ? 0 : 1);
});