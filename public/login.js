// Get the form element from the HTML document
const form = document.querySelector('form');

// Add an event listener to the form that triggers when the form is submitted
form.addEventListener('submit', async (event) => {
  // Prevent the form's default behavior (e.g., refreshing the page)
  event.preventDefault();

  // Get the username and password entered by the user from the form
  const username = form.elements['u'].value;
  const password = form.elements['p'].value;

  // Send a request to the server to log in with the provided username and password
  const response = await fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  // Parse the response from the server as JSON data
  const data = await response.json();

  // If the server response is successful (HTTP status code 200-299)
  if (response.ok) {
    // Save the received authentication token and username in the browser's localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', username);

    // Redirect the user to the "punch.html" page
    window.location.href = 'punch.html';
  } else {
    // If the server response is not successful, display an error message

    // Create a new HTML div element to show the error message
    const errorElement = document.createElement('div');

    // Set the text content of the div to the error message received from the server
    errorElement.textContent = data.error;

    // Add the error message div to the form, making it visible on the page
    form.appendChild(errorElement);
  }
});
