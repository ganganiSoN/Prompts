const app = require('./server.js');
// wait, server.js doesn't export app! It just calls app.listen()

const express = require('express');
const tempApp = express();
tempApp.use('/api/users', require('./src/routes/user.routes'));

const request = require('http').request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/profile',
    method: 'GET'
}, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Response:', res.statusCode, data));
});
request.end();

