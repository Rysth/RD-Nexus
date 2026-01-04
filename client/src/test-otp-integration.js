/**
 * Manual OTP Integration Test
 * 
 * This script can be run in the browser console to test the OTP integration
 * when the application is running via Docker Compose.
 * 
 * Prerequisites:
 * 1. Start services: docker-compose -f docker-compose.dev.yml up -d
 * 2. Open browser to http://localhost:5173
 * 3. Open browser console and paste this script
 */

// Test configuration
const TEST_EMAIL = 'test@example.com';
const API_BASE_URL = 'http://localhost:3000';

// Test functions
async function testSendOtp(email) {
  console.log('🧪 Testing send OTP API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/send_otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    console.log('✅ Send OTP Response:', data);
    
    if (data.success) {
      console.log('✅ Send OTP successful');
      return true;
    } else {
      console.log('❌ Send OTP failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    return false;
  }
}

async function testVerifyOtp(email, code) {
  console.log('🧪 Testing verify OTP API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify_otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });
    
    const data = await response.json();
    console.log('✅ Verify OTP Response:', data);
    
    if (data.success) {
      console.log('✅ Verify OTP successful');
      return true;
    } else {
      console.log('❌ Verify OTP failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    return false;
  }
}

function testAuthStoreIntegration() {
  console.log('🧪 Testing auth store integration...');
  
  // Check if auth store is available
  if (typeof window !== 'undefined' && window.useAuthStore) {
    const authStore = window.useAuthStore.getState();
    
    console.log('✅ Auth store methods available:');
    console.log('- verifyOtp:', typeof authStore.verifyOtp);
    console.log('- resendOtp:', typeof authStore.resendOtp);
    console.log('- setOtpRequired:', typeof authStore.setOtpRequired);
    
    return true;
  } else {
    console.log('❌ Auth store not available in window');
    return false;
  }
}

function testOtpInputComponent() {
  console.log('🧪 Testing OtpInput component...');
  
  // Check if OtpInput component is rendered
  const otpInputs = document.querySelectorAll('input[inputmode="numeric"]');
  
  if (otpInputs.length === 6) {
    console.log('✅ OtpInput component found with 6 input fields');
    
    // Test input functionality
    const firstInput = otpInputs[0];
    if (firstInput) {
      firstInput.focus();
      console.log('✅ First input can be focused');
    }
    
    return true;
  } else {
    console.log('❌ OtpInput component not found or incorrect number of inputs');
    return false;
  }
}

// Main test runner
async function runOtpIntegrationTests() {
  console.log('🚀 Starting OTP Integration Tests...');
  console.log('=====================================');
  
  const results = {
    sendOtp: false,
    verifyOtp: false,
    authStore: false,
    otpInput: false
  };
  
  // Test 1: Auth Store Integration
  results.authStore = testAuthStoreIntegration();
  
  // Test 2: OTP Input Component (if visible)
  results.otpInput = testOtpInputComponent();
  
  // Test 3: Send OTP API
  results.sendOtp = await testSendOtp(TEST_EMAIL);
  
  // Test 4: Verify OTP API (with invalid code)
  results.verifyOtp = await testVerifyOtp(TEST_EMAIL, '123456');
  
  console.log('=====================================');
  console.log('🏁 Test Results Summary:');
  console.log('- Auth Store Integration:', results.authStore ? '✅' : '❌');
  console.log('- OTP Input Component:', results.otpInput ? '✅' : '❌');
  console.log('- Send OTP API:', results.sendOtp ? '✅' : '❌');
  console.log('- Verify OTP API:', results.verifyOtp ? '✅' : '❌');
  
  const allPassed = Object.values(results).every(result => result);
  console.log('Overall:', allPassed ? '✅ All tests passed' : '❌ Some tests failed');
  
  return results;
}

// Instructions for manual testing
console.log(`
🔧 Manual OTP Integration Testing Instructions:

1. Start Docker services:
   docker-compose -f docker-compose.dev.yml up -d

2. Wait for services to be ready, then open:
   http://localhost:5173

3. To test the complete flow:
   a) Go to login page
   b) Enter valid credentials to trigger OTP
   c) Check email for OTP code
   d) Enter code in OTP input
   e) Verify successful authentication

4. Run automated tests:
   runOtpIntegrationTests()

5. Test specific components:
   - testSendOtp('your-email@example.com')
   - testVerifyOtp('your-email@example.com', 'code')
   - testAuthStoreIntegration()
   - testOtpInputComponent()
`);

// Export functions for manual use
if (typeof window !== 'undefined') {
  window.otpTests = {
    runOtpIntegrationTests,
    testSendOtp,
    testVerifyOtp,
    testAuthStoreIntegration,
    testOtpInputComponent
  };
}