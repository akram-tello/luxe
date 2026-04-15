import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const ALLOWED_DOMAIN = "@valiram.com";

function parseFlags(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a || !a.startsWith("--")) continue;
    const key = a.slice(2);
    const eq = key.indexOf("=");
    if (eq >= 0) {
      out[key.slice(0, eq)] = key.slice(eq + 1);
    } else {
      out[key] = argv[++i] ?? "";
    }
  }
  return out;
}

function usage(): never {
  console.error(
    "Usage: npm run user:add-manager -- --email <name>@valiram.com --name \"Full Name\" --password \"TempPass!123\"",
  );
  process.exit(1);
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const email = (flags.email ?? "").trim().toLowerCase();
  const name = (flags.name ?? "").trim();
  const password = flags.password ?? "";

  if (!email || !name || !password) usage();
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    console.error(`Email must end with ${ALLOWED_DOMAIN}`);
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.error(`A user already exists with email ${email}.`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: UserRole.MANAGER,
        passwordHash,
      },
    });

    console.log("Manager created:");
    console.log(`  email:    ${user.email}`);
    console.log(`  name:     ${user.name}`);
    console.log(`  password: ${password}`);
    console.log("They will land on /2fa/enroll on first login.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
