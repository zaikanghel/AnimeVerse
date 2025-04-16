/**
 * Script to test admin login and authentication
 * Run with: node scripts/test-admin-login.js
 */

import fetch from 'node-fetch';

async function testAdminLogin() {
  console.log('Testing admin login...');
  
  try {
    // Try to login as admin
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
    
    const loginData = await loginResponse.json();
    
    console.log('Login response status:', loginResponse.status);
    console.log('Login response data:', loginData);
    
    if (loginResponse.status !== 200) {
      console.error('Failed to login as admin');
      return;
    }
    
    console.log('Admin login successful!');
    console.log('Is admin:', loginData.isAdmin);
    console.log('Is admin type:', typeof loginData.isAdmin);
    
    // Get the cookies from the response
    const cookies = loginResponse.headers.get('set-cookie');
    
    if (!cookies) {
      console.error('No cookies received from login');
      return;
    }
    
    console.log('Received cookies. Now trying to access /api/auth/me endpoint...');
    
    // Try to access /api/auth/me
    const meResponse = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        'Cookie': cookies,
      },
    });
    
    const meData = await meResponse.json();
    
    console.log('/me response status:', meResponse.status);
    console.log('/me response data:', meData);
    
    console.log('Is admin from /me:', meData.isAdmin);
    console.log('Is admin type from /me:', typeof meData.isAdmin);
  } catch (error) {
    console.error('Error testing admin login:', error);
  }
}

testAdminLogin();