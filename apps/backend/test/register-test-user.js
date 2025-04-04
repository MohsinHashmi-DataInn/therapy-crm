// Script to register a new test user for authentication testing
const axios = require('axios');

// Test user data for registration
const userData = {
  email: 'testuser@example.com',
  password: 'Test123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'STAFF' // Options: ADMIN, STAFF, THERAPIST 
};

console.log('Starting user registration test...');
console.log('Registration data:', {
  email: userData.email,
  firstName: userData.firstName,
  lastName: userData.lastName,
  role: userData.role,
  passwordLength: userData.password.length
});

// Make the registration request
axios.post('http://localhost:5000/api/auth/register', userData, {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})
  .then(response => {
    console.log('Registration successful!');
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
    
    // Now try to login with the newly created user
    console.log('\nNow attempting login with the new user...');
    return axios.post('http://localhost:5000/api/auth/login', {
      email: userData.email,
      password: userData.password
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  })
  .then(loginResponse => {
    console.log('Login successful!');
    console.log('Login Response status:', loginResponse.status);
    console.log('Login Response data:', {
      hasAccessToken: !!loginResponse.data.accessToken,
      tokenLength: loginResponse.data.accessToken?.length,
      user: loginResponse.data.user ? {
        id: loginResponse.data.user.id,
        email: loginResponse.data.user.email,
        role: loginResponse.data.user.role
      } : 'No user data'
    });
    
    console.log('\n✅ TEST PASSED: Successfully registered and logged in with the test user');
    console.log('Use these credentials for future login tests:');
    console.log('- Email:', userData.email);
    console.log('- Password:', userData.password);
  })
  .catch(error => {
    console.error('Operation failed!');
    console.error('Error status:', error.response?.status);
    console.error('Error message:', error.response?.data?.message || error.message);
    console.error('Error details:', error.response?.data || 'No detailed error available');
  });
