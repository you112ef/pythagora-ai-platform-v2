const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Generate code
router.post('/generate-code', [
  body('prompt').trim().notEmpty().withMessage('Prompt is required'),
  body('language').optional().trim(),
  body('framework').optional().trim(),
  body('model').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { prompt, language = 'javascript', framework = 'react', model = 'gpt-4' } = req.body;

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate demo code based on prompt
    const generatedCode = generateDemoCode(prompt, language, framework);

    res.json({
      success: true,
      data: {
        generatedCode,
        model,
        language,
        framework,
        tokensUsed: Math.floor(Math.random() * 1000) + 500,
        cost: (Math.random() * 0.05 + 0.01).toFixed(4)
      }
    });
  } catch (error) {
    console.error('Generate code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate code'
    });
  }
});

// Review code
router.post('/review-code', [
  body('code').trim().notEmpty().withMessage('Code is required'),
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

    const { code, language = 'javascript' } = req.body;

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const review = generateDemoCodeReview(code, language);

    res.json({
      success: true,
      data: {
        review,
        language,
        tokensUsed: Math.floor(Math.random() * 500) + 200,
        cost: (Math.random() * 0.02 + 0.005).toFixed(4)
      }
    });
  } catch (error) {
    console.error('Review code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review code'
    });
  }
});

// Debug code
router.post('/debug-code', [
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('error').trim().notEmpty().withMessage('Error message is required'),
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

    const { code, error, language = 'javascript' } = req.body;

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1800));

    const debugAnalysis = generateDemoDebugAnalysis(code, error, language);

    res.json({
      success: true,
      data: {
        debugAnalysis,
        language,
        tokensUsed: Math.floor(Math.random() * 600) + 300,
        cost: (Math.random() * 0.03 + 0.01).toFixed(4)
      }
    });
  } catch (error) {
    console.error('Debug code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to debug code'
    });
  }
});

// Generate tests
router.post('/generate-tests', [
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('testFramework').optional().trim(),
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

    const { code, testFramework = 'jest', language = 'javascript' } = req.body;

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2500));

    const generatedTests = generateDemoTests(code, testFramework, language);

    res.json({
      success: true,
      data: {
        generatedTests,
        testFramework,
        language,
        tokensUsed: Math.floor(Math.random() * 800) + 400,
        cost: (Math.random() * 0.04 + 0.015).toFixed(4)
      }
    });
  } catch (error) {
    console.error('Generate tests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate tests'
    });
  }
});

// Generate documentation
router.post('/generate-docs', [
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('format').optional().trim(),
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

    const { code, format = 'markdown', language = 'javascript' } = req.body;

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1200));

    const documentation = generateDemoDocumentation(code, format, language);

    res.json({
      success: true,
      data: {
        documentation,
        format,
        language,
        tokensUsed: Math.floor(Math.random() * 400) + 200,
        cost: (Math.random() * 0.02 + 0.008).toFixed(4)
      }
    });
  } catch (error) {
    console.error('Generate docs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate documentation'
    });
  }
});

// Helper functions for demo responses
function generateDemoCode(prompt, language, framework) {
  const codeTemplates = {
    javascript: {
      react: `import React, { useState, useEffect } from 'react';

const ${extractComponentName(prompt)} = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data logic here
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="${extractComponentName(prompt).toLowerCase()}">
      <h1>${extractComponentName(prompt)}</h1>
      {data && (
        <div>
          {/* Render your data here */}
        </div>
      )}
    </div>
  );
};

export default ${extractComponentName(prompt)};`,
      express: `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/data', async (req, res) => {
  try {
    // Your data fetching logic here
    const data = { message: 'Hello from API' };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`
    },
    python: {
      django: `from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def api_view(request):
    if request.method == 'GET':
        return JsonResponse({'status': 'OK', 'message': 'Hello from Django API'})
    
    elif request.method == 'POST':
        data = json.loads(request.body)
        # Process your data here
        return JsonResponse({'received': data})
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)`
    }
  };

  return codeTemplates[language]?.[framework] || `// Generated code for: ${prompt}\n// Language: ${language}\n// Framework: ${framework}\n\nfunction ${extractComponentName(prompt)}() {\n  // Your implementation here\n  return null;\n}`;
}

function generateDemoCodeReview(code, language) {
  return {
    overallScore: Math.floor(Math.random() * 20) + 80,
    issues: [
      {
        type: 'warning',
        message: 'Consider adding error handling for async operations',
        line: Math.floor(Math.random() * 20) + 1,
        severity: 'medium'
      },
      {
        type: 'suggestion',
        message: 'This function could be optimized for better performance',
        line: Math.floor(Math.random() * 20) + 1,
        severity: 'low'
      }
    ],
    suggestions: [
      'Add input validation',
      'Consider using TypeScript for better type safety',
      'Add unit tests for this function'
    ],
    summary: 'The code is generally well-structured and follows good practices. A few minor improvements could enhance maintainability and performance.'
  };
}

function generateDemoDebugAnalysis(code, error, language) {
  return {
    errorType: 'TypeError',
    description: 'The error occurs because of a type mismatch in the function call',
    solution: 'Add proper type checking before calling the function',
    fixedCode: code.replace(/function/g, '// Fixed: function'),
    steps: [
      'Check the variable types before using them',
      'Add null/undefined checks',
      'Use proper error handling with try-catch blocks'
    ],
    prevention: 'Always validate input parameters and use TypeScript for better type safety'
  };
}

function generateDemoTests(code, framework, language) {
  return {
    unitTests: `describe('${extractComponentName(code)}', () => {
  test('should render correctly', () => {
    // Test implementation
    expect(true).toBe(true);
  });

  test('should handle user interaction', () => {
    // Test implementation
    expect(true).toBe(true);
  });
});`,
    integrationTests: `describe('API Integration', () => {
  test('should fetch data successfully', async () => {
    // Integration test implementation
    expect(true).toBe(true);
  });
});`,
    coverage: Math.floor(Math.random() * 20) + 80
  };
}

function generateDemoDocumentation(code, format, language) {
  if (format === 'markdown') {
    return `# ${extractComponentName(code)}

## Description
This component handles the main functionality for the application.

## Usage
\`\`\`${language}
${code}
\`\`\`

## Parameters
- \`param1\`: Description of parameter 1
- \`param2\`: Description of parameter 2

## Returns
Returns the processed result.

## Example
\`\`\`${language}
// Example usage
const result = ${extractComponentName(code)}();
\`\`\``;
  }
  
  return `Documentation for ${extractComponentName(code)} in ${format} format`;
}

function extractComponentName(text) {
  const words = text.toLowerCase().split(' ');
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

module.exports = router;