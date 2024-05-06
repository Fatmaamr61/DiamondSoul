import mongoose, { Schema, Types, model } from "mongoose";

const orderSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "user", required: true },
    products: [
      {
        _id: false,
        product: { type: Types.ObjectId, ref: "product" },
        quantity: { type: Number, min: 1 },
        name: String,
        itemPrice: Number,
        totalPrice: Number,
      },
    ],
    invoice: { id: String, url: String },
    city: {
      type: String,
      enum: [
        "cairo",
        "giza",
        "alexandria",
        "suez",
        "ismailia",
        "port said",
        "menofia",
        "qalyubia",
        "kafr el-sheikh",
        "damietta",
        "beheira",
        "sharqia",
        "gharbia",
        "dakahlia",
        "fayoum",
        "beni suef",
        "minya",
        "assiut",
        "sohag",
        "qena",
        "luxor",
        "aswan",
        "north coast",
        "matrouh",
        "red sea",
        "new valley",
        "sharm el-sheikh",
      ],
      required: true,
    },
    fullAdress: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    coupon: {
      id: { type: Types.ObjectId, ref: "coupon" },
      name: String,
      discount: { type: Number, min: 1, max: 100 },
    },
    finalPrice: { type: Number },
    status: {
      type: String,
      enum: [
        "placed",
        "shipped",
        "delivered",
        "canceled",
        "refunded",
        "visa paid",
        "failed payment",
      ],
      default: "placed",
    },
    payment: {
      type: String,
      enum: ["visa", "cash"],
      default: "cash",
    },
    shipping: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  { timestamps: true }
);

/* orderSchema.virtual("finalPrice").get(function () {
  return this.coupon
    ? Number.parseFloat(
        this.coupon - (this.price * this.coupon.discount) / 100
      ).toFixed(2)
    : this.price;
}); */

export const Order = mongoose.models.orderModel || model("order", orderSchema);
