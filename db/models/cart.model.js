import mongoose, { Schema, Types, model } from "mongoose";
import { Product } from "./product.model.js";

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },
    products: [
      {
        product: {
          type: Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
    intialTotalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Cart = mongoose.models.cartModel || model("cart", cartSchema);
