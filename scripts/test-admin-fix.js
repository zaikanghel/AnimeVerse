/**
 * Script to test the admin authentication and boolean handling fixes
 * Tests login, /me endpoint, and admin status consistency
 */
import fetch from 'node-fetch';

async function testAdminFix() {
  console.log('=== TESTING ADMIN AUTHENTICATION FIX ===');
  console.log('Testing login, /me endpoint and admin status consistency...');
  
  try {
    // Step 1: Try to login as admin
    console.log('\n1. Testing admin login with credentials...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });
    
    if (!loginResponse.ok) {
      console.error(`Login failed with status: ${loginResponse.status}`);
      const errorText = await loginResponse.text();
      console.error(`Error details: ${errorText}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    
    console.log('Login response status:', loginResponse.status);
    console.log('Login response data:', loginData);
    console.log('isAdmin value:', loginData.isAdmin);
    console.log('isAdmin type:', typeof loginData.isAdmin);
    
    // Get the cookies from the response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('\nCookies received from login:', cookies);
    
    if (!cookies) {
      console.error('No cookies received from login');
      return;
    }
    
    // Extract session cookie for better diagnostics
    const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('connect.sid='));
    console.log('Session cookie found:', sessionCookie ? 'Yes' : 'No');
    
    // Extract JWT token if present
    const jwtCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
    console.log('JWT token cookie found:', jwtCookie ? 'Yes' : 'No');
    
    // Step 2: Try to access /api/auth/me
    console.log('\n2. Testing /me endpoint with admin session...');
    const meResponse = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        'Cookie': cookies,
      },
    });
    
    if (!meResponse.ok) {
      console.error(`/me endpoint failed with status: ${meResponse.status}`);
      const errorText = await meResponse.text();
      console.error(`Error details: ${errorText}`);
      return;
    }
    
    const meData = await meResponse.json();
    
    console.log('/me response status:', meResponse.status);
    console.log('/me response data:', meData);
    console.log('isAdmin value from /me:', meData.isAdmin);
    console.log('isAdmin type from /me:', typeof meData.isAdmin);
    
    // Step 3: Test admin API access
    console.log('\n3. Testing admin API access...');
    
    // Let's include an origin and credentials to ensure cookies work properly
    const adminUsersResponse = await fetch('http://localhost:5000/api/admin/users', {
      headers: {
        'Cookie': cookies,
        'Origin': 'http://localhost:5000',
      },
      credentials: 'include',
    });
    
    console.log('Admin users API status:', adminUsersResponse.status);
    if (adminUsersResponse.ok) {
      const users = await adminUsersResponse.json();
      console.log(`Admin API access successful! Retrieved ${users.length} users.`);
      
      // Check isAdmin type consistency
      console.log('\nChecking isAdmin type consistency across users:');
      users.forEach((user, index) => {
        console.log(`User #${index + 1}: ${user.username}, isAdmin: ${user.isAdmin}, type: ${typeof user.isAdmin}`);
      });
    } else {
      console.error('Admin API access failed!');
      const errorText = await adminUsersResponse.text();
      console.error(`Error details: ${errorText}`);
    }
    
    // Test consistency summary
    console.log('\n=== CONSISTENCY CHECK ===');
    if (typeof loginData.isAdmin === 'boolean' && typeof meData.isAdmin === 'boolean') {
      console.log('✅ PASS: isAdmin is consistently boolean type in both responses');
    } else {
      console.error('❌ FAIL: isAdmin type is inconsistent');
      console.error(`Login isAdmin type: ${typeof loginData.isAdmin}`);
      console.error(`/me isAdmin type: ${typeof meData.isAdmin}`);
    }
    
    if (loginData.isAdmin === meData.isAdmin) {
      console.log('✅ PASS: isAdmin value is consistent between login and /me');
    } else {
      console.error('❌ FAIL: isAdmin value is inconsistent');
      console.error(`Login isAdmin value: ${loginData.isAdmin}`);
      console.error(`/me isAdmin value: ${meData.isAdmin}`);
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testAdminFix();