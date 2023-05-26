const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Define the start and end dates
const startDate = new Date('2023-05-24');
const endDate = new Date();

// Define the punch types
const punchTypes = ['Punch In', 'Punch Out for Lunch', 'Punch In Lunch', 'Punch Out'];

// Function to generate a random time between two bounds
function randomTime(startHours, endHours) {
  const date = new Date();
  const hours = startHours + Math.random() * (endHours - startHours);
  const minutes = Math.floor(Math.random() * 60);
  date.setHours(hours);
  date.setMinutes(minutes);
  return date;
}

// Function to generate punch data for a single day
async function generatePunchData(date, employeeId) {
  // Generate random punch times
  const punchInTime = randomTime(8, 9); // Between 8:00 and 9:00
  const punchOutForLunchTime = randomTime(12, 13); // Between 12:00 and 13:00
  const punchInLunchTime = randomTime(14, 15); // Between 14:00 and 15:00
  const punchOutTime = randomTime(17, 18); // Between 17:00 and 18:00

  // Create the punch records
  for (const [index, type] of punchTypes.entries()) {
    const timestamp = new Date(date);
    timestamp.setHours([punchInTime, punchOutForLunchTime, punchInLunchTime, punchOutTime][index].getHours());
    timestamp.setMinutes([punchInTime, punchOutForLunchTime, punchInLunchTime, punchOutTime][index].getMinutes());
    console.log('Original timestamp:', timestamp);

    console.log('UTC timestamp:', new Date(
  Date.UTC(
    timestamp.getFullYear(),
    timestamp.getMonth(),
    timestamp.getDate(),
    timestamp.getHours(),
    timestamp.getMinutes()
  )
));
console.log('ISO format:', new Date(
  Date.UTC(
    timestamp.getFullYear(),
    timestamp.getMonth(),
    timestamp.getDate(),
    timestamp.getHours(),
    timestamp.getMinutes()
  )
).toISOString());

    await prisma.punch.create({
      data: {
        employeeId,
        timestamp: new Date(
          Date.UTC(
            timestamp.getFullYear(),
            timestamp.getMonth(),
            timestamp.getDate(),
            timestamp.getHours(),
            timestamp.getMinutes()
          )
        ).toISOString(),
        type,
      },
    });
  }
}

// Main function to generate punch data for the date range
async function generatePunchDataForDateRange() {
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    await generatePunchData(date, 1);
  }
  console.log('Punch data generated successfully.');
  await prisma.$disconnect();
}

generatePunchDataForDateRange().catch(console.error);
