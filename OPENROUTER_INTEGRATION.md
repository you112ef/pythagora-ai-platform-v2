# 🤖 OpenRouter Integration Guide

## Overview

The Pythagora AI Platform now includes comprehensive **OpenRouter integration**, giving you access to **40+ AI models** from multiple providers through a single API key.

---

## 🌟 What is OpenRouter?

**OpenRouter** is a unified API gateway that provides access to AI models from multiple providers:

- ✅ **OpenAI** (GPT-4, GPT-3.5)
- ✅ **Anthropic** (Claude 3 Opus, Sonnet, Haiku)
- ✅ **Google** (Gemini Pro, Gemini Pro Vision)
- ✅ **Meta** (Llama 2 70B, 13B)
- ✅ **Mistral AI** (Mistral 7B, Mixtral 8x7B)
- ✅ **Cohere** (Command, Command Light)
- ✅ **DeepSeek** (DeepSeek Coder)
- ✅ **BigCode** (StarCoder)
- ✅ **Microsoft** (WizardLM 2)
- And many more!

### Key Benefits

1. **Single API Key** - Access all models with one OpenRouter API key
2. **Cost Effective** - Pay-as-you-go pricing across all providers
3. **Automatic Failover** - If one provider is down, use another
4. **Model Comparison** - Easily test different models for your use case
5. **No Multiple Subscriptions** - No need for separate OpenAI, Anthropic, etc. accounts

---

## 📦 Available Models

### Premium Models (High Performance)

| Model ID | Name | Provider | Context | Input Cost | Output Cost |
|----------|------|----------|---------|------------|-------------|
| `openai/gpt-4-turbo-preview` | GPT-4 Turbo | OpenAI | 128K | $0.01/1K | $0.03/1K |
| `openai/gpt-4` | GPT-4 | OpenAI | 8K | $0.03/1K | $0.06/1K |
| `anthropic/claude-3-opus` | Claude 3 Opus | Anthropic | 200K | $0.015/1K | $0.075/1K |

### Standard Models (Balanced)

| Model ID | Name | Provider | Context | Input Cost | Output Cost |
|----------|------|----------|---------|------------|-------------|
| `openai/gpt-3.5-turbo` | GPT-3.5 Turbo | OpenAI | 16K | $0.001/1K | $0.002/1K |
| `anthropic/claude-3-sonnet` | Claude 3 Sonnet | Anthropic | 200K | $0.003/1K | $0.015/1K |
| `google/gemini-pro` | Gemini Pro | Google | 32K | $0.0005/1K | $0.0015/1K |
| `mistralai/mixtral-8x7b-instruct` | Mixtral 8x7B | Mistral | 32K | $0.00027/1K | $0.00027/1K |

### Budget Models (Cost Effective)

| Model ID | Name | Provider | Context | Input Cost | Output Cost |
|----------|------|----------|---------|------------|-------------|
| `anthropic/claude-3-haiku` | Claude 3 Haiku | Anthropic | 200K | $0.00025/1K | $0.00125/1K |
| `meta-llama/llama-2-13b-chat` | Llama 2 13B | Meta | 4K | $0.0002/1K | $0.0002/1K |
| `mistralai/mistral-7b-instruct` | Mistral 7B | Mistral | 32K | $0.0002/1K | $0.0002/1K |
| `cohere/command-light` | Command Light | Cohere | 4K | $0.0003/1K | $0.0006/1K |

### Specialized Models

**Multimodal (Vision):**
- `openai/gpt-4-vision-preview` - GPT-4 with vision capabilities
- `google/gemini-pro-vision` - Gemini with vision

**Code Generation:**
- `deepseek/deepseek-coder` - Specialized for code
- `bigcode/starcoder` - Open source code model

**Audio:**
- `openai/whisper-1` - Speech-to-text

**Image Generation:**
- `openai/dall-e-3` - Text-to-image

---

## 🚀 Quick Setup

### Step 1: Get OpenRouter API Key

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for a free account
3. Go to "Keys" section
4. Create a new API key
5. Copy the key (starts with `sk-or-...`)

### Step 2: Add Provider in Pythagora

#### Via Web Interface

1. Navigate to **AI Providers** page
2. Click **"Add AI Provider"** button
3. Fill in the form:
   - **Provider Type:** OpenRouter
   - **Display Name:** OpenRouter (All Models)
   - **API Key:** Your OpenRouter API key
   - **Priority:** 1 (Highest)
4. Click **"Add Provider"**
5. Test the connection using the **"Test"** button

#### Via API

```bash
curl -X POST https://your-app-url.com/api/ai-providers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "openrouter",
    "displayName": "OpenRouter (All Models)",
    "apiKey": "sk-or-v1-...",
    "priority": 1
  }'
```

