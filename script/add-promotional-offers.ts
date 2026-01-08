import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "../shared/schema.js";
import { sql } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const db = drizzle(pool, { schema });

async function addPromotionalOffers() {
  console.log("Adding promotional offers...");
  
  try {
    // First, ensure the table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS promotional_offers (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title TEXT NOT NULL,
        subtitle TEXT,
        description TEXT,
        image_url TEXT,
        background_type INTEGER NOT NULL DEFAULT 1,
        cta_text TEXT,
        cta_link TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        "order" INTEGER NOT NULL DEFAULT 0,
        valid_from TIMESTAMP,
        valid_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);
    console.log("✓ Promotional offers table ready");

    // Clear existing offers
    await db.delete(schema.promotionalOffers);
    console.log("✓ Cleared existing offers");

    // Insert new offers with different themes and images
    const offers = [
      {
        title: "Start Mining Bitcoin Today!",
        subtitle: "Get up to 50% more hashpower",
        description: "Join thousands of miners earning passive income with our state-of-the-art mining infrastructure",
        imageUrl: "/attached_assets/Bitcoin_Mine_1766014388617.png",
        backgroundType: 1, // Electric Blue
        ctaText: "Start Mining",
        ctaLink: "/dashboard",
        isActive: true,
        order: 1,
      },
      {
        title: "Premium Mining Plans",
        subtitle: "Upgrade your mining power",
        description: "Exclusive high-performance miners with guaranteed ROI in 90 days",
        imageUrl: "/attached_assets/Gpu_Mining_1766014388614.webp",
        backgroundType: 2, // Sunset Orange
        ctaText: "View Plans",
        ctaLink: "/dashboard",
        isActive: true,
        order: 2,
      },
      {
        title: "Lightning Fast Payouts",
        subtitle: "Daily earnings to your wallet",
        description: "Automatic payouts every 24 hours. Mine now, earn daily!",
        imageUrl: "/attached_assets/Bitcoin_Wallet_1766014388613.png",
        backgroundType: 3, // Ocean Teal
        ctaText: "Learn More",
        ctaLink: "/dashboard",
        isActive: true,
        order: 3,
      },
      {
        title: "Welcome Bonus",
        subtitle: "Get 100 free GH/s",
        description: "Sign up now and receive free mining power for your first 7 days",
        imageUrl: "/attached_assets/Bitcoin_Mining_Cart_1766014388619.webp",
        backgroundType: 4, // Forest Green
        ctaText: "Claim Bonus",
        ctaLink: "/dashboard",
        isActive: true,
        order: 4,
      },
      {
        title: "Top Miners Leaderboard",
        subtitle: "Compete and win rewards",
        description: "Top 10 miners win exclusive prizes and bonuses monthly",
        imageUrl: "/attached_assets/Mixed_main_1766014388605.png",
        backgroundType: 5, // Royal Purple
        ctaText: "View Rankings",
        ctaLink: "/dashboard",
        isActive: true,
        order: 5,
      },
      {
        title: "Limited Time Offer",
        subtitle: "50% off all mining plans",
        description: "Flash sale! Get premium miners at half the price. Ends soon!",
        imageUrl: "/attached_assets/litecoin-3d-icon-png-download-4466121_1766014388608.png",
        backgroundType: 6, // Golden Amber
        ctaText: "Get Deal",
        ctaLink: "/dashboard",
        isActive: true,
        order: 6,
      },
      {
        title: "Refer & Earn",
        subtitle: "Get 10% commission",
        description: "Invite friends and earn 10% of their mining rewards forever",
        imageUrl: "/attached_assets/ethereum-eth-logo.png",
        backgroundType: 7, // Cool Gray
        ctaText: "Get Link",
        ctaLink: "/dashboard",
        isActive: true,
        order: 7,
      },
      {
        title: "VIP Membership",
        subtitle: "Exclusive benefits",
        description: "Priority support, lower fees, and bonus hashpower for VIP members",
        imageUrl: "/attached_assets/Gemini_Generated_Image_1ri2av1ri2av1ri2_(1)_1766014388604.png",
        backgroundType: 8, // Coral
        ctaText: "Join VIP",
        ctaLink: "/dashboard",
        isActive: true,
        order: 8,
      },
      {
        title: "Track Your Earnings",
        subtitle: "Real-time analytics",
        description: "Monitor your mining performance with detailed charts and statistics",
        imageUrl: "/attached_assets/Gemini_Generated_Image_46ieyx46ieyx46ie_(1)_1766014388603.png",
        backgroundType: 9, // Mint
        ctaText: "View Stats",
        ctaLink: "/history",
        isActive: true,
        order: 9,
      },
      {
        title: "Multi-Coin Mining",
        subtitle: "Mine BTC, LTC, ETH & more",
        description: "Diversify your earnings by mining multiple cryptocurrencies simultaneously",
        imageUrl: "/attached_assets/stock_images/usdt_tether_cryptocu_4498e890.jpg",
        backgroundType: 10, // Deep Space
        ctaText: "Start Now",
        ctaLink: "/dashboard",
        isActive: true,
        order: 10,
      },
    ];

    for (const offer of offers) {
      await db.insert(schema.promotionalOffers).values(offer);
      console.log(`✓ Added offer: ${offer.title}`);
    }

    console.log("\n✅ Successfully added all promotional offers!");
  } catch (error) {
    console.error("❌ Error adding promotional offers:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

addPromotionalOffers().catch(console.error);
