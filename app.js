// Import required modules
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { writeFileSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');
const { parseISO, isWithinInterval } = require('date-fns');


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

// Protected route 
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

// Populate departments dropdown
app.get('/admin/departments', async (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const adminUser = await prisma.employee.findUnique({ where: { id: decoded.id } });

  if (!adminUser || !adminUser.isAdmin) {
    return res.status(403).json({ error: 'Access denied. User is not an admin.' });
  }

  const departments = await prisma.department.findMany();
  res.json(departments);
});

// Create user route
app.post('/admin/createUser', async (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const adminUser = await prisma.employee.findUnique({ where: { id: decoded.id } });

  if (!adminUser || !adminUser.isAdmin) {
    return res.status(403).json({ error: 'Access denied. User is not an admin.' });
  }

  const { firstName, lastName, username, password, email, departmentId } = req.body;

  if (!firstName || !lastName || !username || !password || !email) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.employee.create({
    data: {
      firstName,
      lastName,
      username,
      password: hashedPassword,
      email,
      department: {
        connect: {
          id: departmentId,
        },
      },
    },
  });
  
  res.json({ user: newUser });  
});


// Reports route
app.get('/employees', async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const employees = await prisma.employee.findMany({ select: { id: true, firstName: true, lastName: true } });
  res.json(employees);
});

app.post('/attendance', async (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const { startDate, endDate, employeeIds } = req.body;
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const punches = await prisma.punch.findMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
    include: {
      employee: true,
    },
  });

  const attendanceData = punches
    .filter(punch => isWithinInterval(parseISO(punch.timestamp), { start, end }))
    .map(punch => ({
      id: punch.id,
      employeeName: `${punch.employee.firstName} ${punch.employee.lastName}`,
      timestamp: punch.timestamp,
      type: punch.type,
      note: punch.note,
    }));

  res.json(attendanceData);
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
