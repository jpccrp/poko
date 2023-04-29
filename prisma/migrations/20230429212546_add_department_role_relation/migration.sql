/*
  Warnings:

  - Added the required column `employeeId` to the `DepartmentRole` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DepartmentRole" (
    "departmentId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,

    PRIMARY KEY ("departmentId", "roleId"),
    CONSTRAINT "DepartmentRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DepartmentRole_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DepartmentRole_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DepartmentRole" ("departmentId", "roleId") SELECT "departmentId", "roleId" FROM "DepartmentRole";
DROP TABLE "DepartmentRole";
ALTER TABLE "new_DepartmentRole" RENAME TO "DepartmentRole";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
