import Router from "express";
import { isAuthenticated } from "./../../middlewares/authentcation.middleware.js";
import { isAuthorized } from "./../../middlewares/authorization.middleware.js";
import { fileUpload, filterObject } from "../../utils/multer.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import {
  createProductSchema,
  discountSchema,
  ProductIdSchema,
} from "./product.validation.js";
import {
  addDiscount,
  addProduct,
  addToFavorite,
  deleteProduct,
  editProduct,
  getAllProducts,
  getSingleProduct,
  removeDiscount,
  userFavorites,
} from "./product.controller.js";
const router = Router({ mergeParams: true });

// CRUD
// create product
router.post(
  "/new",
  isAuthenticated,
  isAuthorized("admin"),
  fileUpload(filterObject.image).fields([
    { name: "defaultImage", maxCount: 1 },
    { name: "subImages", maxCount: 3 },
  ]),
  isValid(createProductSchema),
  addProduct
);

router.patch(
  "/edit/:productId",
  isAuthenticated,
  isAuthorized("admin"),
  editProduct
);

// add discount
router.patch(
  "/discount/:productId",
  isAuthenticated,
  isAuthorized("admin"),
  isValid(discountSchema),
  addDiscount
);

// add to favorite
router.patch(
  "/favorites/add",
  isAuthenticated,
  isValid(ProductIdSchema),
  addToFavorite
);

// get favorites
router.get("/favorites", isAuthenticated, userFavorites);

// remove discount
router.patch(
  "/delDiscount/:productId",
  isAuthenticated,
  isAuthorized("admin"),
  removeDiscount
);

// delete product
router.delete(
  "/:productId",
  isAuthenticated,
  isAuthorized("admin"),
  isValid(ProductIdSchema),
  deleteProduct
);

// get all products
router.get("/", getAllProducts);

// get single product
router.get("/:productId", isValid(ProductIdSchema), getSingleProduct);

// get products of category
router.get("/category/:categoryId/products", getAllProducts);

export default router;
