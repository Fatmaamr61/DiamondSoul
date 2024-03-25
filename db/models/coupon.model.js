import { Schema, Types, model } from "mongoose";

const couponSchema = new Schema(
  {
    name: { type: String, required: true },
    discount: { type: Number, min: 1, max: 100, required: true },
    expiredAt: { type: Number },
    createdBy: { type: Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true }
);

// model
export const couponModel = model("coupon", couponSchema);
