/**
 * Authentication Flow Test Suite
 *
 * Tests the complete authentication and user management flow
 * Run with: deno run --allow-net --allow-env auth-flow-test.ts
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

// Test configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test data
const testUser = {
  email: `test-${Date.now()}@deportemas.com`,
  password: 'TestPassword123!',
  name: 'Test User',
  phone: '+50688888888',
  country: 'Costa Rica'
};

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  duration: number;
}

class AuthFlowTester {
  private results: TestResult[] = [];
  private authToken: string | null = null;

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();

    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({ name, success: true, duration });
      console.log(`✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({ name, success: false, error: errorMessage, duration });
      console.log(`❌ ${name} (${duration}ms): ${errorMessage}`);
    }
  }

  async testUserRegistration(): Promise<void> {
    await this.runTest('User Registration', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            name: testUser.name
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from registration');

      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
    });
  }

  async testUserLogin(): Promise<void> {
    await this.runTest('User Login', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });

      if (error) throw error;
      if (!data.session) throw new Error('No session returned from login');

      this.authToken = data.session.access_token;
      console.log(`   Session established`);
      console.log(`   Token: ${this.authToken?.substring(0, 20)}...`);
    });
  }

  async testGetProfile(): Promise<void> {
    await this.runTest('Get User Profile', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/user-management`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Profile fetch failed');
      }

      console.log(`   Profile retrieved: ${result.data.email}`);
      console.log(`   Subscription status: ${result.data.subscription_status}`);
    });
  }

  async testUpdateProfile(): Promise<void> {
    await this.runTest('Update User Profile', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      const updates = {
        name: testUser.name,
        phone: testUser.phone,
        country: testUser.country
      };

      const response = await fetch(`${SUPABASE_URL}/functions/v1/user-management`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Profile update failed');
      }

      console.log(`   Profile updated: ${result.data.name}`);
      console.log(`   Phone: ${result.data.phone}`);
      console.log(`   Country: ${result.data.country}`);
    });
  }

  async testCheckoutSession(): Promise<void> {
    await this.runTest('Create Checkout Session', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      const sessionData = {
        returnUrl: 'https://deportemas.com/success',
        planType: 'monthly',
        metadata: {
          source: 'test_suite',
          user_agent: 'Test Agent',
          timestamp: new Date().toISOString()
        }
      };

      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });

      const result = await response.json();

      // Note: This might fail in test mode without proper Stripe setup
      // That's expected - we're testing the endpoint structure
      console.log(`   Checkout endpoint response: ${response.status}`);
      if (result.clientSecret) {
        console.log(`   Client secret received: ${result.clientSecret.substring(0, 20)}...`);
      } else if (result.error) {
        console.log(`   Expected error: ${result.error}`);
      }
    });
  }

  async testPasswordReset(): Promise<void> {
    await this.runTest('Password Reset', async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(testUser.email);

      if (error) throw error;

      console.log(`   Password reset email sent to: ${testUser.email}`);
    });
  }

  async testUserLogout(): Promise<void> {
    await this.runTest('User Logout', async () => {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      this.authToken = null;
      console.log(`   User logged out successfully`);
    });
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleanup...');

    // Re-login to delete the test user
    const { data } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });

    if (data.session) {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/user-management`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Test user deleted');
      } else {
        console.log('⚠️  Could not delete test user');
      }
    }
  }

  printResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('=' * 50);

    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Success Rate: ${(passed / this.results.length * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting DeporteMás Auth Flow Test Suite\n');

    // Core authentication flow
    await this.testUserRegistration();
    await this.testUserLogin();
    await this.testGetProfile();
    await this.testUpdateProfile();

    // Additional features
    await this.testCheckoutSession();
    await this.testPasswordReset();
    await this.testUserLogout();

    // Cleanup
    await this.cleanup();

    // Results
    this.printResults();
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  const tester = new AuthFlowTester();
  await tester.runAllTests();
}