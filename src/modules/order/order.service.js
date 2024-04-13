import { Cart } from "../../../db/models/cart.model.js";
import { Product } from "../../../db/models/product.model.js";

// clear cart
export const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ user: userId }, { products: [] });
};

// update stock
export const updateStock = async (products, placeOrder) => {
  // placeOrder >> true false
  // true >> place order
  // false >> cancel order
  if (placeOrder) {
    for (const product of products) {
      await Product.findByIdAndUpdate(product.product, {
        $inc: {
          availableItems: -product.quantity,
          soldItems: product.quantity,
        },
      });
    }
  } else {
    for (const product of products) {
      await Product.findByIdAndUpdate(product.Product, {
        $inc: {
          availableItems: product.quantity,
          soldItems: -product.quantity,
        },
      });
    }
  }
};
