// Import required modules
const express = require('express'); // Express is a web application framework for Node.js
const bcrypt = require('bcrypt'); // bcrypt is a library for hashing passwords
const jwt = require('jsonwebtoken'); // JSON Web Token library for secure data transmission
const { PrismaClient } = require('@prisma/client'); // Prisma Client for database operations
const path = require('path'); // Node.js module for working with file paths
const { writeFileSync } = require('fs'); // Node.js module for working with the file system
const { tmpdir } = require('os'); // Node.js module for working with the operating system
const { join } = require('path'); // Node.js module for joining file paths
const { parseISO, isWithinInterval } = require('date-fns'); // date-fns is a library for working with dates
const { zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz'); // Import these functions



// Initialize a new PrismaClient instance for database operations
const prisma = new PrismaClient();

// Initialize a new Express application
const app = express();

// Set the port for the application, defaulting to 3456 if not provided in the environment variables
const port = process.env.PORT || 3456;

// Load environment variables from the .env file
require('dotenv').config();

// console.log('JWT_SECRET:', process.env.JWT_SECRET); // REMOVE LATER

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Serve the CSS file with the correct content type header
app.get('/css/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/css/style.css'), { headers: { 'Content-Type': 'text/css' } });
});



// Enable parsing of JSON request bodies
app.use(express.json());


// Import utility functions for token generation and verification
const { generateToken, verifyToken } = require('./utils/auth');


// authenticateToken middleware function
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // console.log('Received authHeader:', authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  //console.log('Extracted token:', token);

  jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      console.error('Error verifying token:', err);
      return res.status(401).json({ error: 'Invalid token.' });
    }

    //console.log('Decoded token:', decoded);
    req.user = decoded;
    next();
  });
}


// Login route: authenticate users and provide tokens
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

// Protected route: requires a valid token to access user data
app.get('/protected', authenticateToken, async (req, res) => {
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

// Populate departments dropdown for admin page
app.get('/admin/departments', authenticateToken, async (req, res) => {
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

// Create user route for admin page
app.post('/admin/createUser', authenticateToken, async (req, res) => {
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


// Employees route / Reports route get employee information for attendance report
app.get('/employees', authenticateToken, async (req, res) => {
  const token = req.headers['authorization'];
  // console.log('Received token:', token); // verify token
  if (!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const decoded = verifyToken(token);
  // console.log('Decoded token:', decoded); // verify decoded token

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  try {
    const employees = await prisma.employee.findMany({ select: { id: true, firstName: true, lastName: true } });
    //console.log('Employees fetched:', employees);
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees.' });
  }
});

// attendance route
app.post('/attendance', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    const { start: startValue, end: endValue, employeeIds } = req.body;

    // Log the received values
    console.log('Received start and end values:', { startValue, endValue });
    console.log('Received employeeIds:', employeeIds);

    const start = new Date(startValue);
    const end = new Date(endValue);
   

    // check if either start or end date is invalid
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ error: 'Invalid start or end date.' });
    }

    console.log('Fetching attendance for:', { start, end, employeeIds });

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

    // Log all punches
    console.log('All punches:', punches);
    console.log('Start date of interval:', start);
    console.log('End date of interval:', end);
    // Get the timezone of the client
    const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const attendanceData = punches
    .filter(punch => isWithinInterval(new Date(punch.timestamp), { start, end }))
    .map(punch => {
      // Convert the punch timestamp to local time for the client
      const localTimestamp = utcToZonedTime(punch.timestamp, clientTimeZone);
      
      return {
        id: punch.id,
        employeeName: `${punch.employee.firstName} ${punch.employee.lastName}`,
        timestamp: localTimestamp, // Use local time for timestamp
        type: punch.type,
        note: punch.note,
      };
    });

    // Log the filtered attendance data
    console.log('Filtered attendance data:', attendanceData);

    res.json(attendanceData);
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    res.status(500).json({ error: 'Failed to fetch attendance data.' });
  }
});




// Punch route: record a punch for the authenticated user
app.post('/punch', authenticateToken, async (req, res) => {
  const authHeader = req.headers['authorization'];
  //console.log("Received authHeader:", authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  //console.log("Extracted token:", token);

  const decoded = verifyToken(token);
  //console.log("Decoded token:", decoded);

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
      timestamp: new Date().toISOString(), // store timestamp in UTC
      type,
      note, // estava plural
    },
  });

  res.json({ punch: newPunch });
});





// Start the application, listening on the specified port
app.listen(port, () => {
  console.log(`Trevo HRM app listening at http://localhost:${port}`);
});