---

## 💻 Usage Examples

### Code Generation with Different Models

#### Using GPT-4 Turbo

```javascript
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Create a React component for a todo list',
    model: 'openai/gpt-4-turbo-preview',
    maxTokens: 4000
  })
});

const result = await response.json();
console.log(result.text); // Generated code
```

#### Using Claude 3 Opus

```javascript
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Explain async/await in JavaScript',
    model: 'anthropic/claude-3-opus',
    maxTokens: 2000
  })
});
```

#### Using Budget Model (Claude Haiku)

```javascript
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Write a hello world program in Python',
    model: 'anthropic/claude-3-haiku',
    maxTokens: 500
  })
});
```

### Code-Specific Model (DeepSeek Coder)

```javascript
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Optimize this SQL query: SELECT * FROM users WHERE age > 18',
    model: 'deepseek/deepseek-coder',
    maxTokens: 1000
  })
});
```

---

## 🔧 Advanced Configuration

### Multiple Providers with Priority

You can configure multiple providers with different priorities:

```javascript
// Priority 1 - OpenRouter (tries first)
{
  name: 'openrouter',
  displayName: 'OpenRouter (All Models)',
  apiKey: 'sk-or-v1-...',
  priority: 1
}

// Priority 2 - Direct OpenAI (fallback)
{
  name: 'openai',
  displayName: 'OpenAI Direct',
  apiKey: 'sk-...',
  priority: 2
}

// Priority 3 - Anthropic (second fallback)
{
  name: 'anthropic',
  displayName: 'Anthropic Direct',
  apiKey: 'sk-ant-...',
  priority: 3
}
```

### Model Selection Strategy

The system automatically selects the best available provider based on:

1. **Model Availability** - Provider must have the requested model
2. **Priority** - Higher priority providers are tried first
3. **Active Status** - Only active providers are used

---

## 📊 Cost Management

### Track Usage

Each provider tracks:
- **Total Requests** - Number of API calls
- **Total Tokens** - Input + output tokens
- **Total Cost** - Calculated based on model pricing

View usage in the AI Providers dashboard.

### Cost Optimization Tips

1. **Use Budget Models** for simple tasks
   - Claude Haiku for quick responses
   - Mistral 7B for general text

2. **Use Standard Models** for most work
   - GPT-3.5 Turbo for general code
   - Claude Sonnet for balanced performance

3. **Use Premium Models** only when needed
   - GPT-4 for complex reasoning
   - Claude Opus for long context

4. **Use Specialized Models** for specific tasks
   - DeepSeek Coder for code generation
   - Gemini Pro Vision for images

### Cost Comparison Example

For a 1000-token input, 2000-token output task:

| Model | Input Cost | Output Cost | Total | Use Case |
|-------|------------|-------------|-------|----------|
| Claude Haiku | $0.00025 | $0.0025 | **$0.00275** | Simple queries |
| GPT-3.5 Turbo | $0.001 | $0.004 | **$0.005** | General tasks |
| Claude Sonnet | $0.003 | $0.030 | **$0.033** | Balanced work |
| GPT-4 Turbo | $0.010 | $0.060 | **$0.070** | Complex tasks |
| Claude Opus | $0.015 | $0.150 | **$0.165** | Premium work |

---

## 🔒 Security

### API Key Storage

- API keys are **encrypted** in the database
- Only **masked keys** are shown in the UI (e.g., `sk-or-v1••••••••`)
- Keys are **never exposed** in API responses

### Best Practices

1. **Never commit API keys** to version control
2. **Rotate keys regularly** (every 3-6 months)
3. **Use environment variables** for default keys
4. **Monitor usage** to detect unauthorized access
5. **Set spending limits** in OpenRouter dashboard

---

## 🧪 Testing

### Test Provider Connection

