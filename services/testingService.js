const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const execAsync = promisify(exec);

class TestingService {
  constructor() {
    this.testRuns = new Map();
    this.initializeTestFrameworks();
  }

  initializeTestFrameworks() {
    this.testFrameworks = {
      // JavaScript/TypeScript
      jest: {
        name: 'Jest',
        language: 'javascript',
        command: 'jest',
        configFile: 'jest.config.js',
        setup: this.setupJest.bind(this)
      },
      mocha: {
        name: 'Mocha',
        language: 'javascript',
        command: 'mocha',
        configFile: '.mocharc.js',
        setup: this.setupMocha.bind(this)
      },
      cypress: {
        name: 'Cypress',
        language: 'javascript',
        command: 'cypress',
        configFile: 'cypress.config.js',
        setup: this.setupCypress.bind(this)
      },
      playwright: {
        name: 'Playwright',
        language: 'javascript',
        command: 'playwright',
        configFile: 'playwright.config.js',
        setup: this.setupPlaywright.bind(this)
      },
      vitest: {
        name: 'Vitest',
        language: 'javascript',
        command: 'vitest',
        configFile: 'vitest.config.js',
        setup: this.setupVitest.bind(this)
      },
      
      // Python
      pytest: {
        name: 'pytest',
        language: 'python',
        command: 'pytest',
        configFile: 'pytest.ini',
        setup: this.setupPytest.bind(this)
      },
      unittest: {
        name: 'unittest',
        language: 'python',
        command: 'python -m unittest',
        configFile: null,
        setup: this.setupUnittest.bind(this)
      },
      
      // Ruby
      rspec: {
        name: 'RSpec',
        language: 'ruby',
        command: 'rspec',
        configFile: 'spec/spec_helper.rb',
        setup: this.setupRspec.bind(this)
      },
      minitest: {
        name: 'Minitest',
        language: 'ruby',
        command: 'ruby -Ilib:test',
        configFile: null,
        setup: this.setupMinitest.bind(this)
      }
    };
  }

  async runTests(testType, testFiles, configuration, context = {}) {
    const testRunId = this.generateTestRunId();
    const startTime = Date.now();

    try {
      this.addLog(testRunId, `Starting ${testType} tests`);
      
      // Setup test environment
      await this.setupTestEnvironment(testType, configuration, context);
      
      // Execute tests
      const result = await this.executeTests(testType, testFiles, configuration, context);
      
      const duration = Date.now() - startTime;
      
      this.testRuns.set(testRunId, {
        id: testRunId,
        testType,
        status: result.success ? 'passed' : 'failed',
        startTime: new Date(startTime),
        endTime: new Date(),
        duration,
        result,
        logs: this.getLogs(testRunId)
      });

      this.addLog(testRunId, `Tests completed in ${duration}ms`);
      
      return {
        success: true,
        testRunId,
        testType,
        duration,
        result
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testRuns.set(testRunId, {
        id: testRunId,
        testType,
        status: 'error',
        startTime: new Date(startTime),
        endTime: new Date(),
        duration,
        error: error.message,
        logs: this.getLogs(testRunId)
      });

      this.addLog(testRunId, `Test execution failed: ${error.message}`);
      
      return {
        success: false,
        testRunId,
        testType,
        duration,
        error: error.message
      };
    }
  }

  async executeTests(framework, testFiles, configuration, context) {
    const frameworkConfig = this.testFrameworks[framework];
    if (!frameworkConfig) {
      throw new Error(`Unsupported test framework: ${framework}`);
    }

    // Build test command
    const command = this.buildTestCommand(framework, testFiles, configuration);
    
    this.addLog(context.testRunId, `Executing: ${command}`);
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: configuration.workingDirectory || process.cwd(),
        timeout: configuration.timeout || 300000 // 5 minutes
      });

      // Parse test results
      const results = this.parseTestResults(framework, stdout, stderr);
      
