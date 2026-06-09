const express = require('express');
const cors = require('cors');
const app = express();

// Allow requests from your frontend and parse JSON bodies
app.use(cors());
app.use(express.json()); 

// Send a simple message to the HTML page when it hits this endpoint
app.get('/api/message', (req, res) => {
  res.json({ text: "Hello from the separate Server Repository!" });
});
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = USERS.find(u => u.username === username && u.password === password);

    if (user) {
        req.session.user = { username: user.username, role: user.role };
        // Send a successful JSON response back to the HTML page instead of a redirect
        res.json({ success: true, message: "Login successful!" });
    } else {
        // Send a failure JSON response
        res.status(401).json({ success: false, message: "Invalid username or password." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
