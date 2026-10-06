import { db } from "./index";
import { users } from "./schema";

async function main() {
  console.log("🚀 ---- SEEDING BASICS START ----");

  try {
    console.log("🧹 Cleaning users table records...");
    await db.delete(users);

    console.log("🌱 Inserting test user record...");
    await db.insert(users).values({
      email: "test.user@example.com",
    });

    console.log("✅ ---- SEEDING COMPLETED CLEANLY ----");
  } catch (error) {
    console.error("❌ Seed operation failed:", error);
    process.exit(1);
  }
}

main();
