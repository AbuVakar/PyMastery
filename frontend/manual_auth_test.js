// Manual Authentication Test
// Run this in browser console on frontend

async function testAuthFlow() {
    console.log('🚀 Starting Authentication Flow Test');
    console.log('=' * 50);
    
    try {
        // Test 1: Health Check
        console.log('🔍 Testing Backend Health...');
        const healthResponse = await fetch('http://localhost:8000/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Backend Health:', healthData.status);
        
        // Test 2: Registration
        console.log('\n🔍 Testing Registration...');
        const regResponse = await fetch('http://localhost:8000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                password: 'TestPassword123!',
                role_track: 'general',
                agree_terms: true
            })
        });
        const regData = await regResponse.json();
        console.log('Registration Status:', regResponse.status);
        console.log('Registration Response:', regData);
        
        // Test 3: Login
        console.log('\n🔍 Testing Login...');
        const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'TestPassword123!'
            })
        });
        const loginData = await loginResponse.json();
        console.log('Login Status:', loginResponse.status);
        console.log('Login Response:', loginData);
        
        if (loginData.success && loginData.token) {
            console.log('✅ Login successful!');
            console.log('🔑 Token:', loginData.token.substring(0, 20) + '...');
            
            // Test 4: Protected Route
            console.log('\n🔍 Testing Protected Route...');
            const protectedResponse = await fetch('http://localhost:8000/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'Content-Type': 'application/json'
                }
            });
            const protectedData = await protectedResponse.json();
            console.log('Protected Route Status:', protectedResponse.status);
            console.log('Protected Route Response:', protectedData);
            
            if (protectedResponse.status === 200) {
                console.log('✅ Protected route accessible!');
            }
        }
        
        console.log('\n' + '=' * 50);
        console.log('🎉 Authentication Flow Test Complete!');
        
    } catch (error) {
        console.error('❌ Test Error:', error);
    }
}

// Run the test
testAuthFlow();