      return {
        success: results.passed,
        framework,
        results,
        output: stdout,
        errors: stderr,
        duration: results.duration
      };

    } catch (error) {
      // Some test frameworks return non-zero exit codes even for successful tests
      if (error.code === 1 && error.stdout) {
        const results = this.parseTestResults(framework, error.stdout, error.stderr);
        return {
          success: results.passed,
          framework,
          results,
          output: error.stdout,
          errors: error.stderr,
          duration: results.duration
        };
      }
      
      throw error;
    }
  }

  async setupTestEnvironment(testType, configuration, context) {
    const framework = this.testFrameworks[testType];
    if (!framework) {
      throw new Error(`Unsupported test type: ${testType}`);
    }

    return await framework.setup(configuration, context);
  }

  // Framework-specific setup methods
  async setupJest(configuration, context) {
    this.addLog(context.testRunId, 'Setting up Jest environment');
    
    // Check if Jest is installed
    try {
      await execAsync('jest --version');
    } catch (error) {
      throw new Error('Jest not found. Please install it: npm install --save-dev jest');
    }

    // Create Jest config if it doesn't exist
    const configPath = path.join(configuration.workingDirectory || process.cwd(), 'jest.config.js');
    try {
      await fs.access(configPath);
    } catch (error) {
      const defaultConfig = {
        testEnvironment: 'node',
        collectCoverage: true,
        coverageDirectory: 'coverage',
        testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js']
      };
      
      await fs.writeFile(configPath, `module.exports = ${JSON.stringify(defaultConfig, null, 2)};`);
    }
  }

  async setupMocha(configuration, context) {
    this.addLog(context.testRunId, 'Setting up Mocha environment');
    
    try {
      await execAsync('mocha --version');
    } catch (error) {
      throw new Error('Mocha not found. Please install it: npm install --save-dev mocha');
    }
  }

  async setupCypress(configuration, context) {
    this.addLog(context.testRunId, 'Setting up Cypress environment');
    
    try {
      await execAsync('cypress --version');
    } catch (error) {
      throw new Error('Cypress not found. Please install it: npm install --save-dev cypress');
    }

    // Initialize Cypress if needed
    const cypressPath = path.join(configuration.workingDirectory || process.cwd(), 'cypress');
    try {
      await fs.access(cypressPath);
    } catch (error) {
      await execAsync('npx cypress open --e2e --browser chrome --headless');
    }
  }

  async setupPlaywright(configuration, context) {
    this.addLog(context.testRunId, 'Setting up Playwright environment');
    
    try {
      await execAsync('playwright --version');
    } catch (error) {
      throw new Error('Playwright not found. Please install it: npm install --save-dev @playwright/test');
    }

    // Install browsers if needed
    try {
      await execAsync('npx playwright install');
    } catch (error) {
      this.addLog(context.testRunId, 'Warning: Could not install Playwright browsers');
    }
  }

  async setupVitest(configuration, context) {
    this.addLog(context.testRunId, 'Setting up Vitest environment');
    
    try {
      await execAsync('vitest --version');
    } catch (error) {
      throw new Error('Vitest not found. Please install it: npm install --save-dev vitest');
    }
  }

  async setupPytest(configuration, context) {
    this.addLog(context.testRunId, 'Setting up pytest environment');
    
    try {
      await execAsync('pytest --version');
    } catch (error) {
      throw new Error('pytest not found. Please install it: pip install pytest');
    }
  }

  async setupUnittest(configuration, context) {
    this.addLog(context.testRunId, 'Setting up unittest environment');
    
    // unittest is part of Python standard library
    try {
      await execAsync('python -m unittest --help');
    } catch (error) {
      throw new Error('Python unittest not available');
    }
  }

  async setupRspec(configuration, context) {
    this.addLog(context.testRunId, 'Setting up RSpec environment');
    
    try {
      await execAsync('rspec --version');
    } catch (error) {
      throw new Error('RSpec not found. Please install it: gem install rspec');
    }
  }

  async setupMinitest(configuration, context) {
    this.addLog(context.testRunId, 'Setting up Minitest environment');
    
    // Minitest is part of Ruby standard library
    try {
      await execAsync('ruby -e "require \'minitest/autorun\'"');
    } catch (error) {
      throw new Error('Ruby Minitest not available');
    }
  }

  buildTestCommand(framework, testFiles, configuration) {
    const frameworkConfig = this.testFrameworks[framework];
    let command = frameworkConfig.command;

    // Add test files
    if (testFiles && testFiles.length > 0) {
      command += ` ${testFiles.join(' ')}`;
    }

    // Add configuration options
    if (configuration.options) {
      command += ` ${configuration.options}`;
    }

    // Add coverage if requested
    if (configuration.coverage) {
      switch (framework) {
        case 'jest':
          command += ' --coverage';
          break;
        case 'mocha':
          command += ' --reporter json';
          break;
        case 'pytest':
          command += ' --cov';
          break;
      }
    }

    // Add verbose output
    if (configuration.verbose) {
      switch (framework) {
        case 'jest':
          command += ' --verbose';
          break;
        case 'mocha':
          command += ' --reporter spec';
          break;
        case 'pytest':
          command += ' -v';
          break;
      }
    }

    return command;
  }

  parseTestResults(framework, stdout, stderr) {
    switch (framework) {
      case 'jest':
        return this.parseJestResults(stdout, stderr);
      case 'mocha':
        return this.parseMochaResults(stdout, stderr);
      case 'cypress':
        return this.parseCypressResults(stdout, stderr);
      case 'playwright':
        return this.parsePlaywrightResults(stdout, stderr);
      case 'vitest':
        return this.parseVitestResults(stdout, stderr);
      case 'pytest':
        return this.parsePytestResults(stdout, stderr);
      case 'unittest':
        return this.parseUnittestResults(stdout, stderr);
      case 'rspec':
        return this.parseRspecResults(stdout, stderr);
      case 'minitest':
        return this.parseMinitestResults(stdout, stderr);
      default:
        return this.parseGenericResults(stdout, stderr);
    }
  }

  // Framework-specific result parsers
  parseJestResults(stdout, stderr) {
    const lines = stdout.split('\n');
    let passed = 0;
    let failed = 0;
    let duration = 0;

    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed/);
        if (match) passed = parseInt(match[1]);
        
        const failMatch = line.match(/(\d+) failed/);
        if (failMatch) failed = parseInt(failMatch[1]);
      }
      
      if (line.includes('Time:')) {
        const timeMatch = line.match(/Time:\s+(\d+(?:\.\d+)?)s/);
        if (timeMatch) duration = parseFloat(timeMatch[1]) * 1000;
      }
    }

    return {
      passed: failed === 0,
      total: passed + failed,
      passed,
      failed,
      duration,
      framework: 'jest'
    };
  }

  parseMochaResults(stdout, stderr) {
    const lines = stdout.split('\n');
    let passed = 0;
    let failed = 0;
    let duration = 0;

    for (const line of lines) {
      if (line.includes('passing')) {
        const match = line.match(/(\d+) passing/);
        if (match) passed = parseInt(match[1]);
      }
      
      if (line.includes('failing')) {
        const match = line.match(/(\d+) failing/);
        if (match) failed = parseInt(match[1]);
      }
      
      if (line.includes('ms')) {
        const timeMatch = line.match(/(\d+)ms/);
        if (timeMatch) duration = parseInt(timeMatch[1]);
      }
    }

    return {
      passed: failed === 0,
      total: passed + failed,
      passed,
      failed,
      duration,
      framework: 'mocha'
    };
  }

  parseCypressResults(stdout, stderr) {
    // Cypress results are typically in JSON format
    try {
      const jsonMatch = stdout.match(/\{.*\}/s);
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0]);
        return {
          passed: results.stats.failures === 0,
          total: results.stats.tests,
          passed: results.stats.passes,
          failed: results.stats.failures,
          duration: results.stats.duration,
          framework: 'cypress'
        };
      }
    } catch (error) {
      // Fallback to generic parsing
    }

    return this.parseGenericResults(stdout, stderr);
  }

  parsePlaywrightResults(stdout, stderr) {
    const lines = stdout.split('\n');
    let passed = 0;
    let failed = 0;
    let duration = 0;

    for (const line of lines) {
      if (line.includes('passed')) {
        const match = line.match(/(\d+) passed/);
        if (match) passed = parseInt(match[1]);
      }
      
      if (line.includes('failed')) {
        const match = line.match(/(\d+) failed/);
        if (match) failed = parseInt(match[1]);
      }
      
      if (line.includes('ms')) {
        const timeMatch = line.match(/(\d+)ms/);
        if (timeMatch) duration = parseInt(timeMatch[1]);
      }
    }

    return {
      passed: failed === 0,
      total: passed + failed,
      passed,
      failed,
      duration,
      framework: 'playwright'
    };
  }

  parseVitestResults(stdout, stderr) {
    return this.parseJestResults(stdout, stderr); // Vitest uses similar output format
  }

  parsePytestResults(stdout, stderr) {
    const lines = stdout.split('\n');
    let passed = 0;
    let failed = 0;
    let duration = 0;

    for (const line of lines) {
      if (line.includes('passed')) {
        const match = line.match(/(\d+) passed/);
        if (match) passed = parseInt(match[1]);
      }
      
      if (line.includes('failed')) {
        const match = line.match(/(\d+) failed/);
        if (match) failed = parseInt(match[1]);
      }
      
      if (line.includes('seconds')) {
        const timeMatch = line.match(/(\d+(?:\.\d+)?) seconds/);
        if (timeMatch) duration = parseFloat(timeMatch[1]) * 1000;
      }
    }

    return {
      passed: failed === 0,
      total: passed + failed,
      passed,
      failed,
      duration,
      framework: 'pytest'
    };
  }

  parseUnittestResults(stdout, stderr) {
    const lines = stdout.split('\n');
    let passed = 0;
    let failed = 0;
    let duration = 0;

    for (const line of lines) {
      if (line.includes('OK')) {
        const match = line.match(/Ran (\d+) test/);
        if (match) {
          passed = parseInt(match[1]);
          failed = 0;
        }
      }
      
      if (line.includes('FAILED')) {
        const match = line.match(/Ran (\d+) test/);
        if (match) {
          const total = parseInt(match[1]);
          const failMatch = line.match(/failures=(\d+)/);
          if (failMatch) {
            failed = parseInt(failMatch[1]);
            passed = total - failed;
          }
        }
      }
    }

    return {
      passed: failed === 0,
      total: passed + failed,
      passed,
      failed,
      duration,
      framework: 'unittest'
    };
  }

  parseRspecResults(stdout, stderr) {
    const lines = stdout.split('\n');
    let passed = 0;
    let failed = 0;
    let duration = 0;

    for (const line of lines) {
      if (line.includes('examples')) {
        const match = line.match(/(\d+) examples/);
        if (match) {
          const total = parseInt(match[1]);
          const failMatch = line.match(/(\d+) failures/);
          if (failMatch) {
            failed = parseInt(failMatch[1]);
            passed = total - failed;
          } else {
            passed = total;
          }
        }
      }
      
      if (line.includes('Finished in')) {
        const timeMatch = line.match(/Finished in ([\d.]+) seconds/);
        if (timeMatch) duration = parseFloat(timeMatch[1]) * 1000;
      }
    }

    return {
      passed: failed === 0,
      total: passed + failed,
      passed,
      failed,
      duration,
      framework: 'rspec'
    };
  }

  parseMinitestResults(stdout, stderr) {
    const lines = stdout.split('\n');
    let passed = 0;
    let failed = 0;
    let duration = 0;

    for (const line of lines) {
      if (line.includes('runs')) {
        const match = line.match(/(\d+) runs/);
        if (match) {
          const total = parseInt(match[1]);
          const failMatch = line.match(/(\d+) failures/);
          if (failMatch) {
            failed = parseInt(failMatch[1]);
            passed = total - failed;
          } else {
            passed = total;
          }
        }
      }
    }

    return {
      passed: failed === 0,
      total: passed + failed,
      passed,
      failed,
      duration,
      framework: 'minitest'
    };
  }

  parseGenericResults(stdout, stderr) {
    // Generic parsing for unknown frameworks
    const lines = stdout.split('\n');
    let passed = 0;
    let failed = 0;

    for (const line of lines) {
      if (line.toLowerCase().includes('pass') || line.includes('✓')) {
        passed++;
      }
      if (line.toLowerCase().includes('fail') || line.includes('✗') || line.includes('×')) {
        failed++;
      }
    }

    return {
      passed: failed === 0,
      total: passed + failed,
      passed,
      failed,
      duration: 0,
      framework: 'generic'
    };
  }

  async generateTestReport(testRunId, format = 'json') {
    const testRun = this.testRuns.get(testRunId);
    if (!testRun) {
      throw new Error(`Test run ${testRunId} not found`);
    }

    switch (format) {
      case 'json':
        return this.generateJsonReport(testRun);
      case 'html':
        return this.generateHtmlReport(testRun);
      case 'xml':
        return this.generateXmlReport(testRun);
      case 'text':
        return this.generateTextReport(testRun);
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  generateJsonReport(testRun) {
    return {
      testRunId: testRun.id,
      testType: testRun.testType,
      status: testRun.status,
      startTime: testRun.startTime,
      endTime: testRun.endTime,
      duration: testRun.duration,
      result: testRun.result,
      logs: testRun.logs
    };
  }

  generateHtmlReport(testRun) {
    const result = testRun.result;
    const statusColor = testRun.status === 'passed' ? 'green' : 'red';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${testRun.testType}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .status { color: ${statusColor}; font-weight: bold; }
        .summary { margin: 20px 0; }
        .logs { background: #f9f9f9; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Report</h1>
        <p><strong>Test Type:</strong> ${testRun.testType}</p>
        <p><strong>Status:</strong> <span class="status">${testRun.status}</span></p>
        <p><strong>Duration:</strong> ${testRun.duration}ms</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: ${result?.total || 0}</p>
        <p>Passed: ${result?.passed || 0}</p>
        <p>Failed: ${result?.failed || 0}</p>
    </div>
    
    <div class="logs">
        <h2>Logs</h2>
        <pre>${testRun.logs.map(log => `[${log.timestamp.toISOString()}] ${log.message}`).join('\n')}</pre>
    </div>
</body>
</html>
    `.trim();
  }

  generateXmlReport(testRun) {
    const result = testRun.result;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="${testRun.testType}" tests="${result?.total || 0}" failures="${result?.failed || 0}" time="${testRun.duration / 1000}">
    <properties>
        <property name="testType" value="${testRun.testType}"/>
        <property name="status" value="${testRun.status}"/>
    </properties>
    <system-out>
        ${testRun.logs.map(log => `[${log.timestamp.toISOString()}] ${log.message}`).join('\n')}
    </system-out>
</testsuite>`;
  }

  generateTextReport(testRun) {
    const result = testRun.result;
    
    return `
Test Report
===========

Test Type: ${testRun.testType}
Status: ${testRun.status}
Duration: ${testRun.duration}ms
Start Time: ${testRun.startTime.toISOString()}
End Time: ${testRun.endTime.toISOString()}

Summary
-------
Total Tests: ${result?.total || 0}
Passed: ${result?.passed || 0}
Failed: ${result?.failed || 0}

Logs
----
${testRun.logs.map(log => `[${log.timestamp.toISOString()}] ${log.message}`).join('\n')}
    `.trim();
  }

  // Helper methods
  generateTestRunId() {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addLog(testRunId, message) {
    if (!this.testRuns.has(testRunId)) {
      this.testRuns.set(testRunId, {
        id: testRunId,
        logs: []
      });
    }
    
    const testRun = this.testRuns.get(testRunId);
    if (!testRun.logs) {
      testRun.logs = [];
    }
    
    testRun.logs.push({
      timestamp: new Date(),
      message
    });
  }

  getLogs(testRunId) {
    const testRun = this.testRuns.get(testRunId);
    return testRun ? testRun.logs : [];
  }

  getTestRun(testRunId) {
    return this.testRuns.get(testRunId);
  }

  getAllTestRuns() {
    return Array.from(this.testRuns.values());
  }

  getTestRunsByStatus(status) {
    return Array.from(this.testRuns.values()).filter(run => run.status === status);
  }
}

module.exports = new TestingService();