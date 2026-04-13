import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe!123", 12);

  const manager = await prisma.user.upsert({
    where: { email: "manager@luxe.local" },
    update: {},
    create: {
      email: "manager@luxe.local",
      name: "Helena Roux",
      role: UserRole.MANAGER,
      passwordHash,
    },
  });

  const associate = await prisma.user.upsert({
    where: { email: "associate@luxe.local" },
    update: {},
    create: {
      email: "associate@luxe.local",
      name: "Antoine Laurent",
      role: UserRole.ASSOCIATE,
      passwordHash,
    },
  });

  const templates = [
    {
      name: "Welcome — New Client",
      category: "WELCOME",
      body:
        "Dear {{client_name}}, it was a privilege to welcome you at {{store_name}}. I am {{associate_name}} and remain at your service for any enquiry.",
      variables: ["client_name", "associate_name", "store_name"],
    },
    {
      name: "Wishlist Availability",
      category: "WISHLIST",
      body:
        "Good day {{client_name}}, a piece matching your interest — {{wishlist_item}} — has become available at {{store_name}}. I would be delighted to reserve a private viewing. — {{associate_name}}",
      variables: ["client_name", "wishlist_item", "store_name", "associate_name"],
    },
    {
      name: "Appointment Confirmation",
      category: "APPOINTMENT",
      body:
        "Dear {{client_name}}, confirming our appointment at {{store_name}}. I look forward to receiving you. Warmly, {{associate_name}}.",
      variables: ["client_name", "store_name", "associate_name"],
    },
    {
      name: "Service Reminder",
      category: "SERVICE",
      body:
        "Dear {{client_name}}, our records indicate your timepiece is due for its complimentary service check at {{store_name}}. May I arrange a convenient time? — {{associate_name}}",
      variables: ["client_name", "store_name", "associate_name"],
    },
    {
      name: "Anniversary Greetings",
      category: "ANNIVERSARY",
      body:
        "Dear {{client_name}}, wishing you a most memorable anniversary from all of us at {{store_name}}. Warmest regards, {{associate_name}}.",
      variables: ["client_name", "store_name", "associate_name"],
    },
  ];

  for (const t of templates) {
    const existing = await prisma.template.findFirst({ where: { name: t.name } });
    if (existing) continue;
    await prisma.template.create({ data: t });
  }

  console.log("Seed complete:");
  console.log("  manager:", manager.email, "(password: ChangeMe!123)");
  console.log("  associate:", associate.email, "(password: ChangeMe!123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
