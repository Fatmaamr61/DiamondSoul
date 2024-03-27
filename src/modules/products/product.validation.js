import joi from "joi";
import { isValidObjectId } from "./../../middlewares/validation.middleware.js";

export const createProductSchema = joi
  .object({
    name: joi.string().min(4).max(20).required(),
    price: joi.number().min(1).required(),
    description: joi.string(),
    availableItems: joi.number().min(1).required(),
    soldItems: joi.number().min(0),
    discount: joi.number().min(1).max(100),
    createdBy: joi.string().custom(isValidObjectId),
    category: joi.string().custom(isValidObjectId),
  })
  .required();
