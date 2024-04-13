import { Router } from "express";
import { isAuthenticated } from "./../../middlewares/authentcation.middleware.js";
import { isValid } from "./../../middlewares/validation.middleware.js";
import { cancelOrderSchema, createOrderSchema } from "./order.validation.js";
import { cancelOrder, createOrder, orderWebhook } from "./order.controller.js";
import express from "express";

const router = Router();

// create order
router.post("/", isAuthenticated, isValid(createOrderSchema), createOrder);

// cancel order
router.patch(
  "/:orderId",
  isAuthenticated,
  isValid(cancelOrderSchema),
  cancelOrder
);

// webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }, orderWebhook)
);

export default router;
