import joi from "joi";
import { isValidObjectId } from "../../middlewares/validation.middleware.js";

// create and update cart schema
export const CartSchema = joi
  .object({
    product: joi.string().custom(isValidObjectId).required(),
    quantity: joi.number().integer().min(1).required(),
    intialTotalPrice: joi.number(),
  })
  .required();

// remove product schema
export const removeProductSchema = joi
  .object({
    product: joi.string().custom(isValidObjectId).required(),
  })
  .required();