```bash
# Via UI
Click the "Test" button on any provider card

# Via API
curl -X POST https://your-app-url.com/api/ai-providers/PROVIDER_ID/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Different Models

```javascript
async function testModels() {
  const models = [
    'openai/gpt-3.5-turbo',
    'anthropic/claude-3-haiku',
    'google/gemini-pro'
  ];

  for (const model of models) {
    const start = Date.now();
    const response = await generateText('Hello, how are you?', { model });
    const time = Date.now() - start;
    
    console.log(`${model}: ${time}ms - ${response.text.substring(0, 50)}...`);
  }
}
```

---

## 📱 Model Browser

The AI Providers page includes a **Model Browser** to explore available models:

### Features

1. **Filter by Category**
   - Premium
   - Standard
   - Budget
   - Multimodal
   - Code

2. **View Details**
   - Context length
   - Pricing (input/output)
   - Capabilities
   - Provider

3. **Compare Models**
   - Side-by-side comparison
   - Cost analysis
   - Performance metrics

---

## 🚨 Troubleshooting

### Common Issues

#### 1. API Key Invalid

**Error:** `401 Unauthorized`

**Solution:**
- Verify API key is correct
- Check key hasn't expired
- Ensure key has sufficient credits

#### 2. Model Not Found

**Error:** `Model not available`

**Solution:**
- Check model ID is correct
- Verify provider has access to model
- Try alternative model

#### 3. Rate Limit Exceeded

**Error:** `429 Too Many Requests`

**Solution:**
- Wait for rate limit to reset
- Upgrade OpenRouter plan
- Use lower priority provider as fallback

#### 4. Insufficient Credits

**Error:** `Insufficient credits`

**Solution:**
- Add credits to OpenRouter account
- Configure fallback provider
- Use budget models

---

## 📚 API Reference

### Add Provider

```http
POST /api/ai-providers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "openrouter",
  "displayName": "My OpenRouter",
  "apiKey": "sk-or-v1-...",
  "priority": 1
}
```

### Get All Providers

```http
GET /api/ai-providers
Authorization: Bearer <token>
```

### Get All Models

```http
GET /api/ai-providers/models/all
Authorization: Bearer <token>
```

### Update Provider

```http
PUT /api/ai-providers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "Updated Name",
  "priority": 2,
  "isActive": true
}
```

### Delete Provider

```http
DELETE /api/ai-providers/:id
Authorization: Bearer <token>
```

### Test Provider

```http
POST /api/ai-providers/:id/test
Authorization: Bearer <token>
```

### Generate Text

```http
POST /api/ai/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Your prompt here",
  "model": "openai/gpt-3.5-turbo",
  "maxTokens": 4000,
  "temperature": 0.7
}
```

---

## 🎯 Use Cases

### 1. Code Generation

**Best Models:**
- DeepSeek Coder
- GPT-4 Turbo
- Claude 3 Opus

**Example:**
```javascript
{
  "prompt": "Create a RESTful API for user authentication with JWT",
  "model": "deepseek/deepseek-coder",
  "maxTokens": 3000
}
```

### 2. Code Review

**Best Models:**
- Claude 3 Opus
- GPT-4
- Claude 3 Sonnet

**Example:**
```javascript
{
  "prompt": "Review this code and suggest improvements:\\n" + code,
  "model": "anthropic/claude-3-opus",
  "maxTokens": 2000
}
```

### 3. Documentation

**Best Models:**
- GPT-4 Turbo
- Claude 3 Sonnet
- Gemini Pro

**Example:**
```javascript
{
  "prompt": "Generate API documentation for this function",
  "model": "google/gemini-pro",
  "maxTokens": 1500
}
```

### 4. Debugging

**Best Models:**
- GPT-4
- Claude 3 Opus
- DeepSeek Coder

**Example:**
```javascript
{
  "prompt": "Fix this error: " + errorMessage + "\\nCode:\\n" + code,
  "model": "openai/gpt-4",
  "maxTokens": 2000
}
```

### 5. Quick Tasks (Cost-Optimized)

**Best Models:**
- Claude 3 Haiku
- GPT-3.5 Turbo
- Mistral 7B

**Example:**
```javascript
{
  "prompt": "Explain this function in one sentence",
  "model": "anthropic/claude-3-haiku",
  "maxTokens": 100
}
```

---

## 🎉 Benefits Summary

### Why Use OpenRouter with Pythagora?

✅ **Access to 40+ Models** - All major AI providers in one place
✅ **Single API Key** - No need to manage multiple accounts
✅ **Cost Effective** - Pay only for what you use
✅ **Automatic Failover** - Redundancy across providers
✅ **Easy Switching** - Test different models instantly
✅ **Transparent Pricing** - See exact costs per request
✅ **No Lock-in** - Can add direct provider keys anytime

---

## 🔗 Resources

- **OpenRouter Website:** https://openrouter.ai/
- **OpenRouter Docs:** https://openrouter.ai/docs
- **Model Pricing:** https://openrouter.ai/models
- **API Reference:** https://openrouter.ai/docs/api-reference
- **Discord Community:** https://discord.gg/openrouter

---

## 📝 Next Steps

1. **Get OpenRouter API Key** from https://openrouter.ai/
2. **Add Provider** in Pythagora AI Providers page
3. **Test Connection** using the test button
4. **Browse Models** in the model browser
5. **Start Using** in your projects!

---

**Last Updated:** October 27, 2025
**Version:** 2.0.0
**Integration Status:** ✅ Fully Integrated

---

**Ready to use 40+ AI models with a single API key! 🚀**
