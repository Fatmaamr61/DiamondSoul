import { Router } from "express";
import { isAuthenticated } from "../../middlewares/authentcation.middleware.js";
import { isAuthorized } from "../../middlewares/authorization.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import {
  createCouponSchema,
  deleteCouponSchema,
  updateCouponSchema,
} from "./coupon.validation.js";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  allCoupons,
} from "./coupon.controller.js";
const router = Router();

// CRUD
// create coupon
router.post(
  "/",
  isAuthenticated,
  isAuthorized("admin"),
  isValid(createCouponSchema),
  createCoupon
);

// update coupon
router.patch(
  "/:code",
  isAuthenticated,
  isAuthorized("admin"),
  isValid(updateCouponSchema),
  updateCoupon
);

// delete coupon
router.delete(
  "/:code",
  isAuthenticated,
  isAuthorized("admin"),
  isValid(deleteCouponSchema),
  deleteCoupon
);

// get all coupons
router.get("/", isAuthenticated, isAuthorized("admin"), allCoupons);

export default router;
