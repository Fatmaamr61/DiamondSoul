import mongoose, { Schema, Types, model } from "mongoose";
import { productModel } from "./product.model.js";

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
        productId: {
          type: Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const cartModel = mongoose.models.cartModel || model("cart", cartSchema);
