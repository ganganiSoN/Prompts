const express = require('express');
const app = express();
app.use('/api/users', require('./src/routes/user.routes'));

app.listen(5001, () => {
    const request = require('http').request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/users/profile',
        method: 'GET'
    }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Response from 5001:', res.statusCode, data);
            process.exit(0);
        });
    });
    request.end();
});


