import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // ── Limpiar en orden inverso a las dependencias ──────────────────────────
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.absenceJustification.deleteMany();
  await prisma.pointsMovement.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.qRToken.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.teacherAssignment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.section.deleteMany();
  await prisma.course.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  // ── Roles ────────────────────────────────────────────────────────────────
  const [roleAdmin, roleMaestro, roleAlumno] = await Promise.all([
    prisma.role.create({ data: { name: 'ADMIN',   description: 'Administrador del sistema' } }),
    prisma.role.create({ data: { name: 'MAESTRO', description: 'Docente que imparte clases' } }),
    prisma.role.create({ data: { name: 'ALUMNO',  description: 'Estudiante inscrito' } }),
    prisma.role.create({ data: { name: 'EXALUMNO',description: 'Ex-estudiante' } }),
  ]);

  // ── Permisos ─────────────────────────────────────────────────────────────
  const permissions = await prisma.permission.createManyAndReturn({
    data: [
      { name: 'manage_users',    description: 'Crear, editar y eliminar usuarios' },
      { name: 'view_reports',    description: 'Ver reportes de asistencia' },
      { name: 'generate_qr',     description: 'Generar tokens QR para sesiones' },
      { name: 'mark_attendance', description: 'Registrar asistencia mediante QR' },
      { name: 'view_profile',    description: 'Ver perfil propio' },
    ],
  });

  const permMap = Object.fromEntries(permissions.map(p => [p.name, p.id]));

  await prisma.rolePermission.createMany({
    data: [
      { roleId: roleAdmin.id,   permissionId: permMap['manage_users'] },
      { roleId: roleAdmin.id,   permissionId: permMap['view_reports'] },
      { roleId: roleMaestro.id, permissionId: permMap['generate_qr'] },
      { roleId: roleMaestro.id, permissionId: permMap['view_reports'] },
      { roleId: roleAlumno.id,  permissionId: permMap['mark_attendance'] },
      { roleId: roleAlumno.id,  permissionId: permMap['view_profile'] },
    ],
  });

  // ── Usuarios ─────────────────────────────────────────────────────────────
  const [pwAdmin, pwMaestro, pwAna, pwCarlos, pwLuis] = await Promise.all([
    bcrypt.hash('admin123',   10),
    bcrypt.hash('maestro123', 10),
    bcrypt.hash('alumno123',  10),
    bcrypt.hash('alumno123',  10),
    bcrypt.hash('alumno123',  10),
  ]);

  const admin = await prisma.user.create({
    data: { username: 'admin',   email: 'admin@davinci.edu',        name: 'Admin Sistema',    password: pwAdmin },
  });
  const maestro = await prisma.user.create({
    data: { username: 'prof_garcia', email: 'garcia@davinci.edu',   name: 'Prof. García',     password: pwMaestro },
  });
  const ana = await prisma.user.create({
    data: { username: 'ana_lopez',   email: 'ana@davinci.edu',      name: 'Ana López',        password: pwAna },
  });
  const carlos = await prisma.user.create({
    data: { username: 'carlos_m',    email: 'carlos@davinci.edu',   name: 'Carlos Martínez',  password: pwCarlos },
  });
  const luis = await prisma.user.create({
    data: { username: 'luis_g',      email: 'luis@davinci.edu',     name: 'Luis González',    password: pwLuis },
  });

  // Asignar roles
  await prisma.userRole.createMany({
    data: [
      { userId: admin.id,    roleId: roleAdmin.id },
      { userId: maestro.id,  roleId: roleMaestro.id },
      { userId: ana.id,      roleId: roleAlumno.id },
      { userId: carlos.id,   roleId: roleAlumno.id },
      { userId: luis.id,     roleId: roleAlumno.id },
    ],
  });

  // ── Cursos y secciones ───────────────────────────────────────────────────
  const webCourse = await prisma.course.create({
    data: { name: 'Desarrollo Web', code: 'DW101' },
  });
  const mathCourse = await prisma.course.create({
    data: { name: 'Matemáticas Discretas', code: 'MAT201' },
  });

  const webSection = await prisma.section.create({
    data: { courseId: webCourse.id, name: 'Sección A' },
  });
  const mathSection = await prisma.section.create({
    data: { courseId: mathCourse.id, name: 'Sección B' },
  });

  // ── Horarios ─────────────────────────────────────────────────────────────
  const monday8am  = new Date('1970-01-01T08:00:00');
  const monday10am = new Date('1970-01-01T10:00:00');
  const wed9am     = new Date('1970-01-01T09:00:00');
  const wed11am    = new Date('1970-01-01T11:00:00');

  await prisma.schedule.createMany({
    data: [
      { sectionId: webSection.id,  weekday: 'MONDAY',    startTime: monday8am,  endTime: monday10am, classroom: 'Lab A1' },
      { sectionId: mathSection.id, weekday: 'WEDNESDAY', startTime: wed9am,     endTime: wed11am,    classroom: 'Aula 3' },
    ],
  });

  // ── Asignación de maestros ────────────────────────────────────────────────
  await prisma.teacherAssignment.createMany({
    data: [
      { sectionId: webSection.id,  teacherId: maestro.id },
      { sectionId: mathSection.id, teacherId: maestro.id },
    ],
  });

  // ── Inscripciones ────────────────────────────────────────────────────────
  await prisma.enrollment.createMany({
    data: [
      { sectionId: webSection.id,  studentId: ana.id },
      { sectionId: webSection.id,  studentId: carlos.id },
      { sectionId: webSection.id,  studentId: luis.id },
      { sectionId: mathSection.id, studentId: ana.id },
      { sectionId: mathSection.id, studentId: carlos.id },
    ],
  });

  // ── Sesiones de clase ────────────────────────────────────────────────────
  const today    = new Date();
  const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
  const start8   = new Date('1970-01-01T08:00:00');
  const end10    = new Date('1970-01-01T10:00:00');

  const session1 = await prisma.classSession.create({
    data: {
      sectionId: webSection.id,
      teacherId: maestro.id,
      date:      lastWeek,
      startTime: start8,
      endTime:   end10,
      status:    'CLOSED',
    },
  });
  const session2 = await prisma.classSession.create({
    data: {
      sectionId: webSection.id,
      teacherId: maestro.id,
      date:      today,
      startTime: start8,
      status:    'ACTIVE',
    },
  });

  // ── QR Token ─────────────────────────────────────────────────────────────
  await prisma.qRToken.create({
    data: {
      sessionId: session2.id,
      token:     'qr-demo-token-abc123',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      status:    'ACTIVE',
    },
  });

  // ── Registros de asistencia ──────────────────────────────────────────────
  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: session1.id, studentId: ana.id,    status: 'PRESENT', photoUrl: 'https://via.placeholder.com/100' },
      { sessionId: session1.id, studentId: carlos.id, status: 'LATE',    photoUrl: 'https://via.placeholder.com/100' },
      { sessionId: session1.id, studentId: luis.id,   status: 'ABSENT',  photoUrl: 'https://via.placeholder.com/100' },
    ],
  });

  // ── Perfiles y puntos de alumnos ─────────────────────────────────────────
  const anaProfile = await prisma.studentProfile.create({
    data: { studentId: ana.id,    points: 245, level: 'SILVER' },
  });
  const carlosProfile = await prisma.studentProfile.create({
    data: { studentId: carlos.id, points: 120, level: 'BRONZE' },
  });
  const luisProfile = await prisma.studentProfile.create({
    data: { studentId: luis.id,   points: 500, level: 'GOLD' },
  });

  await prisma.pointsMovement.createMany({
    data: [
      { profileId: anaProfile.id,    reason: 'Asistencia confirmada (Desarrollo Web)',  points: 5  },
      { profileId: anaProfile.id,    reason: 'Racha de 7 días (Bonus)',                 points: 10 },
      { profileId: anaProfile.id,    reason: 'Asistencia temprana (Matemáticas)',       points: 3  },
      { profileId: carlosProfile.id, reason: 'Asistencia confirmada (Desarrollo Web)',  points: 5  },
      { profileId: luisProfile.id,   reason: 'Asistencia confirmada (Desarrollo Web)',  points: 5  },
      { profileId: luisProfile.id,   reason: 'Racha de 30 días (Bonus)',                points: 50 },
    ],
  });

  // ── Justificación de ausencia ────────────────────────────────────────────
  await prisma.absenceJustification.create({
    data: {
      studentId: luis.id,
      sessionId: session1.id,
      sectionId: webSection.id,
      reason:    'Cita médica con comprobante',
      status:    'PENDING',
    },
  });

  // ── Notificaciones ───────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: ana.id,   type: 'CONFIRMATION',  message: 'Tu asistencia en Desarrollo Web fue registrada.' },
      { userId: luis.id,  type: 'ABSENCE_ALERT', message: 'Tienes una ausencia pendiente de justificar en Desarrollo Web.' },
      { userId: carlos.id,type: 'TEACHER_NOTICE', message: 'El Prof. García publicó material nuevo para Matemáticas.' },
    ],
  });

  console.log('✅ Seed completo:');
  console.log('  Usuarios:  admin / prof_garcia / ana_lopez / carlos_m / luis_g');
  console.log('  Passwords: admin123 / maestro123 / alumno123');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
