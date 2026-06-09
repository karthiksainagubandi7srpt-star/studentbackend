const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Dynamic in-memory list mimicking a database deployment
let usersDatabase = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'user', password: 'user123', role: 'user' }
];

// 1. Authentication Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Scan our list for an exact matching credential pair
    const foundUser = usersDatabase.find(u => u.username === username && u.password === password);

    if (foundUser) {
        return res.json({ success: true, role: foundUser.role, username: foundUser.username });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials provided.' });
    }
});

// 2. User Creation Endpoint (Admin Access Restricted)
app.post('/api/create-user', (req, res) => {
    const { newUsername, newPassword, newRole, adminUsername } = req.body;

    // Direct structural safety check: ensure the request genuinely originated from an admin profile
    const verifyingAdmin = usersDatabase.find(u => u.username === adminUsername && u.role === 'admin');
    if (!verifyingAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized access denial.' });
    }

    // Uniqueness validation check: block duplicates
    const userExists = usersDatabase.some(u => u.username === newUsername);
    if (userExists) {
        return res.status(400).json({ success: false, message: 'Username is already taken.' });
    }

    // Append the newly formed record directly to our array container
    usersDatabase.push({ username: newUsername, password: newPassword, role: newRole });
    console.log(`Database updated! Total account registers: ${usersDatabase.length}`);

    return res.json({ success: true, message: `Account created successfully for ${newUsername}!` });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
