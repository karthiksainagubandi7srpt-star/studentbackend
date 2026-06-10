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


// 3. Login API Endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM logindata WHERE username = $1 AND password = $2', 
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
        const adminCheck = await pool.query('SELECT role FROM logindata WHERE username = $1', [adminUsername]);
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
// 5. Fetch All student data
app.get('/api/view-users', async (req, res) => {
    try {
        // Query execution statement retrieving account logs
        const result = await pool.query(
            'SELECT * FROM users ORDER BY id ASC'
        );
        
        // Dispatches structural rows back to the calling client frontend
        return res.json({ success: true, users: result.rows });
    } catch (err) {
        console.error('Database fetch operation error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to extract database logs.' });
    }
});


// FIXED: Changed ${id} to :id which is Express route parameter syntax
app.get('/api/fetch-student/:id', async (req, res) => {
    try {
        const studentId = req.params.id;

        // FIXED: Added id and marks to SELECT, and a parameterized WHERE clause
        const result = await pool.query(
            'SELECT id, username, marks FROM marks WHERE id = $1',
            [studentId]
        );
        
        // If no student matches that ID
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        // FIXED: Return the individual user object directly to match your frontend expectation
        return res.json(result.rows[0]);

    } catch (err) {
        console.error('Database fetch operation error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to extract database logs.' });
    }
});



app.get('/api/view-marks', async (req, res) => {
    try {
        // Query execution statement retrieving account logs
        const result = await pool.query(
            'SELECT id, username, marks, RANK() OVER (ORDER BY marks DESC) AS calculated_rank FROM marks'
        );
        
        // Dispatches structural rows back to the calling client frontend
        return res.json({ success: true, users: result.rows });
    } catch (err) {
        console.error('Database fetch operation error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to extract database logs.' });
    }
});

//  add students
    app.post('/api/add-user', async (req, res) => {
    const { username, email, age, gender, contactno, score10th, board, address } = req.body;
    
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
//  add student marks
    // Changed endpoint name to 'update-marks' to reflect its purpose accurately
app.put('/api/update-marks/:id', async (req, res) => {
    const studentid = req.params.id;
    const { marks } = req.body; 

    // Quick validation to ensure marks are provided
    if (marks === undefined || marks === null) {
        return res.status(400).json({ success: false, message: 'Marks value is required.' });
    }
    
    try {
        const result = await pool.query(
            `UPDATE marks 
             SET marks = $1 
             WHERE id = $2`,
            [marks, studentid]
        );
        
        // FIXED: Changed 'result.rows.length' to 'result.rowCount' for tracking UPDATE commands
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Student record not found.' });
        }
        
        return res.json({ success: true, message: 'Marks updated successfully!' });
    } catch (err) {
        console.error('Database update error:', err.message);
        return res.status(500).json({ success: false, message: 'Server database error.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
