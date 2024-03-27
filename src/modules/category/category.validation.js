import joi from "joi";
import { isValidObjectId } from "../../middlewares/validation.middleware.js";

// create category schema
export const createCategorySchema = joi
  .object({
    name: joi.string().min(4).max(20).required(),
    createdBy: joi.string().custom(isValidObjectId),
  })
  .required();

// update category
export const updateCategorySchema = joi
  .object({
    name: joi.string().min(4).max(20),
    categoryId: joi.string().custom(isValidObjectId).required(),
  })
  .required();

// delete category
export const deleteCategorySchema = joi
  .object({
    categoryId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
