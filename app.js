// Import required modules
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const path = require('path');


// Initialize a new PrismaClient instance for database operations
const prisma = new PrismaClient();

// Initialize a new Express application
const app = express();

// Set the port for the application, defaulting to 3456 if not provided in the environment variables
const port = process.env.PORT || 3456;

// Load environment variables from the .env file
require('dotenv').config();

// Serve static files from the 'public' folder
app.use(express.static('public'));

//CSS
app.get('/css/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/css/style.css'), { headers: { 'Content-Type': 'text/css' } });
});



// Enable parsing of JSON request bodies
app.use(express.json());


// I will add my routes and logic here
const { generateToken, verifyToken } = require('./utils/auth');

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = await prisma.employee.findUnique({ where: { username } });

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid password.' });
  }

  const token = generateToken(user);
  res.json({ token });
});

// Protected route example
app.get('/protected', async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const user = await prisma.employee.findUnique({ where: { id: decoded.id } });

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ user });
});

// Punch route
app.post('/punch', async (req, res) => {
  const authHeader = req.headers['authorization'];
  console.log("Received authHeader:", authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  console.log("Extracted token:", token);

  const decoded = verifyToken(token);
  console.log("Decoded token:", decoded);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const user = await prisma.employee.findUnique({ where: { id: decoded.id } });

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const { punchId, timestamp, type, note } = req.body; // Add this line

  const newPunch = await prisma.punch.create({
    data: {
      employeeId: user.id,
      timestamp: new Date(),
      type,
      note, // estava plural
    },
  });

  res.json({ punch: newPunch });
});





// Start the application, listening on the specified port
app.listen(port, () => {
  console.log(`Attendance Tracker app listening at http://localhost:${port}`);
});
