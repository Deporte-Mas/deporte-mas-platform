#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 *
 * Validates that all required environment variables are present and properly formatted.
 * Run this before starting development or building for production.
 *
 * Usage:
 *   node scripts/validate-env.js
 *   npm run validate-env
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Required environment variables
const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_DEV_MODE',
];

// Conditionally required based on DEV_MODE
const DEV_MODE_VARS = {
  true: ['VITE_STRIPE_TEST_PUBLISHABLE_KEY'],
  false: ['VITE_STRIPE_PUBLISHABLE_KEY'],
};

// Optional variables
const OPTIONAL_VARS = [
  'VITE_META_PIXEL_ID',
];

// Validation patterns
const PATTERNS = {
  VITE_SUPABASE_URL: /^https:\/\/[a-z0-9-]+\.supabase\.co$/,
  VITE_SUPABASE_PUBLISHABLE_KEY: /^(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|sb_publishable_[A-Za-z0-9]+)$/,
  VITE_STRIPE_TEST_PUBLISHABLE_KEY: /^pk_test_[A-Za-z0-9]+$/,
  VITE_STRIPE_PUBLISHABLE_KEY: /^pk_live_[A-Za-z0-9]+$/,
  VITE_DEV_MODE: /^(true|false)$/,
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadEnv() {
  try {
    const envPath = join(rootDir, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};

    envContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;

      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });

    return env;
  } catch (error) {
    return null;
  }
}

function validateVariable(name, value, isRequired = true) {
  const issues = [];

  // Check if variable exists
  if (!value || value === '') {
    if (isRequired) {
      issues.push(`Missing required variable: ${name}`);
    }
    return issues;
  }

  // Check if it's a placeholder
  if (value.includes('your-') || value.includes('YOUR_')) {
    issues.push(`${name} contains placeholder value`);
  }

  // Check pattern if defined
  if (PATTERNS[name] && !PATTERNS[name].test(value)) {
    issues.push(`${name} has invalid format`);
  }

  return issues;
}

function main() {
  log('\n🔍 Validating Environment Variables...\n', 'cyan');

  const env = loadEnv();

  if (!env) {
    log('❌ ERROR: .env file not found', 'red');
    log('\nℹ️  Create .env file:', 'yellow');
    log('   cp .env.example .env', 'yellow');
    log('   Then edit .env with your actual values\n', 'yellow');
    process.exit(1);
  }

  const errors = [];
  const warnings = [];
  const success = [];

  // Validate required variables
  log('📋 Required Variables:', 'blue');
  REQUIRED_VARS.forEach(varName => {
    const issues = validateVariable(varName, env[varName], true);
    if (issues.length > 0) {
      errors.push(...issues);
      log(`  ❌ ${varName}`, 'red');
      issues.forEach(issue => log(`     ${issue}`, 'red'));
    } else {
      success.push(varName);
      log(`  ✅ ${varName}`, 'green');
    }
  });

  // Validate mode-specific variables
  const devMode = env.VITE_DEV_MODE;
  if (devMode === 'true' || devMode === 'false') {
    const modeVars = DEV_MODE_VARS[devMode];
    log(`\n📋 ${devMode === 'true' ? 'Development' : 'Production'} Mode Variables:`, 'blue');

    modeVars.forEach(varName => {
      const issues = validateVariable(varName, env[varName], true);
      if (issues.length > 0) {
        errors.push(...issues);
        log(`  ❌ ${varName}`, 'red');
        issues.forEach(issue => log(`     ${issue}`, 'red'));
      } else {
        success.push(varName);
        log(`  ✅ ${varName}`, 'green');
      }
    });
  }

  // Validate optional variables
  log('\n📋 Optional Variables:', 'blue');
  OPTIONAL_VARS.forEach(varName => {
    const issues = validateVariable(varName, env[varName], false);
    if (env[varName] && env[varName] !== '') {
      if (issues.length > 0) {
        warnings.push(...issues);
        log(`  ⚠️  ${varName} (has issues)`, 'yellow');
        issues.forEach(issue => log(`     ${issue}`, 'yellow'));
      } else {
        success.push(varName);
        log(`  ✅ ${varName}`, 'green');
      }
    } else {
      log(`  ⚪ ${varName} (not set)`, 'cyan');
    }
  });

  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log('Summary:', 'cyan');
  log(`  ✅ Valid: ${success.length}`, 'green');
  if (warnings.length > 0) {
    log(`  ⚠️  Warnings: ${warnings.length}`, 'yellow');
  }
  if (errors.length > 0) {
    log(`  ❌ Errors: ${errors.length}`, 'red');
  }

  if (errors.length > 0) {
    log('\n❌ Environment validation FAILED', 'red');
    log('\nℹ️  Fix the errors above and try again.', 'yellow');
    log('   See .env.example for reference values.\n', 'yellow');
    process.exit(1);
  } else if (warnings.length > 0) {
    log('\n⚠️  Environment validation passed with warnings', 'yellow');
    log('   Fix warnings to ensure proper functionality.\n', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ Environment validation PASSED', 'green');
    log('   All required variables are set correctly.\n', 'green');
    process.exit(0);
  }
}

main();
