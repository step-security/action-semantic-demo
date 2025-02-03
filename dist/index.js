"use strict";

var express = require('express');
var fs = require('fs');
var app = express();
// Ensures a new timestamp is written to the file on each build
var timestamp = new Date().toISOString();
fs.writeFileSync('./dist/build-timestamp.txt', "Build Time: ".concat(timestamp, "\n"), {
  flag: 'w'
});
app.get('/', function (req, res) {
  res.send('Hello, Secure World! Build Timestamp: ' + timestamp);
});
app.listen(3000, function () {
  console.log('Server running on http://localhost:3000');
});