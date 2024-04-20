import { Router } from "express";
import { isAuthenticated } from "./../../middlewares/authentcation.middleware.js";
import { isValid } from "./../../middlewares/validation.middleware.js";
import { CartSchema, removeProductSchema } from "./cart.validation.js";
import {
  addToCart,
  clearCart,
  removeProductFromCart,
  updateCart,
  userCart,
} from "./cart.controller.js";

const router = Router();

// CRUD
// add product to cart
router.post("/add", isAuthenticated, isValid(CartSchema), addToCart);

// user cart
router.get("/", isAuthenticated, userCart);

// update cart
router.patch("/", isAuthenticated, isValid(CartSchema), updateCart);

// clear cart
router.delete("/clear", isAuthenticated, clearCart);

// remove product from cart
router.delete(
  "/:product",
  isAuthenticated,
  isValid(removeProductSchema),
  removeProductFromCart
);

export default router;
