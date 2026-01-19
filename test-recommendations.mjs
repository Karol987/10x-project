// Quick test script for recommendations endpoint
import fetch from 'node-fetch';

async function testRecommendations() {
  try {
    console.log('Testing recommendations endpoint...');
    
    // You'll need to replace this with your actual session cookie
    const response = await fetch('http://localhost:3001/api/recommendations?limit=50', {
      headers: {
        'Cookie': 'YOUR_SESSION_COOKIE_HERE' // Replace with actual cookie from browser
      }
    });
    
    const data = await response.json();
    console.log('\nResponse status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testRecommendations();
