const axios = require('axios');

async function testSignup() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/signup', {
            name: 'Test Name 123',
            email: `testuser${Date.now()}@example.com`,
            password: 'password123',
            hasAcceptedTerms: true,
            hasVerifiedAge: true
        });
        console.log('Signup Response:', response.data);
    } catch (e) {
        if (e.response) {
            console.error('Signup Error Response:', e.response.data);
        } else {
            console.error('Signup Error:', e.message);
        }
    }
}

testSignup();
