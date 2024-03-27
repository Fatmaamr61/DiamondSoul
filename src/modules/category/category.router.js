import { Router } from "express";
import { isValid } from "../../middlewares/validation.middleware.js";
import {
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from "./category.validation.js";
import { isAuthenticated } from "../../middlewares/authentcation.middleware.js";
import { isAuthorized } from "../../middlewares/authorization.middleware.js";
import { fileUpload, filterObject} from "../../utils/multer.js";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  getAllCategories,
  getCategoryById,
} from "./category.controller.js";
//import productRouter from "./../product/product.router.js";

const router = Router();
//router.use("/:categoryId/products", productRouter);

// CRUD
// create category
router.post(
  "/new",
  isAuthenticated,
  isAuthorized("admin"),
  fileUpload(filterObject.image).single("image"),
  isValid(createCategorySchema),
  createCategory
);


// update category
router.patch(
  "/:categoryId",
  isAuthenticated,
  isAuthorized("admin"),
  fileUpload(filterObject.image).single("image"),
  isValid(updateCategorySchema),
  updateCategory
);

// delete category
router.delete(
  "/:categoryId",
  isAuthenticated,
  isAuthorized("admin"),
  isValid(deleteCategorySchema),
  deleteCategory
);

// get all categories
router.get("/", getAllCategories);

// get category by id
router.get("/:categoryId", getCategoryById);


export default router;
