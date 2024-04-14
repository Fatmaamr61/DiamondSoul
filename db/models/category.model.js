import mongoose, { Schema, model, Types } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, min: 4, max: 20 },
    slug: { type: String, required: true },
    image: {
      url: { type: String, required: true },
      id: { type: String, required: true },
    },
    products: [{ type: Types.ObjectId, ref: "product" }],
    createdBy: { type: Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const Category =
  mongoose.models.categoryModel || model("category", categorySchema);
