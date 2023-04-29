const form = document.querySelector('form');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = form.elements['u'].value;
  const password = form.elements['p'].value;

  const response = await fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', username); // Add this line to store the username in localStorage
    window.location.href = 'punch.html';
  } else {
    // Display an error message, e.g., create an element to show the error
    const errorElement = document.createElement('div');
    errorElement.textContent = data.error;
    form.appendChild(errorElement);
  }
});
