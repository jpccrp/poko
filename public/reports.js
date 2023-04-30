async function fetchEmployees() {
    const token = localStorage.getItem('token');
    const response = await fetch('/employees', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch employees');
    }
  
    return response.json();
  }
  
  async function fetchAttendance(startDate, endDate, employeeIds) {
    const token = localStorage.getItem('token');
    const response = await fetch('/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ startDate, endDate, employeeIds }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch attendance data');
    }
  
    return response.json();
  }
  
  async function loadEmployees() {
    try {
      const employees = await fetchEmployees();
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
  
  document.getElementById('generateReport').addEventListener('click', async () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const employeeSelect = document.getElementById('employeeSelect');
    const employeeIds = Array.from(employeeSelect.selectedOptions, option => parseInt(option.value));
  
    try {
      const attendanceData = await fetchAttendance(startDate, endDate, employeeIds);
      // TODO: Process attendance data and generate the Excel report
    } catch (error) {
      console.error('Error fetching attendance data', error);
    }
  });
  
  loadEmployees();