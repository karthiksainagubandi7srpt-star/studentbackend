const express = require('express');
const cors = require('cors');
const app = express();

// Allow requests from your frontend and parse JSON bodies
const express = require('express');
const cors = require('cors'); // Add this line
const app = express();

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        return callback(null, origin); 
    },
    credentials: true 
}));

app.use(express.json()); // Essential for reading req.body

app.use(express.json()); 

// Send a simple message to the HTML page when it hits this endpoint
app.get('/api/message', (req, res) => {
  res.json({ text: "Hello from the separate Server Repository!" });
});
// 3. Your processing endpoint
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
