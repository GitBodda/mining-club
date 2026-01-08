import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "../shared/schema.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const db = drizzle(pool, { schema });

async function addVirtualCardOffer() {
  console.log("Adding BlockMint Virtual Card offer...");
  
  try {
    // Add the new Virtual Card offer with order 0 (first position)
    const newOffer = {
      title: "💳 BlockMint Virtual Card Coming Soon!",
      subtitle: "Revolutionary crypto payments",
      description: "Spend your crypto anywhere with our upcoming virtual card. Join the waitlist for exclusive early access benefits!",
      imageUrl: "https://lottie.host/4495e92b-9f73-41a6-9a64-d28398d29566/vSLht88QDu.lottie",
      backgroundType: 5, // Royal Purple gradient
      ctaText: "Join Whitelist",
      ctaLink: "/virtual-card",
      isActive: true,
      order: 0, // First position
    };

    await db.insert(schema.promotionalOffers).values(newOffer);
    console.log(`✓ Added Virtual Card offer: ${newOffer.title}`);

    console.log("\n✅ Successfully added BlockMint Virtual Card offer!");
  } catch (error) {
    console.error("❌ Error adding Virtual Card offer:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

addVirtualCardOffer();
