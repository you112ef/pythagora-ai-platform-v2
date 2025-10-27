#!/usr/bin/env node

/**
 * Generate Secure Secrets for Production
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n' + '='.repeat(70));
console.log('🔐 SECURE SECRETS GENERATOR');
console.log('='.repeat(70) + '\n');

console.log('Copy these values to your .env or Render environment variables:\n');

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=');
console.log(jwtSecret);
console.log('');

// Generate JWT Refresh Secret
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_REFRESH_SECRET=');
console.log(jwtRefreshSecret);
console.log('');

// Generate Session Secret (if needed)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET=');
console.log(sessionSecret);
console.log('');

// Generate API Key for internal use
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('INTERNAL_API_KEY=');
console.log(apiKey);
console.log('');

console.log('='.repeat(70));
console.log('⚠️  SECURITY NOTES:');
console.log('='.repeat(70));
console.log('1. NEVER commit these secrets to Git');
console.log('2. Store them securely (password manager, Render env vars)');
console.log('3. Rotate secrets every 3-6 months');
console.log('4. Use different secrets for dev/staging/production');
console.log('5. If compromised, generate new ones immediately');
console.log('='.repeat(70) + '\n');
