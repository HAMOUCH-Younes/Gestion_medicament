const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // replace with your MySQL username
    password: '', // replace with your MySQL password
    database: 'data' // replace with your database name
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL connected...');
});

// Routes
app.get('/api/clients', (req, res) => {
    const sql = 'SELECT * FROM clients';
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

app.post('/api/clients', (req, res) => {
    const { id, name, contacts, company } = req.body;
    const sql = 'INSERT INTO clients (id, name, contacts, company) VALUES (?, ?, ?, ?)';
    db.query(sql, [id, name, contacts, company], (err, result) => {
        if (err) throw err;
        res.send('Client added...');
    });
});

app.put('/api/clients/:id', (req, res) => {
    const { name, contacts, company } = req.body;
    const sql = 'UPDATE clients SET name = ?, contacts = ?, company = ? WHERE id = ?';
    db.query(sql, [name, contacts, company, req.params.id], (err, result) => {
        if (err) throw err;
        res.send('Client updated...');
    });
});

app.delete('/api/clients/:id', (req, res) => {
    const sql = 'DELETE FROM clients WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) throw err;
        res.send('Client deleted...');
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});