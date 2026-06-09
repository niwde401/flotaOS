import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('Admin1234!', 10)

  // Director
  const director = await prisma.user.upsert({
    where: { email: 'director@yofc.pe' },
    update: {},
    create: { email: 'director@yofc.pe', password: hash, role: 'director', isActive: true },
  })

  // Region Lima
  const regionLima = await prisma.region.upsert({
    where: { code: 'LIM' },
    update: {},
    create: { name: 'Lima', code: 'LIM', colorHex: '2563EB' },
  })

  // Zone Lima Norte
  const zone = await prisma.zone.create({
    data: { name: 'Lima Norte', regionId: regionLima.id },
  })

  // Coordinador user
  const coordUser = await prisma.user.upsert({
    where: { email: 'coord@yofc.pe' },
    update: {},
    create: { email: 'coord@yofc.pe', password: hash, role: 'coordinador', isActive: true },
  })
  const coordStaff = await prisma.staff.create({
    data: {
      userId: coordUser.id,
      fullName: 'María Coordinadora',
      email: 'coord@yofc.pe',
      regionId: regionLima.id,
      role: 'coordinador',
    },
  })

  // Vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      plateNumber: 'ABC-123',
      brand: 'Toyota',
      model: 'Hilux 4x4',
      year: 2022,
      vehicleType: 'own',
      status: 'active',
      fuelType: 'diesel',
      currentKm: 45200,
    },
  })

  // Driver user
  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@yofc.pe' },
    update: {},
    create: { email: 'driver@yofc.pe', password: hash, role: 'driver', isActive: true },
  })
  const driver = await prisma.driver.create({
    data: {
      userId: driverUser.id,
      fullName: 'Carlos Chofer',
      dni: '12345678',
      licenseNumber: 'LIC-001',
      licenseExpiry: new Date('2027-01-01'),
      licenseCategory: 'AIIIB',
      medicalCertExpiry: new Date('2026-12-01'),
      assignedVehicleId: vehicle.id,
    },
  })

  // Team
  const team = await prisma.team.create({
    data: {
      name: 'Equipo Norte 1',
      regionId: regionLima.id,
      zoneId: zone.id,
      vehicleId: vehicle.id,
      tripDate: new Date(),
    },
  })

  // Node
  await prisma.node.create({
    data: {
      code: 'LIM-001',
      name: 'Nodo Comas Principal',
      regionId: regionLima.id,
      zoneId: zone.id,
      latitude: -11.9254,
      longitude: -77.0385,
      nodeType: 'node',
    },
  })

  // Petty cash account
  await prisma.pettyCashAccount.create({
    data: {
      regionId: regionLima.id,
      permanentFund: 5000,
      currentBalance: 3200,
      periodStart: new Date(),
    },
  })

  console.log('Seed complete. Users: director@yofc.pe, coord@yofc.pe, driver@yofc.pe (all pw: Admin1234!)')
}

main().catch(console.error).finally(() => prisma.$disconnect())
