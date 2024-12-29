const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 5500;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // replace with your database username
    password: '', // replace with your database password
    database: 'voting_game'
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to the database.');
});

// Login endpoint for different roles
app.post('/api/:role-login', (req, res) => {
    const { role } = req.params;
    const { username, password } = req.body;

    // Define the table based on the role
    let tableName;
    if (role === 'admin') {
        tableName = 'admin_login';
    } else if (role === 'cadet') {
        tableName = 'cadet_login';
    } else if (role === 'voter') {
        tableName = 'user_login';
    } else {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Query the database for the user
    const query = `SELECT * FROM ${tableName} WHERE username = ? AND password = ?`;
    db.execute(query, [username, password], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length > 0) {
            // User found
            return res.json({ success: true });
        } else {
            // Invalid credentials
            return res.json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.post('/api/add-option', (req, res) => {
    const { option, description, qid } = req.body; // Include qid in the request body

    // Check for existing options and descriptions for the given qid
    const checkQuery = `SELECT OA, OB, OC, OD, DA, DB, DC, DD FROM Questions WHERE qid = ?`;
    
    db.execute(checkQuery, [qid], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length > 0) {
            const row = results[0];
            let optionInserted = false;
            let descriptionInserted = false;

            // Check for available option fields
            for (let i = 1; i <= 4; i++) {
                if (row[`O${String.fromCharCode(65 + i - 1)}`] === null) { // OA, OB, OC, OD
                    row[`O${String.fromCharCode(65 + i - 1)}`] = option;
                    optionInserted = true;
                    break;
                }
            }

            // Check for available description fields
            for (let i = 1; i <= 4; i++) {
                if (row[`D${String.fromCharCode(65 + i - 1)}`] === null) { // DA, DB, DC, DD
                    row[`D${String.fromCharCode(65 + i - 1)}`] = description;
                    descriptionInserted = true;
                    break;
                }
            }

            // If no available options or descriptions
            if (!optionInserted && !descriptionInserted) {
                return res.status(400).json({ success: false, message: 'No available option or description' });
            }

            // Update the database with the new option and description
            const updateQuery = `UPDATE Questions SET OA = ?, OB = ?, OC = ?, OD = ?, DA = ?, DB = ?, DC = ?, DD = ? WHERE qid = ?`;
            db.execute(updateQuery, [row.OA, row.OB, row.OC, row.OD, row.DA, row.DB, row.DC, row.DD, qid], (err) => {
                if (err) {
                    console.error('Database update error:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }
                res.json({ success: true, message: 'Option and description added successfully' });
            });
        } else {
            res.status(404).json({ success: false, message: 'Question not found' });
        }
    });
});

// Assuming you have already set up your Express app and database connection

// Endpoint to get options and descriptions for a specific question
app.get('/api/get-options', (req, res) => {
    const qid = req.query.qid;

    const query = `SELECT OA, OB, OC, OD, DA, DB, DC, DD FROM Questions WHERE qid = ?`;
    db.execute(query, [qid], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length > 0) {
            res.json({ success: true, options: results[0] });
        } else {
            res.status(404).json({ success: false, message: 'Question not found' });
        }
    });
});

// Endpoint to increment the vote count for a specific option
app.post('/api/increment-vote', (req, res) => {
    const { qid, field } = req.body; // Expecting qid and field (e.g., VA, VB, etc.)

    // Construct the update query based on the field
    const updateQuery = `UPDATE Questions SET ${field} = ${field} + 1 WHERE qid = ?`;
    db.execute(updateQuery, [qid], (err) => {
        if (err) {
            console.error('Database update error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Vote counted successfully!' });
    });
});