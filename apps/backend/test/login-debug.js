// Simple script to test login with detailed debugging
const axios = require('axios');

// Different login credentials to test
const testCredentials = [
  {
    name: 'Default Admin',
    data: {
      email: 'admin@example.com',
      password: 'Admin123!'
    }
  },
  {
    name: 'Alternative Admin Password',
    data: {
      email: 'admin@example.com',
      password: 'Password123!'
    }
  },
  {
    name: 'Simple Password',
    data: {
      email: 'admin@example.com',
      password: 'admin123'
    }
  },
  {
    name: 'Common Default Password',
    data: {
      email: 'admin@example.com',
      password: 'password'
    }
  },
  {
    name: 'admin:admin',
    data: {
      email: 'admin@example.com',
      password: 'admin'
    }
  },
  {
    name: 'No Special Chars',
    data: {
      email: 'admin@example.com',
      password: 'Admin123'
    }
  },
  {
    name: 'All Lowercase',
    data: {
      email: 'admin@example.com',
      password: 'admin123!'
    }
  },
  {
    name: 'Staff User',
    data: {
      email: 'staff@example.com',
      password: 'Staff123!'
    }
  }
];

console.log('Starting login tests with multiple credential sets...');

// Function to test login with specific credentials
async function testLogin(credentials, index) {
  console.log(`\n[Test ${index + 1}] Attempting login with: ${credentials.name}`);
  console.log('Login credentials:', {
    email: credentials.data.email,
    passwordLength: credentials.data.password.length,
    password: credentials.data.password.substring(0, 3) + '***' // Show first 3 chars only for security
  });
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', credentials.data, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`[Test ${index + 1}] Login successful!`);
    console.log('Response status:', response.status);
    console.log('Response data:', {
      hasAccessToken: !!response.data.accessToken,
      tokenLength: response.data.accessToken?.length,
      user: response.data.user ? {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role
      } : 'No user data'
    });
    return true;
  } catch (error) {
    console.error(`[Test ${index + 1}] Login failed!`);
    console.error('Error status:', error.response?.status);
    console.error('Error message:', error.response?.data?.message || error.message);
    console.error('Error details:', error.response?.data || 'No detailed error available');
    return false;
  }
}

// Run all login tests sequentially
async function runAllTests() {
  console.log(`Running ${testCredentials.length} login tests...`);
  
  for (let i = 0; i < testCredentials.length; i++) {
    await testLogin(testCredentials[i], i);
  }
  
  console.log('\nAll login tests completed.');
}

// Execute tests
runAllTests();
