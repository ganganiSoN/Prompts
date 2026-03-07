async function test() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'superadmin@mail.com', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        console.log("Login Data:", loginData);

        let token;
        if (loginData.mfaRequired) {
            const mfaRes = await fetch('http://localhost:5000/api/auth/verify-mfa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tempToken: loginData.tempToken, mfaCode: '123456' })
            });
            const mfaData = await mfaRes.json();
            console.log("MFA Data:", mfaData);
            token = mfaData.token;
        } else {
            token = loginData.token;
        }

        console.log("Using Token:", token);
        const profileRes = await fetch('http://localhost:5000/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        console.log("Profile Data:", JSON.stringify(profileData, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
