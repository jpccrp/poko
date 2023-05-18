
// ++++++
// takes a date as input and returns a formatted string of the date and time. If the input date is not valid or not provided, it returns an empty string.
function formatDate(date) {
  if (!date || isNaN(date)) return '';
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Intl.DateTimeFormat('pt-PT', options).format(date);
}

// ++++++
// function to check if the day is the same, for report generation
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// ++++++
// Fetch employee data from the server
async function fetchEmployees() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login.html';
      return;
    }
    const response = await fetch('/employees', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch employees');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching employees', error);
    alert('Failed to fetch employees. Please try again later.');
  }
}

// ++++++
// This function takes two Date objects, startDate and endDate, and returns an array containing all the dates between them, inclusive
function generateDateRange(startDate, endDate) {
  if (startDate > endDate) {
    return [];
  }
  
  const dateRange = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dateRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateRange;
}

// ++++++
// Fetch attendance data for the specified date range and employee IDs changed startDate to start and endDate to end
async function fetchAttendance(start, end, employeeIds) {
  try {
  //console.log('Fetch attendance input:', { start, end, employeeIds }); // Add this line to see what the input is
  const token = localStorage.getItem('token');
  //console.log('Token:', token); 
  const response = await fetch('/attendance', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      employeeIds,
    }),
  });

  //console.log('Fetch attendance response:', response); // Added console log to see the response

  if (!response.ok) {
    console.error('Error status:', response.status); // did it fetch the attendance?
    throw new Error('Failed to fetch attendance data');
  }

  return response.json();
} catch (error) {
  console.error('Error fetching attendance data:', error);
  alert('Failed to fetch attendance data. Please try again later.');
  }
}

// ++++++
//load employees to the dropdown 
async function loadEmployees() {
  try {
    const token = localStorage.getItem('token');
    //console.log('Token:', token); 
    if (!token) {
      window.location.href = '/login.html';
      return;
    }
    const employees = await fetchEmployees();
    //console.log(employees);
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

// ++++++
// Generate an Excel report using the provided attendance data
function generateExcelReport(attendanceData) {
  const workbook = XLSX.utils.book_new();
  const sheetName = 'Attendance';

  const startDate = new Date(document.getElementById('startDate').value);
  const endDate = new Date(document.getElementById('endDate').value);
  const dateRange = generateDateRange(startDate, endDate);

  const firstObject = attendanceData[0];
  const columnHeaders = Object.keys(firstObject);
  columnHeaders.unshift('Employee');
  columnHeaders.push('Worked Hours');

  const rows = [columnHeaders];


  // suggested by Cody
  if (attendanceData.length > 0) {
    // Generate report
  } else {
    alert('No attendance data to generate report'); 
  }
  //suggested by Cody

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

  for (const employee in processedData) {
    const employeeData = processedData[employee];

    dateRange.forEach((date) => {
      const punchesForDate = employeeData.punches.filter((punch) =>
        isSameDay(new Date(punch.timestamp), date)
      );

      if (punchesForDate.length === 0) {
        rows.push([employeeData.name, ...Array(columnHeaders.length - 2).fill(''), '']);
      } else {
        const punchIn = punchesForDate.find(punch => punch.type === 'Punch In')?.timestamp || null;
        const punchOutLunch = punchesForDate.find(punch => punch.type === 'Punch Out for Lunch')?.timestamp || null;
        const punchInLunch = punchesForDate.find(punch => punch.type === 'Punch In Lunch')?.timestamp || null;
        const punchOut = punchesForDate.find(punch => punch.type === 'Punch Out')?.timestamp || null;

        let workedHours = 0;
        if (punchIn && punchOut) {
          const morningHours = punchOutLunch ? new Date(punchOutLunch) - new Date(punchIn) : new Date(punchOut) - new Date(punchIn);
          const afternoonHours = punchInLunch ? new Date(punchOut) - new Date(punchInLunch) : 0;
          workedHours = (morningHours + afternoonHours) / 1000 / 60 / 60;
        }

        rows.push([employeeData.name, ...punchesForDate.map(punch => formatDate(punch.timestamp)), workedHours.toFixed(2)]);
      }
    });
  }  

  
  //XLSX.writeFile(workbook, `${sheetName}.xlsx`);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const wbout = XLSX.write(workbook, {bookType:'xlsx',  type: 'array'});

  console.log('Workbook created:', workbook);
  console.log('Worksheet created:', worksheet);
  console.log('Workbook output:', wbout);


// ++++++
// converts a string to an ArrayBuffer by iterating over each character in the string and getting its ASCII code.
  function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  }


// ++++++
// uses the FileSaver.js library to save the ArrayBuffer as an Excel file (xlsx) with a filename including the current date.
  saveAs(
    new Blob([s2ab(wbout)], { type: 'application/octet-stream' }),
    `Attendance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
  );

}

// ++++++
// Add event listener to the generate report button
document.addEventListener('DOMContentLoaded', () => {
  loadEmployees();

  document.getElementById('generateReport').addEventListener('click', async () => {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    console.log('Fetched startDate and endDate:', { startDate, endDate }); // Added console log to see the response

    const employeeSelect = document.getElementById('employeeSelect');
    const employeeIds = Array.from(employeeSelect.selectedOptions, option => parseInt(option.value));

    try {
      const attendanceData = await fetchAttendance(startDate, endDate, employeeIds);
      // console.log('Attendance data:', attendanceData); // Added console log to see the response
      generateExcelReport(attendanceData);
    } catch (error) {
      console.error('Error fetching attendance data', error);
    }
  });
});




