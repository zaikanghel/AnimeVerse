/**
 * Script to test creating an episode through the admin API
 * Run with: node scripts/test-admin-create-episode.js
 */
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testCreateEpisode() {
  try {
    console.log('Testing creating episode through admin API...');
    
    // First, login as admin to get auth cookie
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Admin login failed:', await loginResponse.text());
      return;
    }
    
    // Save cookies to file for future requests
    const cookies = loginResponse.headers.get('set-cookie');
    fs.writeFileSync(path.join(__dirname, '..', 'cookies.txt'), cookies);
    
    console.log('Admin login successful!');
    
    // Get all animes to find one to add an episode to
    const animesResponse = await fetch('http://localhost:5000/api/animes', {
      headers: {
        Cookie: cookies
      }
    });
    
    if (!animesResponse.ok) {
      console.error('Failed to fetch animes:', await animesResponse.text());
      return;
    }
    
    const animes = await animesResponse.json();
    if (!animes || animes.length === 0) {
      console.error('No animes found to add an episode to');
      return;
    }
    
    // Take the first anime
    const anime = animes[0];
    console.log(`Selected anime: ${anime.title} (ID: ${anime.id})`);
    
    // Create an episode for this anime
    const randomNum = Math.floor(Math.random() * 1000);
    const episodeData = {
      animeId: anime.id.toString(), // Ensure string format
      title: `Test Episode ${randomNum}`,
      number: 1,
      description: 'This is a test episode created through the admin API',
      thumbnail: 'https://example.com/test-thumbnail.jpg',
      videoUrl: 'https://example.com/test-video.mp4',
      duration: '24:00',
      releaseDate: new Date().toISOString()
    };
    
    console.log('Creating episode with data:', episodeData);
    
    const createResponse = await fetch('http://localhost:5000/api/admin/episodes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies
      },
      body: JSON.stringify(episodeData)
    });
    
    console.log(`Create episode response status: ${createResponse.status}`);
    
    if (!createResponse.ok) {
      console.error('Failed to create episode:', await createResponse.text());
      return;
    }
    
    const createdEpisode = await createResponse.json();
    console.log('Created episode:', createdEpisode);
    
    // Verify the episode was added by fetching episodes for this anime
    const episodesResponse = await fetch(`http://localhost:5000/api/animes/${anime.id}/episodes`, {
      headers: {
        Cookie: cookies
      }
    });
    
    if (!episodesResponse.ok) {
      console.error(`Failed to fetch episodes for anime ${anime.id}:`, await episodesResponse.text());
      return;
    }
    
    const episodes = await episodesResponse.json();
    console.log(`Found ${episodes.length} episodes for anime ${anime.title}`);
    
    // Check if our created episode is in the list
    const foundEpisode = episodes.find(e => e.id === createdEpisode.id);
    if (foundEpisode) {
      console.log('Verification successful! Episode was correctly added to the database.');
    } else {
      console.error('Verification failed! Created episode not found in the database.');
    }
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

testCreateEpisode();