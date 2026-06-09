const express = require('express');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middleware configuration
app.use(cors()); // Allows your HTML page to talk to this server
app.use(express.json()); // Parses incoming JSON data
app.use(express.urlencoded({ extended: true })); // Middleware to parse form data
app.use(express.static(__dirname)); // Automatically serve any static files in your root folder

// Configure Session Middleware
app.use(session({
    secret: 'super_secret_key_change_this',
    resave: false,
    saveUninitialized: true
}));

// Configure your MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',          // Your MySQL username
    password: 'Ravi@2026',  // Your MySQL password
    database: 'my_first_db'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL Database!');
});

// Hardcoded users for web login demonstration
const USERS = [
    { username: 'admin', password: 'password123', role: 'admin' },
    { username: 'user', password: 'password123', role: 'user' }
];

/* ==========================================
   AUTHENTICATION & ROUTING SECTION
   ========================================== */

// Serve Login Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Handle Login Form Submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = USERS.find(u => u.username === username && u.password === password);

    if (user) {
        req.session.user = { username: user.username, role: user.role };
        res.redirect('/dashboard');
    } else {
        res.send('Invalid username or password. <a href="/">Try again</a>');
    }
});

// Route to serve dashboard content based on role
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    if (req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'admin_view.html'));
    } else {
        res.sendFile(path.join(__dirname, 'normalUserDisplay.html'));
    }
});

// Restricted Admin-Only Target Link
app.get('/admin-secret-page', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.send('<h1>Welcome to the Secret Admin Control Panel</h1><p><a href="/logout">Logout</a></p>');
    } else {
        res.status(403).send('Access Denied. Only admins can view this page.');
    }
});

// Handle Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


/* ==========================================
   STUDENTS / USERS DATABASE CRUD ROUTES
   ========================================== */

// Route to insert current data and get current row
app.post('/add-user', async (req, res) => {
    const { username, email, age, gender, contactNo, score10th, board, address } = req.body;
    const sql1 = 'INSERT INTO users (username, email, age, gender, contactNo, score10th, board, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

    try {
        const [result] = await db.promise().query(sql1, [username, email, age, gender, contactNo, score10th, board, address]);
        const registeredNumber = result.insertId;

        return res.json({ 
            message: `Student successfully added with registered number ${registeredNumber} ` 
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error occurred.' });
    }
});

// Route to fetch all users from the database
app.get('/users', (req, res) => {
    const sql = 'SELECT id, username, email, age, gender, contactNo, score10th, board, address FROM users';
    
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error occurred.' });
        }
        res.json(results);
    });
});

// Route 2: Get a single user by ID from users table
app.get('/users/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM users WHERE id = ? ';

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error.' });
        if (results.length === 0) return res.status(404).json({ message: 'User not found.' });

        res.json(results[0]);
    });
});

// Route 3: Update details of selected students
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { username, email, age, gender, contactNo, score10th, board, address } = req.body;
    const sql = 'UPDATE users SET username= ?, email= ?, age= ?, gender= ?, contactNo= ?, score10th= ?, board= ?, address= ? WHERE id = ?';

    db.query(sql, [username, email, age, gender, contactNo, score10th, board, address, id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database update failed.' });
        
        res.json({ message: 'User updated successfully!' });
    });
});

// Route 4: delete details of selected students
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM users WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database delete failed.' });
        
        res.json({ message: 'User deleted successfully!' });
    });
});


/* ==========================================
   STUDENTS MARKS DATABASE CRUD ROUTES
   ========================================== */

// Route 5: Get rank wise student list
app.get('/marks', (req, res) => {
    const sql = 'SELECT first_table_id, first_table_name, studentmarks, RANK() OVER (ORDER BY studentmarks DESC) AS calculated_rank FROM marks';

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error.' });
        if (results.length === 0) return res.status(404).json({ message: 'No marks data found.' });
        
        res.json(results); 
    });
});

// Route 6: Get a single user by ID from marks
app.get('/marks/:first_table_id', (req, res) => {
    const { first_table_id } = req.params;
    const sql = 'SELECT * FROM marks WHERE first_table_id = ? ';

    db.query(sql, [first_table_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error.' });
        if (results.length === 0) return res.status(404).json({ message: 'User not found.' });

        res.json(results[0]);
    });
});

// Route 7: Update student marks 
app.put('/marks/:first_table_id', (req, res) => {
    const { first_table_id } = req.params;
    const { marks } = req.body;
    const sql = 'UPDATE marks SET studentmarks = ? WHERE first_table_id = ?';

    db.query(sql, [marks, first_table_id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database update failed.' });
        
        res.json({ message: 'User marks updated successfully!' });
    });
});

// App initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
