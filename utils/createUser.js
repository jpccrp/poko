// utils/createUser.js

const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const questions = [
  'First name: ',
  'Last name: ',
  'Username: ',
  'Password: ',
  'Email: ',
  'Department ID: ',
  'Is Admin (true/false): ',
  'Department Roles (comma-separated Role IDs, e.g., 1,2,3): ',
];

let answers = [];

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const createEmployee = async (employeeData) => {
  const hashedPassword = await bcrypt.hash(employeeData.password, saltRounds);
  const employee = await prisma.employee.create({
    data: {
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      username: employeeData.username,
      password: hashedPassword,
      email: employeeData.email,
      departmentId: parseInt(employeeData.departmentId),
      isAdmin: employeeData.isAdmin === 'true',
    },
  });

  // Add department roles for the employee
  const departmentRoleIds = employeeData.departmentRoleIds.split(',').map((id) => parseInt(id));
  await Promise.all(
    departmentRoleIds.map((roleId) =>
      prisma.departmentRole.create({
        data: {
          roleId: roleId,
          departmentId: parseInt(employeeData.departmentId),
          employeeId: employee.id,
        },
      })
    )
  );
};

(async () => {
  for (const question of questions) {
    const answer = await askQuestion(question);
    answers.push(answer);
  }

  const employeeData = {
    firstName: answers[0],
    lastName: answers[1],
    username: answers[2],
    password: answers[3],
    email: answers[4],
    departmentId: answers[5],
    isAdmin: answers[6],
    departmentRoleIds: answers[7],
  };

  await createEmployee(employeeData);
  console.log('Employee created successfully.');

  rl.close();
  process.exit();
})();
