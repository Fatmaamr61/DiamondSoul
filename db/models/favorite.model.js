import { Schema, Types, model } from "mongoose";

const favoriteSchema = new Schema({
  user: {
    type: Types.ObjectId,
    ref: "user",
  },
  products: [{ id: { type: Types.ObjectId, ref: "product" } }],
});

export const Favorites = model("favorite", favoriteSchema);
