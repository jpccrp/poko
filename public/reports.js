
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

// for the excel report: Generate a date range between the provided start and end dates 
function generateDateRange(start, end) {
  const result = [];
  let currentDate = start;

  while (currentDate <= end) {
    result.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

// Generate an Excel report using the provided attendance data
function generateExcelReport(attendanceData) {
  const workbook = XLSX.utils.book_new();
  const sheetName = 'Attendance';

  const startDate = new Date(document.getElementById('startDate').value);
  const endDate = new Date(document.getElementById('endDate').value);
  const dateRange = generateDateRange(startDate, endDate);

  const processedData = attendanceData.reduce((acc, curr) => {
    if (!acc[curr.employeeId]) {
      acc[curr.employeeId] = {
        name: curr.employeeName,
        punches: [],
      };
    }
    acc[curr.employeeId].punches.push(curr);
    return acc;
  }, {});

  const rows = [['Employee', 'Date', 'Punch In', 'Punch Out for Lunch', 'Punch in from Lunch', 'Punch Out', 'Worked Hours']];

  for (const employee in processedData) {
    const employeeData = processedData[employee];

    dateRange.forEach((date) => {
      const punchesForDate = employeeData.punches.filter((punch) =>
        isSameDay(new Date(punch.timestamp), date)
      );

      const punchIn = punchesForDate.find(punch => punch.type === 'Punch In') || {};
      const punchOutLunch = punchesForDate.find(punch => punch.type === 'Punch Out for Lunch') || {};
      const punchInLunch = punchesForDate.find(punch => punch.type === 'Punch In from Lunch') || {};
      const punchOut = punchesForDate.find(punch => punch.type === 'Punch Out') || {};

      let workedHours = 0;
      if (punchIn.timestamp && punchOut.timestamp) {
        const morningHours = punchOutLunch.timestamp ? punchOutLunch.timestamp - punchIn.timestamp : punchOut.timestamp - punchIn.timestamp;
        const afternoonHours = punchInLunch.timestamp ? punchOut.timestamp - punchInLunch.timestamp : 0;
        workedHours = (morningHours + afternoonHours) / 1000 / 60 / 60;
      }

      rows.push([employeeData.name, formatDate(date), punchIn.timestamp, punchOutLunch.timestamp, punchInLunch.timestamp, punchOut.timestamp, workedHours.toFixed(2)]);
    });
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
  const startDate = document.getElementById('start').value; // changed from startDate to start
  const endDate = document.getElementById('end').value;
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


