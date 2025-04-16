/**
 * Script to test creating an anime through the admin API
 * Run with: node scripts/test-admin-create-anime.js
 */

import fetch from 'node-fetch';

async function testCreateAnime() {
  console.log('Testing creating anime through admin API...');
  
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
    
    if (loginResponse.status !== 200) {
      console.error('Failed to login as admin');
      return;
    }
    
    console.log('Admin login successful!');
    
    // Get the cookies from the response
    const cookies = loginResponse.headers.get('set-cookie');
    
    if (!cookies) {
      console.error('No cookies received from login');
      return;
    }
    
    console.log('Received cookies. Now trying to create an anime...');
    
    // Create a test anime
    const testAnime = {
      title: "Test Anime " + new Date().toISOString(),
      description: "This is a test anime created through the admin API",
      coverImage: "https://example.com/test-cover.jpg",
      bannerImage: "https://example.com/test-banner.jpg",
      releaseYear: 2025,
      status: "Ongoing",
      type: "TV",
      episodes: 12,
      rating: "8.5",
      studio: "Test Studio"
    };
    
    // Try to create anime via /api/admin/animes
    const createResponse = await fetch('http://localhost:5000/api/admin/animes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      body: JSON.stringify(testAnime),
    });
    
    console.log('Create anime response status:', createResponse.status);
    
    if (createResponse.status === 201 || createResponse.status === 200) {
      const animeData = await createResponse.json();
      console.log('Created anime:', animeData);
    } else {
      const errorData = await createResponse.text();
      console.error('Failed to create anime:', errorData);
    }
  } catch (error) {
    console.error('Error testing create anime:', error);
  }
}

testCreateAnime();