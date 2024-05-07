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
import { Invoice } from "../../../db/models/invoice.model.js";
import { User } from "../../../db/models/user.model.js";

//const __dirname = path.dirname(fileURLToPath(import.meta.url));

// create order
export const createOrder = AsyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  // data
  const { payment, city, fullAddress, phone, coupon } = req.body;

  // Calculate shipping cost based on city
  let shippingCost = 0;
  if (city.includes("cairo") || city.includes("giza")) {
    shippingCost = 60;
  } else if (city.includes("alexandria")) {
    shippingCost = 65;
  } else if (
    city.includes("suez") ||
    city.includes("ismailia") ||
    city.includes("port said") ||
    city.includes("menofia") ||
    city.includes("qalyubia") ||
    city.includes("kafr el-sheikh") ||
    city.includes("damietta") ||
    city.includes("beheira") ||
    city.includes("sharqia") ||
    city.includes("gharbia") ||
    city.includes("dakahlia")
  ) {
    shippingCost = 65;
  } else if (
    city.includes("fayoum") ||
    city.includes("beni suef") ||
    city.includes("minya") ||
    city.includes("assiut") ||
    city.includes("sohag")
  ) {
    shippingCost = 70;
  } else if (
    city.includes("qena") ||
    city.includes("luxor") ||
    city.includes("aswan")
  ) {
    shippingCost = 70;
  } else if (city.includes("north coast") || city.includes("matrouh")) {
    shippingCost = 75;
  } else if (
    city.includes("red sea") ||
    city.includes("new valley") ||
    city.includes("sharm el-sheikh")
  ) {
    shippingCost = 95;
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
      ).toFixed(1)
    : orderPrice;
  console.log("checkCoupon.discount: ", checkCoupon.discount);
  console.log("finalPrice: ", finalPrice);
  console.log("orderPrice", orderPrice);

  // Add shipping cost to order price
  const totalPriceWithShipping = finalPrice + shippingCost;

  // create order
  const order = await Order.create({
    user: req.user._id,
    products: orderProducts,
    city,
    fullAddress,
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
  const invoice = {
    shipping: {
      name: user.userName,
      city: order.city,
      fullAddress: order.fullAddress,
      country: "Egypt",
    },
    items: order.products,
    subtotal: order.price,
    shippingCost: order.shipping, // Include shipping cost in invoice
    paid: order.finalPrice,
    invoice_nr: order._id,
  };

  const invoiceStream = createInvoice(invoice);

  // Upload the PDF stream directly to Cloudinary
  let uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: `${process.env.FOLDER_CLOUD_NAME}/order/invoice`,
      resource_type: "raw",
    },
    async (error, result) => {
      if (error) {
        return next(new Error("Failed to upload invoice to Cloudinary."));
      }

      // Send email with the URL of the PDF
      const isSent = await sendEmail({
        to: user.email,
        subject: "Order Invoice",
        attachments: [
          {
            path: result.secure_url,
            contentType: "application/pdf",
          },
        ],
      });

      if (isSent) {
        await Invoice.create({
          user: user._id,
          invoice: { id: result.public_id, url: result.secure_url },
        });

        if (isSent) {
          // update stock
          updateStock(order.products, true);
          // clear cart
          clearCart(req.user._id);
        }

        return res.json({
          success: true,
          message: "Invoice sent successfully!",
          invoice: { url: result.secure_url },
        });
      } else {
        return next(new Error("Failed to send invoice email."));
      }
    }
  );
  invoiceStream.pipe(uploadStream);
});
