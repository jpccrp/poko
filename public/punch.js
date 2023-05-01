// Display the username from localStorage on the web page
document.getElementById('username').textContent = localStorage.getItem('username');



// Function to send a punch event to the server
async function sendPunch(type, note) {
  try {
    // Get the authentication token from localStorage
    const token = localStorage.getItem('token');

    // If there's no token, throw an error
    if (!token) {
      throw new Error('No token found');
    }

    // Send the punch event to the server with the token, type, and note
    const response = await fetch('/punch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type, note }),
    });

    // If the server response is not successful, throw an error
    if (!response.ok) {
      console.log("Response status:", response.status);
      throw new Error('Failed to send punch');
    }

    // Parse the server response as JSON data
    const data = await response.json();
    console.log('Punch sent successfully', data);

    // Update the status message with Portuguese translations
    const punchTypeTranslations = {
      'Punch In': 'Entrada',
      'Punch Out Lunch': 'Saída para almoço',
      'Punch In Lunch': 'Retorno do almoço',
      'Punch Out': 'Saída'
    };

    const punchTypeInPortuguese = punchTypeTranslations[type] || type;
    const statusMessage = document.getElementById('statusMessage');
    const currentTime = new Date();

    statusMessage.textContent = `Ação "${punchTypeInPortuguese}" registrada com sucesso às ${currentTime.getHours()} horas e ${currentTime.getMinutes()} minutos.`;
    statusMessage.style.display = 'block';

  } catch (error) {
    // Log any errors that occurred during the process
    console.error('Error sending punch', error);
  }
}







// Add event listeners to buttons for each punch event type
// When a button is clicked, send a punch event with the corresponding type and note

document.getElementById("punchIn").addEventListener("click", () => {
  const note = document.getElementById("note").value;
  sendPunch("Punch In", note);
  document.getElementById("note").value = "";
});

document.getElementById("punchOutLunch").addEventListener("click", () => {
  const note = document.getElementById("note").value;
  sendPunch("Punch Out Lunch", note);
  document.getElementById("note").value = "";
});

document.getElementById("punchInLunch").addEventListener("click", () => {
  const note = document.getElementById("note").value;
  sendPunch("Punch In Lunch", note);
  document.getElementById("note").value = "";
});

document.getElementById("punchOut").addEventListener("click", () => {
  const note = document.getElementById("note").value;
  sendPunch("Punch Out", note);
  document.getElementById("note").value = "";
});

// navigation buttons
document.getElementById('goToReports').addEventListener('click', () => {
  window.location.href = 'reports.html';
});

document.getElementById('goToAdmin').addEventListener('click', () => {
  window.location.href = 'admin.html';
});
