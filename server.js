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
        const result = await pool.query(
            'SELECT * FROM users ORDER BY id ASC'
        );
        return res.json({ success: true, users: result.rows });
    } catch (err) {
        console.error('Database fetch operation error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to extract database logs.' });
    }
});

// 6. Fetch All student marks
app.get('/api/view-marks', async (req, res) => {
    try {
        const queryText = `SELECT id, username, marks, RANK() OVER (ORDER BY marks DESC) AS calculated_rank FROM marks`;
        const result = await pool.query(queryText);
        return res.json({ success: true, users: result.rows });
    } catch (err) {
        console.error('Database fetch operation error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to extract database logs.' });
    }
});

// 7. Fetch single student profile details
app.get('/api/fetch-student/:id', async (req, res) => {
    const studentId = req.params.id;

    try {
        let result = await pool.query(
            `SELECT id, username FROM users WHERE id = $1`,
            [studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student ID does not exist.' });
        }

        let studentData = result.rows[0];

        // Fetch existing marks to populate the form field accurately
        let marksResult = await pool.query(`SELECT marks FROM marks WHERE id = $1`, [studentId]);
        studentData.marks = marksResult.rows.length > 0 ? marksResult.rows[0].marks : 0;

        return res.json({ success: true, student: studentData });
    } catch (err) {
        console.error('Fetch student endpoint error:', err.message);
        return res.status(500).json({ success: false, message: 'Server database error lookup.' });
    }
});

// 8. Add students profiles
app.post('/api/add-user', async (req, res) => {
    const { username, email, age, gender, contactno, score10th, board, address } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO users (username, email, age, gender, contactno, score10th, board, address) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [username, email, age, gender, contactno, score10th, board, address]
        );
        return res.json({ success: true, message: 'User added successfully!' });
    } catch (err) {
        console.error('Database insertion error:', err.message);
        return res.status(500).json({ success: false, message: 'Server database error.' });
    }
});

// 9. Update student marks endpoint (FIXED: Rebuilt the missing execution blocks safely)
app.put('/api/update-marks/:id', async (req, res) => {
    const studentid = parseInt(req.params.id.toString().trim(), 10);
    const { username, marks } = req.body; 

    if (marks === undefined || marks === null || marks === '') {
        return res.status(400).json({ success: false, message: 'Marks value is required.' });
    }
    
    const numericMarks = Math.round(Number(marks));
    
    if (isNaN(numericMarks) || isNaN(studentid)) {
        return res.status(400).json({ 
            success: false, 
            message: `Invalid format error. Received ID: "${req.params.id}", Received Marks: "${marks}"` 
        });
    }

    try {
        const result = await pool.query(
            `UPDATE marks 
             SET marks = $1, username = $2
             WHERE id = $3`,
            [numericMarks, username || '', studentid]
        );
        
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
