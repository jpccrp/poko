// Import the JSON Web Token library
const jwt = require('jsonwebtoken');

// generateToken creates a new JSON Web Token (JWT) for a given user
const generateToken = (user) => {
  // Sign a new token with the user's information and a secret key
  const token = jwt.sign(
    {
      // Add the user's ID, username, and email to the token payload
      id: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET, // Use the secret key provided in the environment variables
    {
      expiresIn: '15m', // Set the token to expire in 15 minutes
      algorithm: 'HS256', // Specify the signing algorithm as HMAC SHA-256
    }
  );

  return token; // Return the generated token
};

// verifyToken checks if a given token is valid
// We had to fix the 401 problem by removing the 'Bearer ' prefix
const verifyToken = (token) => {
  try {
    // Remove the 'Bearer ' prefix from the token string
    const tokenWithoutBearer = token.replace(/^Bearer\s+/, '');

    // Verify the token using the secret key provided in the environment variables
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);

    return decoded; // Return the decoded token payload if the token is valid
  } catch (error) {
    return null; // Return null if the token is invalid or an error occurs
  }
};

// Export the generateToken and verifyToken functions
module.exports = { generateToken, verifyToken };