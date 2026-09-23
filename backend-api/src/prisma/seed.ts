import bcrypt from 'bcrypt';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from './permission-catalog';
import prisma from '../utils/prisma';

const BCRYPT_ROUNDS = 10;

const TEST_USERS = [
  { name: 'Admin User', email: 'admin@hope.dev', role: 'ADMIN' },
  { name: 'Coordinator User', email: 'coordinator@hope.dev', role: 'COORDINATOR' },
  { name: 'Mentor User', email: 'mentor@hope.dev', role: 'MENTOR' },
  { name: 'Faculty User', email: 'faculty@hope.dev', role: 'FACULTY' },
  { name: 'Trainer User', email: 'trainer@hope.dev', role: 'TRAINER' },
  { name: 'Student User', email: 'student@hope.dev', role: 'STUDENT' },
] as const;

async function main() {
  const testPassword = process.env.SEED_TEST_PASSWORD;
  if (!testPassword) {
    throw new Error(
      'SEED_TEST_PASSWORD environment variable is required. ' +
      'Set it to a development-only password (12+ chars) in your .env file.',
    );
  }

  if (testPassword.length < 12) {
    throw new Error('SEED_TEST_PASSWORD must be at least 12 characters (password policy).');
  }

  console.log('Seeding roles...');
  const roleMap = new Map<string, string>();
  for (const roleName of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roleMap.set(roleName, role.id);
    console.log(`  Role: ${roleName} (${role.id})`);
  }

  console.log('\nSeeding permissions...');
  const permissionMap = new Map<string, string>();
  for (const perm of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description },
      create: { code: perm.code, description: perm.description },
    });
    permissionMap.set(perm.code, permission.id);
  }
  console.log(`  ${PERMISSIONS.length} permissions upserted.`);

  console.log('\nSeeding role-permission mappings...');
  let mappingCount = 0;
  for (const [roleName, codes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) {
      throw new Error(`Role ${roleName} not found in role map.`);
    }

    for (const code of codes) {
      const permissionId = permissionMap.get(code);
      if (!permissionId) {
        throw new Error(`Permission code "${code}" (assigned to ${roleName}) not found in permission map.`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        update: {},
        create: { roleId, permissionId },
      });
      mappingCount++;
    }
  }
  console.log(`  ${mappingCount} role-permission mappings upserted.`);

  console.log('\nSeeding test users...');
  const passwordHash = await bcrypt.hash(testPassword, BCRYPT_ROUNDS);

  for (const testUser of TEST_USERS) {
    const roleId = roleMap.get(testUser.role);
    if (!roleId) {
      throw new Error(`Role ${testUser.role} not found for test user ${testUser.email}.`);
    }

    const user = await prisma.user.upsert({
      where: { email: testUser.email },
      update: {
        name: testUser.name,
        roleId,
        passwordHash,
        status: 'ACTIVE',
      },
      create: {
        name: testUser.name,
        email: testUser.email,
        passwordHash,
        roleId,
        status: 'ACTIVE',
      },
    });
    console.log(`  User: ${testUser.name} <${testUser.email}> role=${testUser.role} (${user.id})`);
  }

  console.log('\nSeed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
