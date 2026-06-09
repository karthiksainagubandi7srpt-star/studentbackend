const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS so your separate frontend repository can fetch data from here
app.use(cors()); 

// Send a simple message to the HTML page when it hits this endpoint
app.get('/api/message', (req, res) => {
  res.json({ text: "Hello from the separate Server Repository!" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
