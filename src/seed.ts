import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./prisma/db.js";
import { logger } from "./logger.js";

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080`;

const products = [
  {
    title: "Premium Stainless Steel Dog Bowl",
    category: "Bowls & Feeders",
    price: "24.99",
    rating: 5,
    stock_quantity: 40,
    description:
      "Durable stainless steel dog bowl designed for medium to large breeds. Non-slip rubber base prevents sliding and spillage. Dishwasher safe and rust-resistant for long-lasting use. Perfect for both food and water.",
    images: [
      IMG("photo-1598134493179-51332e56807f"),
      IMG("photo-1598134493179-51332e56807f"),
      IMG("photo-1598134493179-51332e56807f"),
    ],
  },
  {
    title: "Multi-Level Cat Scratching Post",
    category: "Toys & Scratchers",
    price: "89.99",
    rating: 4.5,
    stock_quantity: 15,
    description:
      "Three-tier cat scratching post with sisal rope wrapping and plush platforms. Provides multiple levels for climbing, scratching, and resting. Sturdy base ensures stability during active play.",
    images: [
      IMG("photo-1545249390-6bdfa286032f"),
      IMG("photo-1545249390-6bdfa286032f"),
      IMG("photo-1545249390-6bdfa286032f"),
    ],
  },
  {
    title: "Orthopedic Memory Foam Pet Bed",
    category: "Beds & Furniture",
    price: "69.99",
    rating: 3.5,
    stock_quantity: 22,
    description:
      "Luxurious memory foam pet bed with removable, machine-washable cover. Provides superior support for senior pets and those with joint issues. Water-resistant liner protects the foam core.",
    images: [
      IMG("photo-1713106872096-cee971f0528e"),
      IMG("photo-1713106872096-cee971f0528e"),
      IMG("photo-1713106872096-cee971f0528e"),
    ],
  },
  {
    title: "Reflective Nylon Dog Leash & Collar Set",
    category: "Leashes & Collars",
    price: "32.99",
    rating: 4,
    stock_quantity: 60,
    description:
      "High-visibility reflective dog leash and collar set perfect for evening walks. Durable nylon construction with reinforced stitching. Quick-release buckle and adjustable sizing.",
    images: [
      IMG("photo-1577447278822-37801be21738"),
      IMG("photo-1577447278822-37801be21738"),
      IMG("photo-1577447278822-37801be21738"),
    ],
  },
  {
    title: "Interactive Rubber Chew Ball",
    category: "Toys & Scratchers",
    price: "15.99",
    rating: 5,
    stock_quantity: 120,
    description:
      "Durable rubber chew ball designed for aggressive chewers. Features textured surface for dental health and can be filled with treats for extended playtime. Non-toxic, BPA-free rubber.",
    images: [
      IMG("photo-1758543535539-325abf59ef48"),
      IMG("photo-1758543535539-325abf59ef48"),
      IMG("photo-1758543535539-325abf59ef48"),
    ],
  },
  {
    title: "Airline-Approved Pet Travel Carrier",
    category: "Travel & Carriers",
    price: "54.99",
    rating: 4,
    stock_quantity: 18,
    description:
      "Soft-sided pet carrier approved for airline cabin use. Features mesh panels for ventilation, padded shoulder strap, and collapsible design for easy storage. Meets TSA requirements.",
    images: [
      IMG("photo-1764813824215-4afa03d1a011"),
      IMG("photo-1764813824215-4afa03d1a011"),
      IMG("photo-1764813824215-4afa03d1a011"),
    ],
  },
];

const main = async () => {
  // Global seed flag: if the database was already seeded, skip everything
  const seeded = await db.orm.public.AppMeta.first({ key: "seeded" });
  if (seeded) {
    logger.info("Database was already seeded — skipping");
    await db.close();
    return;
  }

  const adminEmail = process.env["SEED_ADMIN_EMAIL"] ?? "admin@paws.store";
  const adminPassword = process.env["SEED_ADMIN_PASSWORD"] ?? "admin123";

  const existingAdmin = await db.orm.public.User
    .where((u) => u.email.eq(adminEmail))
    .first();
  if (!existingAdmin) {
    await db.orm.public.User.create({
      email: adminEmail,
      password_hash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    });
    logger.info(`Admin user created: ${adminEmail}`);
  }

  const promo = await db.orm.public.Promocode.where((p) =>
    p.code.eq("SAVE10"),
  ).first();
  if (!promo) {
    await db.orm.public.Promocode.create({
      code: "SAVE10",
      discount_percentage: 10,
      is_active: true,
    });
    logger.info("Promocode SAVE10 created");
  }

  for (const product of products) {
    const existing = await db.orm.public.Product
      .where((p) => p.title.eq(product.title))
      .first();
    if (existing) {
      if (existing.category === "Uncategorized") {
        await db.orm.public.Product.where({ id: existing.id }).update({
          category: product.category,
        });
      }
      continue;
    }

    const created = await db.orm.public.Product.create({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      rating: product.rating,
      stock_quantity: product.stock_quantity,
    });
    for (const url of product.images) {
      await db.orm.public.Image.create({ productId: created.id, url });
    }
    logger.info(`Product created: ${product.title}`);
  }

  await db.orm.public.AppMeta.create({ key: "seeded", value: "true" });
  logger.info("Seeding finished");
  await db.close();
};

main().catch((err) => {
  logger.error({ err }, "Seeding failed");
  process.exit(1);
});
