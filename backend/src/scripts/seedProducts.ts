import { connectMongo } from "../db/mongo.js";
import { Product } from "../models/Product.js";
import { bustProductCache } from "../services/cache.js";

const products = [
  {
    sellerId: "seed-seller-electronics",
    title: "Studio Wireless Headphones",
    description: "Comfortable over-ear headphones with active noise cancelling, rich bass, and all-day battery life.",
    category: "Electronics",
    price: 149.99,
    inventory: 28,
    imageUrls: ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-electronics",
    title: "Aluminum Smart Watch",
    description: "A lightweight smart watch for activity tracking, notifications, heart-rate monitoring, and daily productivity.",
    category: "Electronics",
    price: 89.99,
    inventory: 31,
    imageUrls: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-electronics",
    title: "Portable Bluetooth Speaker",
    description: "Compact wireless speaker with water-resistant housing, clear vocals, and room-filling sound.",
    category: "Electronics",
    price: 64.99,
    inventory: 42,
    imageUrls: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-fashion",
    title: "Classic Leather Sneakers",
    description: "Minimal low-top sneakers with a clean leather finish, cushioned sole, and versatile everyday styling.",
    category: "Fashion",
    price: 74.5,
    inventory: 46,
    imageUrls: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-fashion",
    title: "Structured Leather Tote",
    description: "Durable tote with reinforced handles, interior pockets, and enough room for work or weekend errands.",
    category: "Fashion",
    price: 59.99,
    inventory: 58,
    imageUrls: ["https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-fashion",
    title: "Lightweight Denim Jacket",
    description: "A relaxed denim jacket with durable stitching, easy layering, and a timeless everyday fit.",
    category: "Fashion",
    price: 82,
    inventory: 23,
    imageUrls: ["https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80"]
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
    title: "Linen Bedding Set",
    description: "Soft breathable bedding with a clean woven texture, neutral palette, and year-round comfort.",
    category: "Home",
    price: 96,
    inventory: 21,
    imageUrls: ["https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-home",
    title: "Stoneware Coffee Mug Set",
    description: "A set of glazed stoneware mugs with a comfortable handle and handmade-inspired finish.",
    category: "Home",
    price: 28.5,
    inventory: 49,
    imageUrls: ["https://images.unsplash.com/photo-1510446418220-00d2e0a27795?auto=format&fit=crop&w=1200&q=80"]
  },
  {
    sellerId: "seed-seller-beauty",
    title: "Hydrating Skin Care Set",
    description: "Daily skin care bundle with cleanser, serum, and moisturizer made for a simple morning routine.",
    category: "Beauty",
    price: 48,
    inventory: 37,
    imageUrls: ["https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1200&q=80"]
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
    sellerId: "seed-seller-beauty",
    title: "Signature Eau de Parfum",
    description: "A balanced fragrance with fresh citrus, soft florals, and warm amber for everyday wear.",
    category: "Beauty",
    price: 68,
    inventory: 26,
    imageUrls: ["https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80"]
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
  },
  {
    sellerId: "seed-seller-sports",
    title: "Insulated Training Bottle",
    description: "Double-wall stainless steel bottle that keeps drinks cold through workouts, hikes, and daily commutes.",
    category: "Sports",
    price: 24.99,
    inventory: 67,
    imageUrls: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80"]
  }
];

async function main() {
  await connectMongo();
  await Product.deleteMany({ sellerId: /^seed-seller-/ });
  await Product.insertMany(products);
  await bustProductCache();
  console.log(`Seeded ${products.length} products`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
