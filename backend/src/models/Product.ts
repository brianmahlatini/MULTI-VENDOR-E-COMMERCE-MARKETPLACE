import mongoose, { Schema } from "mongoose";

const ReviewSchema = new Schema(
  {
    buyerId: { type: String, required: true },
    buyerName: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 1200, required: true }
  },
  { timestamps: true }
);

const ProductSchema = new Schema(
  {
    sellerId: { type: String, index: true, required: true },
    title: { type: String, text: true, required: true },
    description: { type: String, text: true, required: true },
    category: { type: String, index: true, required: true },
    price: { type: Number, min: 0, required: true },
    inventory: { type: Number, min: 0, required: true },
    imageUrls: [{ type: String, required: true }],
    active: { type: Boolean, default: true },
    reviews: [ReviewSchema]
  },
  { timestamps: true }
);

ProductSchema.index({ title: "text", description: "text", category: "text" });

export const Product = mongoose.model("Product", ProductSchema);
