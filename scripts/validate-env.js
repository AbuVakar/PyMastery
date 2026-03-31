#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ANSI color codes for better output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
};

function colorLog(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Security validation rules
const securityRules = {
  JWT_SECRET_KEY: {
    required: true,
    minLength: 32,
    description: 'JWT secret key must be at least 32 characters long',
    pattern: /^[a-zA-Z0-9._-]+$/,
  },
  MONGODB_URL: {
    required: true,
    pattern: /^mongodb:\/\//,
    description: 'MongoDB URL must start with mongodb://',
  },
  OPENAI_API_KEY: {
    required: false,
    pattern: /^sk-[a-zA-Z0-9]{48}$/,
    description: 'OpenAI API key must be valid format (sk-...) or leave empty',
  },
  JUDGE0_API_KEY: {
    required: false,
    minLength: 10,
    description: 'Judge0 API key must be at least 10 characters or leave empty',
  },
  REDIS_URL: {
    required: false,
    pattern: /^redis:\/\//,
    description: 'Redis URL must start with redis://',
  },
  ENVIRONMENT: {
    required: true,
    allowedValues: ['development', 'staging', 'production'],
    description: 'Environment must be development, staging, or production',
  },
  PORT: {
    required: true,
    min: 1,
    max: 65535,
    description: 'Port must be between 1 and 65535',
  },
};

// Load environment file
function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      colorLog(colors.yellow, `⚠️  Environment file not found: ${filePath}`);
      return {};
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=').trim();
        }
      }
    });

    return env;
  } catch (error) {
    colorLog(colors.red, `❌ Error loading environment file: ${error.message}`);
    return {};
  }
}

// Validate environment variables
function validateEnvironment(env, envName) {
  const errors = [];
  const warnings = [];

  colorLog(colors.cyan, `\n🔍 Validating ${envName} environment...\n`);

  Object.entries(securityRules).forEach(([key, rule]) => {
    const value = env[key];

    // Check if required
    if (rule.required && !value) {
      errors.push(`❌ ${key}: Required but missing`);
      return;
    }

    // Skip validation if not required and empty
    if (!rule.required && !value) {
      warnings.push(`⚠️  ${key}: Not configured (optional)`);
      return;
    }

    // Pattern validation
    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors.push(`❌ ${key}: ${rule.description}`);
      return;
    }

    // Length validation
    if (rule.minLength && value && value.length < rule.minLength) {
      errors.push(`❌ ${key}: ${rule.description}`);
      return;
    }

    // Range validation
    if (rule.min && value && parseInt(value) < rule.min) {
      errors.push(`❌ ${key}: ${rule.description}`);
      return;
    }

    if (rule.max && value && parseInt(value) > rule.max) {
      errors.push(`❌ ${key}: ${rule.description}`);
      return;
    }

    // Allowed values validation
    if (rule.allowedValues && value && !rule.allowedValues.includes(value)) {
      errors.push(`❌ ${key}: ${rule.description}`);
      return;
    }

    // Success
    colorLog(colors.green, `✅ ${key}: Valid`);
  });

  return { errors, warnings };
}

// Generate secure random key
function generateSecureKey(length = 64) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

// Main validation
function main() {
  const envFile = process.argv[2] || '.env';
  const env = loadEnvFile(envFile);

  colorLog(colors.blue, '🚀 PyMastery Environment Validator');
  colorLog(colors.blue, '=====================================');

  const { errors, warnings } = validateEnvironment(env, envFile);

  // Print results
  if (errors.length > 0) {
    colorLog(colors.red, '\n❌ SECURITY ISSUES FOUND:');
    errors.forEach(error => colorLog(colors.red, error));
  }

  if (warnings.length > 0) {
    colorLog(colors.yellow, '\n⚠️  WARNINGS:');
    warnings.forEach(warning => colorLog(colors.yellow, warning));
  }

  // Security recommendations
  if (env.JWT_SECRET_KEY && env.JWT_SECRET_KEY.includes('your-secret-key')) {
    colorLog(colors.red, '\n🚨 CRITICAL: Default JWT secret detected!');
    colorLog(colors.red, 'Please generate a secure key:');
    colorLog(colors.cyan, `JWT_SECRET_KEY=${generateSecureKey()}`);
  }

  if (env.ENVIRONMENT === 'production' && env.JWT_SECRET_KEY.length < 64) {
    colorLog(colors.red, '\n🚨 WARNING: JWT secret should be at least 64 characters in production');
  }

  // Summary
  colorLog(colors.blue, '\n📊 SUMMARY:');
  if (errors.length === 0) {
    colorLog(colors.green, '✅ All security checks passed!');
  } else {
    colorLog(colors.red, `❌ ${errors.length} security issues found`);
  }

  if (warnings.length > 0) {
    colorLog(colors.yellow, `⚠️  ${warnings.length} warnings`);
  }

  // Exit with appropriate code
  process.exit(errors.length > 0 ? 1 : 0);
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = { loadEnvFile, validateEnvironment, generateSecureKey };
