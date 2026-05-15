import bcrypt from "bcryptjs";
import { PrismaClient, GradePeriod, GradeStatus, Role } from "@prisma/client";
import { createPayloadHash } from "../src/lib/hash";

const prisma = new PrismaClient();

async function main() {
  await prisma.submissionLog.deleteMany();
  await prisma.gradeRecord.deleteMany();
  await prisma.blockchainRecord.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  await prisma.department.createMany({
    data: [
      { code: "CE", name: "Civil Engineering" },
      { code: "EE", name: "Electrical Engineering" },
      { code: "ME", name: "Mechanical Engineering" },
      { code: "CPE", name: "Computer Engineering" },
    ],
  });

  const [civil, electrical, mechanical, computer] = await prisma.department.findMany({
    orderBy: { code: "asc" },
  });

  const password = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "dean@ncf.edu.ph",
      name: "Dr. Santos",
      passwordHash: password,
      role: Role.ADMIN,
      departmentId: civil.id,
    },
  });

  const reyes = await prisma.user.create({
    data: {
      email: "reyes@ncf.edu.ph",
      name: "Engr. Reyes",
      passwordHash: password,
      role: Role.INSTRUCTOR,
      departmentId: civil.id,
    },
  });

  const lim = await prisma.user.create({
    data: {
      email: "lim@ncf.edu.ph",
      name: "Engr. Lim",
      passwordHash: password,
      role: Role.INSTRUCTOR,
      departmentId: electrical.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "viewer@ncf.edu.ph",
      name: "Registrar Viewer",
      passwordHash: password,
      role: Role.VIEWER,
      departmentId: computer.id,
    },
  });

  await prisma.subject.createMany({
    data: [
      { code: "CE 401", title: "Structural Analysis", departmentId: civil.id, instructorId: reyes.id },
      { code: "CE 301", title: "Hydraulics", departmentId: civil.id, instructorId: reyes.id },
      { code: "EE 301", title: "Circuit Analysis", departmentId: electrical.id, instructorId: lim.id },
      { code: "ME 201", title: "Thermodynamics", departmentId: mechanical.id, instructorId: admin.id },
    ],
  });

  const subjectList = await prisma.subject.findMany({ orderBy: { code: "asc" } });

  await prisma.student.createMany({
    data: [
      { studentNo: "NCF-2021-0042", name: "Ana dela Cruz", departmentId: civil.id },
      { studentNo: "NCF-2021-0055", name: "Bjorn Santos", departmentId: civil.id },
      { studentNo: "NCF-2021-0099", name: "Hector Manalo", departmentId: civil.id },
      { studentNo: "NCF-2022-0011", name: "Carla Reyes", departmentId: electrical.id },
      { studentNo: "NCF-2022-0033", name: "Diego Lim", departmentId: electrical.id },
      { studentNo: "NCF-2023-0004", name: "Felix Gomez", departmentId: civil.id },
      { studentNo: "NCF-2023-0009", name: "Grace Tan", departmentId: electrical.id },
      { studentNo: "NCF-2023-0015", name: "Ivan Cruz", departmentId: civil.id },
      { studentNo: "NCF-2023-0021", name: "Jasmine Bautista", departmentId: electrical.id },
      { studentNo: "NCF-2022-0047", name: "Kevin Torres", departmentId: civil.id },
    ],
  });

  const studentList = await prisma.student.findMany({ orderBy: { studentNo: "asc" } });

  const ce401 = subjectList.find((s) => s.code === "CE 401")!;
  const ce301 = subjectList.find((s) => s.code === "CE 301")!;
  const ee301 = subjectList.find((s) => s.code === "EE 301")!;

  const grades = [
    { student: "NCF-2021-0042", subject: ce401.id, instructor: reyes.id, grade: 87, period: GradePeriod.FINAL },
    { student: "NCF-2021-0055", subject: ce401.id, instructor: reyes.id, grade: 83, period: GradePeriod.FINAL },
    { student: "NCF-2021-0099", subject: ce301.id, instructor: reyes.id, grade: 73, period: GradePeriod.PRELIM },
    { student: "NCF-2022-0011", subject: ee301.id, instructor: lim.id, grade: 90, period: GradePeriod.MIDTERM },
    { student: "NCF-2022-0033", subject: ee301.id, instructor: lim.id, grade: 75, period: GradePeriod.MIDTERM },
  ];

  for (const entry of grades) {
    const student = studentList.find((s) => s.studentNo === entry.student)!;
    const payloadHash = createPayloadHash({
      studentNo: student.studentNo,
      subjectId: entry.subject,
      instructorId: entry.instructor,
      period: entry.period,
      grade: entry.grade,
    });

    await prisma.gradeRecord.create({
      data: {
        studentId: student.id,
        subjectId: entry.subject,
        instructorId: entry.instructor,
        period: entry.period,
        grade: entry.grade,
        status: GradeStatus.CHAINED,
        payloadHash,
      },
    });
  }

  const latestHash = createPayloadHash({
    studentNo: "BLOCK-INIT",
    subjectId: ce401.id,
    instructorId: reyes.id,
    period: GradePeriod.FINAL,
    grade: 0,
  });

  await prisma.blockchainRecord.create({
    data: {
      blockNumber: 1045,
      blockHash: latestHash,
      previousHash: "0x0000",
      payloadHash: latestHash,
      period: GradePeriod.FINAL,
      subjectId: ce401.id,
      instructorId: reyes.id,
      count: 3,
    },
  });

  await prisma.submissionLog.create({
    data: {
      instructorId: reyes.id,
      subjectId: ce401.id,
      period: GradePeriod.FINAL,
      action: "COMMIT",
      metadata: {
        message: "Committed CE 401 Final grades",
        count: 3,
      },
    },
  });

  await prisma.submissionLog.create({
    data: {
      instructorId: lim.id,
      subjectId: ee301.id,
      period: GradePeriod.MIDTERM,
      action: "UPLOAD",
      metadata: {
        message: "Uploaded EE 301 Midterm grades",
        count: 2,
      },
    },
  });

  console.log("Seed completed", { admin: admin.email, instructors: [reyes.email, lim.email] });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
