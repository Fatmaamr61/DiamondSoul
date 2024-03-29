import Joi from "joi";

// create coupon Schema
export const createCouponSchema = Joi.object({
  discount: Joi.number().min(1).max(100).required(),
  expiredAt: Joi.date().greater(Date.now()).required(),
}).required();

// update coupon Schema
export const updateCouponSchema = Joi.object({
  code: Joi.string().length(5).required(),
  discount: Joi.number().min(1).max(100),
  expiredAt: Joi.date().greater(Date.now()),
}).required();

// delete coupon Schema
export const deleteCouponSchema = Joi.object({
  code: Joi.string().length(5).required(),
}).required();
