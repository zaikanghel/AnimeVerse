/**
 * Script to test admin API access with authentication
 * Run with: node scripts/test-admin-api.js
 */

import fetch from 'node-fetch';

async function testAdminAPI() {
  console.log('Testing admin API access...');
  
  try {
    // First login as admin
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
    
    if (loginResponse.status !== 200) {
      console.error('Failed to login as admin');
      return;
    }
    
    console.log('Admin login successful!');
    console.log('Is admin:', loginData.isAdmin);
    
    // Get the cookies from the response
    const cookies = loginResponse.headers.get('set-cookie');
    
    if (!cookies) {
      console.error('No cookies received from login');
      return;
    }
    
    console.log('Received cookies. Now trying to access admin API...');
    
    // Try to access /api/admin/users
    const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
      headers: {
        'Cookie': cookies,
      },
    });
    
    console.log('/api/admin/users response status:', usersResponse.status);
    
    if (usersResponse.status === 200) {
      const usersData = await usersResponse.json();
      console.log('Got users data:', usersData.length ? `${usersData.length} users` : 'empty array');
    } else {
      const errorData = await usersResponse.json();
      console.error('Failed to access admin API:', errorData);
    }
  } catch (error) {
    console.error('Error testing admin API:', error);
  }
}

testAdminAPI();