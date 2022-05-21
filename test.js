const express = require('express');
const app = express();
const fs = require('fs');
const serv = require('http').Server(app);

app.get('/', function(req,res) {
    res.sendFile(__dirname + '/index.html');
    console.log('express connection');
});
app.use('/', express.static(__dirname + '/'));

serv.listen(3000);
console.log('server started');