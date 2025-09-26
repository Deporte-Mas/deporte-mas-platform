#!/usr/bin/env node

/**
 * Stripe Configuration Test Script
 *
 * This script helps verify that all required Stripe environment variables
 * are properly configured before going live.
 *
 * Usage: node scripts/test-stripe-config.js
 */

const requiredVars = {
  frontend: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_DEV_MODE'
  ],
  backend: {
    common: [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ],
    test: [
      'STRIPE_TEST_SECRET_KEY',
      'STRIPE_TEST_PRICE_MONTHLY',
      'STRIPE_TEST_PRICE_ANNUAL',
      'STRIPE_TEST_PRODUCT_MONTHLY',
      'STRIPE_TEST_PRODUCT_ANNUAL'
    ],
    production: [
      'STRIPE_SECRET_KEY',
      'STRIPE_LIVE_PRICE_MONTHLY',
      'STRIPE_LIVE_PRICE_ANNUAL',
      'STRIPE_LIVE_PRODUCT_MONTHLY',
      'STRIPE_LIVE_PRODUCT_ANNUAL'
    ],
    optional: [
      'META_ACCESS_TOKEN',
      'META_PIXEL_ID',
      'ZAPIER_WEBHOOK_URL'
    ]
  }
};

function checkEnvVars() {
  const results = {
    frontend: {},
    backend: {
      common: {},
      test: {},
      production: {},
      optional: {}
    }
  };

  let allGood = true;

  // Check frontend variables
  console.log('🎯 Frontend Environment Variables:');
  requiredVars.frontend.forEach(varName => {
    const value = process.env[varName];
    const isSet = !!value;
    results.frontend[varName] = { isSet, value: isSet ? value.substring(0, 20) + '...' : 'NOT SET' };
    console.log(`  ${isSet ? '✅' : '❌'} ${varName}: ${results.frontend[varName].value}`);
    if (!isSet) allGood = false;
  });

  // Check backend variables
  console.log('\n🔧 Backend Environment Variables (Common):');
  requiredVars.backend.common.forEach(varName => {
    const value = process.env[varName];
    const isSet = !!value;
    results.backend.common[varName] = { isSet, value: isSet ? value.substring(0, 20) + '...' : 'NOT SET' };
    console.log(`  ${isSet ? '✅' : '❌'} ${varName}: ${results.backend.common[varName].value}`);
    if (!isSet) allGood = false;
  });

  console.log('\n🧪 Backend Environment Variables (Test):');
  requiredVars.backend.test.forEach(varName => {
    const value = process.env[varName];
    const isSet = !!value;
    results.backend.test[varName] = { isSet, value: isSet ? value.substring(0, 20) + '...' : 'NOT SET' };
    console.log(`  ${isSet ? '✅' : '❌'} ${varName}: ${results.backend.test[varName].value}`);
  });

  console.log('\n🚀 Backend Environment Variables (Production):');
  requiredVars.backend.production.forEach(varName => {
    const value = process.env[varName];
    const isSet = !!value;
    results.backend.production[varName] = { isSet, value: isSet ? value.substring(0, 20) + '...' : 'NOT SET' };
    console.log(`  ${isSet ? '✅' : '❌'} ${varName}: ${results.backend.production[varName].value}`);
  });

  console.log('\n🎨 Optional Environment Variables:');
  requiredVars.backend.optional.forEach(varName => {
    const value = process.env[varName];
    const isSet = !!value;
    results.backend.optional[varName] = { isSet, value: isSet ? value.substring(0, 20) + '...' : 'NOT SET' };
    console.log(`  ${isSet ? '✅' : '⚠️ '} ${varName}: ${results.backend.optional[varName].value}`);
  });

  // Summary
  console.log('\n📋 Configuration Summary:');
  const devMode = process.env.VITE_DEV_MODE === 'true';
  console.log(`  Mode: ${devMode ? 'Development' : 'Production'}`);

  const testConfigComplete = requiredVars.backend.test.every(varName => !!process.env[varName]);
  const prodConfigComplete = requiredVars.backend.production.every(varName => !!process.env[varName]);

  console.log(`  Test configuration: ${testConfigComplete ? '✅ Complete' : '❌ Incomplete'}`);
  console.log(`  Production configuration: ${prodConfigComplete ? '✅ Complete' : '❌ Incomplete'}`);

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (devMode && !testConfigComplete) {
    console.log('  ⚠️  You\'re in development mode but test Stripe configuration is incomplete');
    console.log('  ⚠️  Set up test products in Stripe Dashboard and update environment variables');
  }

  if (!devMode && !prodConfigComplete) {
    console.log('  🚨 You\'re in production mode but live Stripe configuration is incomplete');
    console.log('  🚨 This will cause checkout failures!');
  }

  if (!results.backend.optional.META_ACCESS_TOKEN.isSet) {
    console.log('  ℹ️  Meta Conversion API not configured - Facebook conversion tracking disabled');
  }

  if (!results.backend.optional.ZAPIER_WEBHOOK_URL.isSet) {
    console.log('  ℹ️  Zapier webhook not configured - automation integrations disabled');
  }

  console.log('\n📚 Next Steps:');
  console.log('  1. Review STRIPE_CONFIG.md for detailed setup instructions');
  console.log('  2. Configure missing environment variables in Supabase Dashboard');
  console.log('  3. Test with Stripe test cards before going live');
  console.log('  4. Set up webhook endpoint in Stripe Dashboard');

  return allGood;
}

// Run the check
if (require.main === module) {
  console.log('🔍 Stripe Configuration Checker\n');
  const configValid = checkEnvVars();
  process.exit(configValid ? 0 : 1);
}

module.exports = { checkEnvVars };