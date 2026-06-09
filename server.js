const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so your GitHub Pages frontend can talk to your Render backend
app.use(cors({
    origin: '*' // In production, replace with your actual GitHub Pages URL
}));
app.use(express.json());

// Mock database check (Replace this with real database queries later)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'admin123') {
        return res.json({ success: true, role: 'admin' });
    } else if (username === 'user' && password === 'user123') {
        return res.json({ success: true, role: 'user' });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
