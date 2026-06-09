const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Configure the Database Connection Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, 
    ssl: {
        rejectUnauthorized: false // Required for secure Render database connections
    }
});

// 2. Initialize Database Tables automatically on startup
async function initializeDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const insertDefaultAdminQuery = `
        INSERT INTO users (username, password, role)
        VALUES ('admin', 'admin123', 'admin')
        ON CONFLICT (username) DO NOTHING;
    `;

    try {
        await pool.query(createTableQuery);
        console.log('✅ "users" table checked/created successfully!');

        await pool.query(insertDefaultAdminQuery);
        console.log('✅ Default admin account verified.');
    } catch (err) {
        console.error('❌ Error during database initialization:', err.message);
    }
}

// Run the initialization code immediately
//initializeDatabase();

// 3. Login API Endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2', 
            [username, password]
        );

        if (result.rows.length > 0) {
            const foundUser = result.rows[0];
            return res.json({ success: true, role: foundUser.role, username: foundUser.username });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid credentials provided.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Database lookup error.' });
    }
});

// 4. User Creation API Endpoint
app.post('/api/create-user', async (req, res) => {
    const { newUsername, newPassword, newRole, adminUsername } = req.body;

    try {
        const adminCheck = await pool.query('SELECT role FROM users WHERE username = $1', [adminUsername]);
        if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized access denial.' });
        }

        await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
            [newUsername, newPassword, newRole]
        );

        return res.json({ success: true, message: `Account created successfully for ${newUsername}!` });

    } catch (err) {
        if (err.code === '23505') { 
            return res.status(400).json({ success: false, message: 'Username is already taken.' });
        }
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server processing database error.' });
    }
});
// 5. Fetch All Database Rows Endpoint
app.get('/api/view-users', async (req, res) => {
    try {
        // Query execution statement retrieving account logs
        const result = await pool.query(
            'SELECT id, username, role, created_at FROM users ORDER BY id ASC'
        );
        
        // Dispatches structural rows back to the calling client frontend
        return res.json({ success: true, users: result.rows });
    } catch (err) {
        console.error('Database fetch operation error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to extract database logs.' });
    }
});

//  FIX 1: Changed app.get to app.post to match your frontend fetch
app.post('/api/add-user', async (req, res) => {
    const { username, email, age, gender, contactNo, score10th, board, address } = req.body;
    
    try {
        //  FIX 2: Changed '?' placeholders to '$1, $2...' for PostgreSQL
        const result = await pool.query(
            `INSERT INTO users (username, email, age, gender, "contactno", "score10th", board, address) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [username, email, age, gender, contactno, score10th, board, address]
        );
        
        // Return a clear success message to match your frontend logic
        return res.json({ success: true, message: 'User added successfully!' });
    } catch (err) {
        console.error('Database insertion error:', err.message);
        return res.status(500).json({ success: false, message: 'Server database error.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
