const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  // Create a department
  const department = await prisma.department.create({
    data: {
      name: 'Test Department',
    },
  });

  // Create a role
  const role = await prisma.role.create({
    data: {
      name: 'Test Role',
    },
  });

  // Hash the passwords for the admin and test employee users
  const adminPasswordHash = await bcrypt.hash('adminPassword', 10);
  const employeePasswordHash = await bcrypt.hash('employeePassword', 10);

  // Create an admin user
  const adminUser = await prisma.employee.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      username: 'adminUser',
      password: adminPasswordHash,
      email: 'admin@example.com',
      isAdmin: true,
      department: {
        connect: {
          id: department.id,
        },
      },
      roles: {
        create: [
          {
            role: {
              connect: {
                id: role.id,
              },
            },
          },
        ],
      },
    },
  });

  // Create a test employee user
  const testEmployee = await prisma.employee.create({
    data: {
      firstName: 'Test',
      lastName: 'Employee',
      username: 'testEmployee',
      password: employeePasswordHash,
      email: 'employee@example.com',
      department: {
        connect: {
          id: department.id,
        },
      },
      roles: {
        create: [
          {
            role: {
              connect: {
                id: role.id,
              },
            },
          },
        ],
      },
    },
  });

  console.log('Seed data created:', {
    department,
    role,
    adminUser,
    testEmployee,
  });

  // Close Prisma Client connection
  await prisma.$disconnect();
}

seed();

