import { AsyncHandler } from "../../utils/AsyncHandler.js";
import { Product } from "../../../db/models/product.model.js";
import { Cart } from "../../../db/models/cart.model.js";

// add to cart
export const addToCart = AsyncHandler(async (req, res, next) => {
  // data
  const { product, quantity } = req.body;
  let intialTotalPrice = 0;

  // check product
  const checkProduct = await Product.findById(product);
  if (!checkProduct)
    return next(new Error("product not found", { cause: 404 }));

  if (!checkProduct.inStock(quantity))
    return next(
      new Error(
        `sorry!! only ${checkProduct.availableItems} items left in the stock..`
      )
    );

  // check product in cart
  const cartProduct = await Cart.findOne({
    "products.product": product,
  });

  if (cartProduct) {
    const newQuantity = quantity + cartProduct.products[0].quantity;

    if (!checkProduct.inStock(newQuantity))
      return next(
        new Error(
          `sorry!! only ${product.availableItems} items left in the stock..`
        )
      );

    // product price
    const productPrice = await Product.findById(product);
    console.log(productPrice.finalPrice);

    /*  cartProduct.intialTotalPrice = productPrice.finalPrice * quantity;
    console.log(totalPrice); */
    // update products

    const cart = await Cart.findOneAndUpdate(
      {
        user: req.user._id,
        "products.product": product,
      },
      { $set: { "products.$.quantity": newQuantity } },
      { $push: intialTotalPrice },
      { new: true }
    );

    // response
    return res.json({
      success: true,
      message: "product added successfully",
      results: cart,
    });
  } else {
    // product price
    const productPrice = await Product.findById(product);
    console.log(productPrice.finalPrice);

    // add to cart
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $push: { products: { product, quantity } }, intialTotalPrice },
      { new: true }
    );

    // response
    return res.json({
      success: true,
      message: "new product added successfully",
      results: cart,
    });
  }
});

// get user cart
export const userCart = AsyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "products.product",
    "name defaultImage.url price discount finalPrice"
  );

  return res.json({ success: true, result: cart });
});

// update cart
export const updateCart = AsyncHandler(async (req, res, next) => {
  // data
  const { product, quantity } = req.body;

  // check product
  const checkProduct = await Product.findById(product);
  if (!checkProduct)
    return next(new Error("product not found", { cause: 404 }));

  // check stock
  if (quantity > product.availableItems)
    return next(
      new Error(
        `sorry!! only ${product.availableItems} items left in the stock..`
      )
    );

  // update products
  const cart = await Cart.findOneAndUpdate(
    {
      user: req.user._id,
      "products.product": product,
    },
    { $set: { "products.$.quantity": quantity } },
    { new: true }
  );

  return res.json({ success: true, message: "cart updated !!", results: cart });
});

// remove product from cart
export const removeProductFromCart = AsyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { products: { product: req.params.product } },
    },
    { new: true }
  );
  return res.json({
    success: true,
    message: "product deleted successfully!!",
    results: cart,
  });
});

// clear cart
export const clearCart = AsyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { products: [] },
    { new: true }
  );

  return res.json({ success: true, message: "cart cleared!", results: cart });
});
