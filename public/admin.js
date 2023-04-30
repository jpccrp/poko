const createUserForm = document.getElementById('createUserForm');

async function fetchDepartments() {
  const response = await fetch('/admin/departments', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    console.error('Error fetching departments');
    return [];
  }

  return await response.json();
}

async function populateDepartmentDropdown() {
  const departments = await fetchDepartments();
  const dropdown = document.querySelector('form[name="createUserForm"] select[name="departmentId"]');

  departments.forEach((department) => {
    const option = document.createElement('option');
    option.value = department.id;
    option.textContent = department.name;
    dropdown.appendChild(option);
  });
}

// Wrap the function call in the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
  await populateDepartmentDropdown();
});

createUserForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const firstName = createUserForm.elements['firstName'].value;
  const lastName = createUserForm.elements['lastName'].value;
  const username = createUserForm.elements['username'].value;
  const password = createUserForm.elements['password'].value;
  const email = createUserForm.elements['email'].value;

  const response = await fetch('/admin/createUser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ firstName, lastName, username, password, email }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error creating user:', error);
    return;
  }

  console.log('User created successfully');
});