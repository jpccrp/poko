const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getRandomTime = (baseTime, range) => {
  const max = new Date(baseTime.getTime() + range * 60000);
  const min = new Date(baseTime.getTime() - range * 60000);
  return new Date(min.getTime() + Math.random() * (max.getTime() - min.getTime()));
};

const createSampleAttendance = async (employeeId, startDateString, endDateString) => {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (!startDate || !endDate || !employeeId) {
    console.error("Invalid input. Please provide correct employeeId and date strings.");
    return;
  }

  const companySchedule = {
    arrival: 480, // in minutes, 8h00
    lunchStart: 780, // in minutes, 13h00
    lunchEnd: 840, // in minutes, 14h00
    exit: 1020, // in minutes, 17h00
  };

  const types = [
    "Punch In",
    "Punch Out for Lunch",
    "Punch In Lunch",
    "Punch Out",
  ];

  const punchTypeTime = {
    "Punch In": companySchedule.arrival,
    "Punch Out for Lunch": companySchedule.lunchStart,
    "Punch In Lunch": companySchedule.lunchEnd,
    "Punch Out": companySchedule.exit,
  };

  const randomRange = 10; // minutes

  for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
    for (const type of types) {
      const currentDay = new Date(currentDate);
      currentDay.setUTCMinutes(punchTypeTime[type] + currentDate.getTimezoneOffset());
      const timestamp = getRandomTime(currentDay, randomRange);
      
      await prisma.punch.create({
        data: {
          employeeId: employeeId,
          timestamp: timestamp, // iso format
          type: type,
          note: '',
        },
      });
    }
  }

  console.log("Done creating sample attendance data for employeeId:", employeeId);
};

createSampleAttendance(1, "2023-01-01", "2023-05-15");