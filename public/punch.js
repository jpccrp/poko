// Punch logic
document.getElementById('username').textContent = localStorage.getItem('username');
async function sendPunch(type, note) {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch('/punch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type, note }),
    });

    if (!response.ok) {
      console.log("Response status:", response.status);
      throw new Error('Failed to send punch');
    }

    const data = await response.json();
    console.log('Punch sent successfully', data);
  } catch (error) {
    console.error('Error sending punch', error);
  }
}

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



