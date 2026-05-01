import { connectMongo } from "../db/mongo.js";
import { Product } from "../models/Product.js";

const products = [
  {
    sellerId: "seed-seller-electronics",
    title: "Wireless Noise Cancelling Headphones",
    description: "Comfortable over-ear headphones with long battery life, active noise cancelling, and crisp everyday sound.",
    category: "Electronics",
    price: 129.99,
    inventory: 24,
    imageUrls: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-electronics",
    title: "Smart Watch Fitness Tracker",
    description: "A lightweight smart watch for activity tracking, notifications, heart-rate monitoring, and daily productivity.",
    category: "Electronics",
    price: 89.99,
    inventory: 31,
    imageUrls: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-fashion",
    title: "Classic Leather Sneakers",
    description: "Minimal low-top sneakers with a clean leather finish, cushioned sole, and versatile everyday styling.",
    category: "Fashion",
    price: 74.5,
    inventory: 46,
    imageUrls: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-fashion",
    title: "Structured Canvas Tote Bag",
    description: "Durable canvas tote with reinforced handles, interior pockets, and enough room for work or weekend errands.",
    category: "Fashion",
    price: 39.99,
    inventory: 58,
    imageUrls: ["https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-home",
    title: "Modern Ceramic Table Lamp",
    description: "Warm ceramic lamp with a woven shade, compact footprint, and soft lighting for bedrooms or desks.",
    category: "Home",
    price: 54.99,
    inventory: 18,
    imageUrls: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-home",
    title: "Textured Cotton Throw Pillow",
    description: "Soft decorative pillow with a woven cotton cover, neutral texture, and removable insert.",
    category: "Home",
    price: 22.99,
    inventory: 64,
    imageUrls: ["https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-beauty",
    title: "Hydrating Skin Care Set",
    description: "Daily skin care bundle with cleanser, serum, and moisturizer made for a simple morning routine.",
    category: "Beauty",
    price: 48,
    inventory: 37,
    imageUrls: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-beauty",
    title: "Matte Lip Color Collection",
    description: "Set of smooth matte lip colors in wearable shades with comfortable all-day pigment.",
    category: "Beauty",
    price: 29.99,
    inventory: 43,
    imageUrls: ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-sports",
    title: "Training Yoga Mat",
    description: "Non-slip exercise mat with dense cushioning for yoga, stretching, pilates, and home workouts.",
    category: "Sports",
    price: 34.99,
    inventory: 52,
    imageUrls: ["https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-sports",
    title: "Adjustable Dumbbell Pair",
    description: "Compact adjustable dumbbells for strength training at home, with quick weight changes and secure grips.",
    category: "Sports",
    price: 119,
    inventory: 15,
    imageUrls: ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80"]
  }
];

async function main() {
  await connectMongo();
  await Product.deleteMany({ sellerId: /^seed-seller-/ });
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
