async function run() {
  try {
    console.log('Sending test registration request to backend using fetch...');
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test' + Date.now() + '@example.com',
        password: 'Password@123'
      })
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response body:', JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.log('API call failed!', error.message);
  }
}

run();
