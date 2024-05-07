import mongoose, { Schema, Types, model } from "mongoose";

export const invoiceSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "user" },
    invoice: [{ id: String, url: String }],
  },
  { timestamps: true }
);

export const Invoice =
  mongoose.models.invoiceModel || model("invoice", invoiceSchema);
