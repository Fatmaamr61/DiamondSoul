import { AsyncHandler } from "../../utils/AsyncHandler.js";
import { Coupon } from "../../../db/models/coupon.model.js";
import { Cart } from "../../../db/models/cart.model.js";
import { Product } from "../../../db/models/product.model.js";
import { Order } from "../../../db/models/order.model.js";
import { createInvoice } from "../../utils/createInvoice.js";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from "./../../utils/cloud.js";
import { clearCart, updateStock } from "./order.service.js";
import { sendEmail } from "./../../utils/sendEmail.js";
import Stripe from "stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// create order
export const createOrder = AsyncHandler(async (req, res, next) => {
  // data
  const { payment, address, phone, coupon } = req.body;

  // Calculate shipping cost based on address
  let shippingCost = 0;
  if (address.includes("cairo") || address.includes("giza")) {
    shippingCost = 60;
  } else if (address.includes("delta")) {
    shippingCost = 70;
  }

  let checkCoupon;
  if (coupon) {
    checkCoupon = await Coupon.findOne({
      name: coupon,
      expiredAt: { $gt: Date.now() },
    });

    if (!checkCoupon) return next(new Error("Invalid coupon"));
  }

  // check cart
  const cart = await Cart.findOne({ user: req.user._id });
  const products = cart.products;
  if (products.length < 1) return next(new Error("Empty cart!"));
  let orderProducts = [];
  let orderPrice = 0;

  // check products
  for (let i = 0; i < products.length; i++) {
    // check product existance
    const product = await Product.findById(products[i].product);
    if (!product)
      return next(
        new Error(`product ${products[i].product} not found!`, { cause: 404 })
      );

    // check product stock
    if (!product.inStock(products[i].quantity))
      return next(
        new Error(
          `the product ${product.name} out of stock, only ${product.availableItems} are left`
        )
      );
    orderProducts.push({
      product: product._id,
      quantity: products[i].quantity,
      name: product.name,
      itemPrice: product.finalPrice,
      totalPrice: products[i].quantity * product.finalPrice,
      shipping: shippingCost, // Save shipping cost in order
    });

    orderPrice += products[i].quantity * product.finalPrice;
  }

  console.log("check couponn: ", checkCoupon);
  const finalPrice = checkCoupon
    ? Number.parseFloat(
        orderPrice - (orderPrice * checkCoupon.discount) / 100
      ).toFixed(2)
    : orderPrice;
  console.log("checkCoupon.discount: ", checkCoupon.discount);
  console.log("finalPrice: ", finalPrice);

  // Add shipping cost to order price
  const totalPriceWithShipping = finalPrice + shippingCost;

  // create order
  const order = await Order.create({
    user: req.user._id,
    products: orderProducts,
    address,
    phone,
    coupon: {
      id: checkCoupon?._id,
      name: checkCoupon?.name,
      discount: checkCoupon?.discount,
    },
    payment,
    price: orderPrice,
    finalPrice: totalPriceWithShipping, // Include shipping cost in final price
    shipping: shippingCost, // Save shipping cost in order
  });

  // generate invoice
  const user = req.user;
  const invoice = {
    shipping: {
      name: user.userName,
      address: order.address,
      country: "Egypt",
    },
    items: order.products,
    subtotal: order.price,
    shippingCost, // Include shipping cost in invoice
    paid: order.finalPrice,
    invoice_nr: order._id,
  };

  const pdfPath = path.join(
    __dirname,
    `./../../../invoiceTemp/${order._id}.pdf`
  );
  createInvoice(invoice, pdfPath);

  // upload cloudinary
  const { secure_url, public_id } = await cloudinary.uploader.upload(pdfPath, {
    folder: `${process.env.FOLDER_CLOUD_NAME}/order/invoice`,
  });

  // TODO delete file from file

  // add invoice to order
  order.invoice = { id: public_id, url: secure_url };
  await order.save();

  // send Email
  const isSent = await sendEmail({
    to: user.email,
    subject: "Order Invoice",
    attachments: [
      {
        path: secure_url,
        contentType: "application/pdf",
      },
    ],
  });

  if (isSent) {
    // update stock
    updateStock(order.products, true);
    // clear cart
    clearCart(req.user._id);
  }

  // stripe payment
  if (payment == "visa") {
    const stripe = new Stripe(process.env.STRIPE_KEY);

    let existCoupon;
    if (order.coupon.name !== undefined) {
      existCoupon = await stripe.coupons.create({
        percent_off: order.coupon.discount,
        duration: "once",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      metadata: { order_id: order._id.toString() },
      success_url: process.env.SUCCESS_URL,
      cancel_url: process.env.CANCEL_URL,
      line_items: order.products.map((product) => {
        return {
          price_data: {
            currency: "EGP",
            product_data: {
              name: product.name,
            },
            unit_amount: product.itemPrice * 100,
          },
          quantity: product.quantity,
        };
      }),
      discounts: existCoupon ? [{ coupon: existCoupon.id }] : [],
    });

    return res.json({
      success: true,
      results: session.url,
    });
  }

  // respose
  return res.json({
    success: true,
    message: "order placed successfully! kindly check your email",
  });
});

// cancel order
export const cancelOrder = AsyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return next(new Error("Order not Found!", { cause: 404 }));

  if (order.status === "shipped" || order.status === "delivered")
    return next(new Error("Order cannot be cancelled"));

  order.status = "canceled";
  await order.save();

  // update stock
  updateStock(order.products, false);

  return res.json({ success: true, message: "order cancelled successfully!" });
});

export const orderWebhook = AsyncHandler(async (request, response) => {
  const stripe = new Stripe(process.env.STRIPE_KEY);
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.ENDPOINT_SECRECT
    );
    console.log("events: ", event);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  const orderId = event.data.object.metadata.order_id;

  if (event.type === "checkout.session.completed") {
    // change order status
    await Order.findByIdAndUpdate({ _id: orderId }, { status: "visa paid" });
    return;
  }
  // change order status
  await Order.findByIdAndUpdate({ _id: orderId }, { status: "failed payment" });
  return;
});
