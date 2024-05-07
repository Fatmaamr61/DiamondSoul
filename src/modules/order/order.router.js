import { Router } from "express";
import { isAuthenticated } from "./../../middlewares/authentcation.middleware.js";
import { isValid } from "./../../middlewares/validation.middleware.js";
import { createOrderSchema } from "./order.validation.js";
import { createOrder, sendInvoice } from "./order.controller.js";

const router = Router();

// create order
router.post("/", isAuthenticated, isValid(createOrderSchema), createOrder);

// sendInvoice
router.patch("/invoice/send", isAuthenticated, sendInvoice);

export default router;
