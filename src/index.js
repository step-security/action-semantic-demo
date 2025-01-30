const express = require('express');
const fs = require('fs');
const app = express();

// Ensures a new timestamp is written to the file on each build
const timestamp = new Date().toISOString();
fs.writeFileSync('./dist/build-timestamp.txt', `Build Time: ${timestamp}\n`, { flag: 'w' });

app.get('/', (req, res) => {
  res.send('Hello, Secure World! Build Timestamp: ' + timestamp);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
