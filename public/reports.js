
// Fetch employee data from the server
async function fetchEmployees() {
  const token = localStorage.getItem('token');
  console.log('Token:', token); 
  const response = await fetch('/employees', {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  console.log('Fetch employees response:', response); // Added console log to see the response

  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }

  return response.json();
}

// Fetch attendance data for the specified date range and employee IDs
async function fetchAttendance(startDate, endDate, employeeIds) {
  const token = localStorage.getItem('token');
  console.log('Token:', token); 
  const response = await fetch('/attendance', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ startDate, endDate, employeeIds }),
  });

  console.log('Fetch attendance response:', response); // Added console log to see the response

  if (!response.ok) {
    throw new Error('Failed to fetch attendance data');
  }

  return response.json();
}

//load employees to the dropdown 
async function loadEmployees() {
  try {
    const token = localStorage.getItem('token');
    console.log('Token:', token); 
    if (!token) {
      window.location.href = '/login.html';
      return;
    }
    const employees = await fetchEmployees();
    console.log(employees);
    const employeeSelect = document.getElementById('employeeSelect');
    employees.forEach(employee => {
      const option = document.createElement('option');
      option.value = employee.id;
      option.textContent = `${employee.firstName} ${employee.lastName}`;
      employeeSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading employees', error);
  }
}


// Generate an Excel report using the provided attendance data
function generateExcelReport(attendanceData) {
  const workbook = XLSX.utils.book_new();
  const sheetName = 'Attendance';

  const processedData = attendanceData.reduce((acc, curr) => {
    if (!acc[curr.employeeName]) {
      acc[curr.employeeName] = [];
    }
    acc[curr.employeeName].push(curr);
    return acc;
  }, {});

  const rows = [['Employee', 'Date', 'Type', 'Worked Hours']];
  
  for (const employee in processedData) {
    let workedHours = 0;
    let lastPunchInTime = null;
    const punches = processedData[employee].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (let i = 0; i < punches.length; i++) {
      const punch = punches[i];
      const date = new Date(punch.timestamp).toISOString().split('T')[0];
      const type = punch.type;

      if ((type === 'Punch In' || type === 'Punch in returning from lunch') && (i === 0 || (punches[i - 1].type !== 'Punch In' && punches[i - 1].type !== 'Punch in returning from lunch'))) {
        lastPunchInTime = new Date(punch.timestamp);
      } else if ((type === 'Punch out for lunch' || type === 'Punch Out') && (i === 0 || (punches[i - 1].type !== 'Punch out for lunch' && punches[i - 1].type !== 'Punch Out')) && lastPunchInTime !== null) {
        const punchOutTime = new Date(punch.timestamp);
        const timeDifference = (punchOutTime - lastPunchInTime) / 1000 / 60 / 60; // to hours
        workedHours += timeDifference;
        lastPunchInTime = null;
      }

      rows.push([employee, date, type, workedHours.toFixed(2)]);
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });

  function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  }

  saveAs(
    new Blob([s2ab(wbout)], { type: 'application/octet-stream' }),
    `Attendance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}



// add event listener to the generate report button
document.getElementById('generateReport').addEventListener('click', async () => {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const employeeSelect = document.getElementById('employeeSelect');
  const employeeIds = Array.from(employeeSelect.selectedOptions, option => parseInt(option.value));

  try {
    const attendanceData = await fetchAttendance(startDate, endDate, employeeIds);
    generateExcelReport(attendanceData);
  } catch (error) {
    console.error('Error fetching attendance data', error);
  }
});
// call load employees after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadEmployees();
});


