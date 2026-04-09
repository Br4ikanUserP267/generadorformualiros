const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Aborting seed.')
    process.exit(1)
  }

  if (!email || !password) {
    console.error('Please set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables.')
    process.exit(1)
  }

  const prisma = new PrismaClient()
  try {
    const hashed = await bcrypt.hash(password, 10)

    const existing = await prisma.usuario.findUnique({ where: { email } })
    if (existing) {
      console.log('User already exists:', email)
      return
    }

    const user = await prisma.usuario.create({
      data: {
        nombre: 'Admin',
        email,
        passwordHash: hashed,
      }
    })

    console.log('Created admin user:', user.email)
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

