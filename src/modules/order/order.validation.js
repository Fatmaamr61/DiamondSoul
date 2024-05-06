import joi from "joi";
import { isValidObjectId } from "../../middlewares/validation.middleware.js";

// create order schema
export const createOrderSchema = joi
  .object({
    city: joi
      .string()
      .min(10)
      .valid(
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
        "sharm el-sheikh"
      )
      .required(),
    fullAddress: joi.string().min(10).required(),
    coupon: joi.string().length(5),
    phone: joi.string().length(11).required(),
    payment: joi.string().valid("cash", "visa"),
  })
  .required();

// cancel order schema
export const cancelOrderSchema = joi
  .object({
    orderId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
