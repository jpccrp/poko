//The purpose of this script is to generate attendance reports for employees. 

// Fetch the token from localStorage
const token = localStorage.getItem('token');

// Fetch the employee data from the server
async function fetchEmployees() {
  const response = await fetch('/employees', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const employees = await response.json();
  return employees;
}

// Fetch the attendance data from the server
async function fetchAttendance(start, end, employeeIds) {
  const response = await fetch('/attendance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ start, end, employeeIds }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const attendance = await response.json();
  return attendance;
}

// Convert the report to CSV
function convertToCSV(report) {
  // Start with the header row
  let csv = 'Date,Employee Name,Punch In,Punch Out for Lunch,Punch In Lunch,Punch Out,Total Worked Hours\n';

  // Add each row of the report
  for (const entry of report) {
    const punchIn = entry.punches.find(punch => punch.type === 'Punch In')?.timestamp || '';
    const punchOutForLunch = entry.punches.find(punch => punch.type === 'Punch Out for Lunch')?.timestamp || '';
    const punchInLunch = entry.punches.find(punch => punch.type === 'Punch In Lunch')?.timestamp || '';
    const punchOut = entry.punches.find(punch => punch.type === 'Punch Out')?.timestamp || '';

    csv += `${entry.date},${entry.employeeName},${punchIn},${punchOutForLunch},${punchInLunch},${punchOut},${entry.totalHours}\n`;
  }

  return csv;
}

// Download the report as a CSV file
function downloadCSV(report) {
  const csv = convertToCSV(report);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'report.csv');
}

// Generate the report
async function generateReport() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const employeeSelect = document.getElementById('employeeSelect');
  const employeeIds = Array.from(employeeSelect.selectedOptions).map(option => parseInt(option.value));

  const employees = await fetchEmployees();
  const attendance = await fetchAttendance(startDate, endDate, employeeIds);

  const report = [];

  // Iterate over each day in the date range
  for (let date = new Date(startDate); date <= new Date(endDate); date.setDate(date.getDate() + 1)) {
    // Iterate over each employee
    for (const employee of employees) {
      // Find the punch records for this employee on this day
      const punches = attendance.filter(punch => 
        new Date(punch.timestamp * 1000).toDateString() === date.toDateString() &&
        punch.employeeId === employee.id
      ).sort((a, b) => new Date(a.timestamp * 1000) - new Date(b.timestamp * 1000));

      // If there are no punch records for this employee on this day, create an empty entry
      if (punches.length === 0) {
        report.push({
          date: date.toDateString(),
          employeeName: `${employee.firstName} ${employee.lastName}`,
          punches: [],
          totalHours: '0h0m',
        });
      } else {
        // Otherwise, create an entry with the punch records
        const totalHours = calculateTotalHours(punches);
        report.push({
          date: date.toDateString(),
          employeeName: `${employee.firstName} ${employee.lastName}`,
          punches,
          totalHours,
        });
      }
    }
  }

  downloadCSV(report);
}

// Calculate the total hours worked based on an array of punch records
function calculateTotalHours(punches) {
  let totalMinutes = 0;

  for (let i = 0; i < punches.length; i += 2) {
    const punchIn = new Date(punches[i].timestamp * 1000);
    const punchOut = punches[i + 1] ? new Date(punches[i + 1].timestamp * 1000) : new Date();
    const minutesWorked = (punchOut.getTime() - punchIn.getTime()) / 1000 / 60;
    totalMinutes += minutesWorked;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h${minutes}m`;
}

// Add an event listener to the "Generate Report" button
document.getElementById('generateReport').addEventListener('click', generateReport);

// Populate the employee select options when the page loads
window.addEventListener('load',async () => {
  const employees = await fetchEmployees();
  const employeeSelect = document.getElementById('employeeSelect');

  for (const employee of employees) {
    const option = document.createElement('option');
    option.value = employee.id;
    option.text = `${employee.firstName} ${employee.lastName}`;
    employeeSelect.add(option);
  }
});
