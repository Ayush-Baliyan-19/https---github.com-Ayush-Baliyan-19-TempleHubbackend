const express = require("express")
const router = express.Router()
const Cart = require("../models/Cart")
const { verifyTokenAndAdmin, verifyToken, verifyTokenAndAuthorization } = require("./Middlewares/verifyUser")

//Get product Details and update

router.post("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const { id } = req.params; // Get the cart ID from the URL params
    const { productId, quantity, customization, color, dimension, currency } = req.body; // Get product details from the request body
    const cart = await Cart.findOne({ userId: id }); // Find the cart with the provided user ID
    if (!cart) {
      // If the cart doesn't exist, create a new one
      const newCart = {
        userId: id,
        products: [{ productId, quantity, customization, color, dimension }],
        currency: currency
      };
      //console.log(newCart);
      const createdCart = await Cart.create(newCart);

      if (!createdCart) {
        return res.status(400).json({ success: false, message: "Cart not created" });
      }

      return res.status(200).json({ success: true, cart: createdCart });
    }
    const existingProduct = cart.products.find(
      (product) =>
        product.productId === productId &&
        product.customization === customization &&
        JSON.stringify(product.color) === JSON.stringify(color) &&
        JSON.stringify(product.dimension) === JSON.stringify(dimension)
    );

    if (existingProduct) {
      // If the product already exists with the same dimension, customization, and color, update the quantity
      existingProduct.quantity += quantity;
    } else {
      // If the product is new or has different dimension, customization, or color, push it to the products array
      cart.products.push({ productId, quantity, customization, color, dimension });
    }

    const updatedCart = await cart.save(); // Save the updated cart

    res.status(200).json({ success: true, message: "Cart has been updated", updatedCart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/addAddress/:id", async (req, res) => {
  try {
    const { address,email } = req.body;
    const cartFound = await Cart.findOneAndUpdate(
      { userId: req.params.id },
      { $set: { address: address,email:email } },
      { new: true } // Set {new: true} to return the updated cart
    );

    if (!cartFound) {
      return res.status(404).send("Cart not found");
    }

    const delivery = address.country === "India" ? 0 : 500;

    const updatedCart = await cartFound.save();
    updatedCart.delivery = delivery; // Set the delivery value

    const finalUpdated = await updatedCart.save();
    if(finalUpdated)
    { 
      //console.log(finalUpdated)
      return res.status(200).json({Success:true,message:"Address added to cart"});
    }
    } catch (error) {
    res.status(400).send(error);
  }
});



  router.post("/decrease/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const { id } = req.params; // Get the cart ID from the URL params
    const { productId } = req.body; // Get the productId from the request body

    const cart = await Cart.findOne({ userId: id }); // Find the cart with the provided user ID

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const productIndex = cart.products.findIndex((product) => product.productId === productId);

    if (productIndex !== -1) {
      // If the product exists in the cart, decrease the quantity
      const product = cart.products[productIndex];
      if (product.quantity > 1) {
        product.quantity--;
      } else {
        // If the quantity is already 1, remove the product from the cart
        cart.products.splice(productIndex, 1);
      }

      const updatedCart = await cart.save(); // Save the updated cart

      return res.status(200).json({ success: true, message: "Cart has been updated", updatedCart });
    }

    res.status(404).json({ success: false, message: "Product not found in the cart" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


// Delete Cart

router.delete("/:id",verifyTokenAndAuthorization, async (req, res) => {
    try {
        const cartToBeDeleted= await Cart.findOneAndDelete({userId:req.params.id})
        //console.log(cartToBeDeleted)
        res.status(200).json({ Success: true, message: "Cart has been deleted...." })
    } catch (error) {
        res.status(400).send(error.message)
    }
})

router.post("/delete/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const { id } = req.params; // Get the cart ID from the URL params
    const { productId, customization, color, dimension } = req.body; // Get the product details from the request body

    const updatedCart = await Cart.findOneAndUpdate(
      { userId: id },
      {
        $pull: {
          products: {
            productId: productId,
            customization: customization,
            color: color,
            dimension: dimension,
          },
        },
      },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    res.status(200).json({ success: true, message: "Product has been deleted", updatedCart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


//Get a User Cart

router.get("/find/:id", verifyTokenAndAuthorization, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.params.id })
        res.status(200).json(cart)
    } catch (error) {
        res.status(400).send(error.message)
    }
})

//Get all product

router.get("/", verifyTokenAndAdmin, async (req, res) => {
    try {
        const carts = await Cart.find();
        res.status(200).json({ Success: true, Carts: carts })
    }
    catch (error) {
        res.status(400).send(error.message)
    }
})

module.exports = router