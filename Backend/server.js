require('dotenv').config(); // Load environment variables

const app = require('./src/app');
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});