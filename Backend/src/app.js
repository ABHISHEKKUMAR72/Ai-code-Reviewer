const express = require('express');
const aiRoutes = require('./routes/ai.routes');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Code Review AI API');
});

app.use('/ai', aiRoutes); // Mount AI routes

module.exports = app;