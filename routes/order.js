const express = require("express")
const router = express.Router()
const Order = require("../models/Order")
const Cart = require("../models/Cart")
const User = require("../models/User")
const Delivery = require("../models/Delivery")
const { verifyTokenAndAdmin, verifyToken, verifyTokenAndAuthorization } = require("./Middlewares/verifyUser")

//Create a order

router.post("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const id = req.params.id;
    const cart = await Cart.findOne({ userId: id });

    if (!cart) {
      return res.status(400).json({ Success: false, Message: "Cart not found" });
    }

    const DeliveryDetails = await Delivery.find();
    const deliveryItem = DeliveryDetails.find((item) => item.CountryName === cart.address.country);

    if (!deliveryItem) {
      // If the country is not found in the given countries list, use the "Everywhere else" item
      const defaultDeliveryItem = DeliveryDetails.find((item) => item.CountryName === "Everywhere Else");
      if (!defaultDeliveryItem) {
        return res.status(400).json({ Success: false, Message: "Delivery details not found" });
      }
      const newOrder = new Order({
        userId: req.params.id,
        products: cart.products,
        status: "Received",
        address: cart.address,
        OrderDates: {
          minTime: defaultDeliveryItem.DeliveryTime.minTime,
          maxTime: defaultDeliveryItem.DeliveryTime.maxTime,
        },
      });
      const savedOrder = await newOrder.save();

      if (!savedOrder) {
        return res.status(400).json({ Success: false, Message: "Order was not saved" });
      }

      res.status(200).json({ Success: true, Order: savedOrder });
    } else {
      const newOrder = new Order({
        userId: req.params.id,
        products: cart.products,
        status: "Received",
        address: cart.address,
        OrderDates: {
          minTime: deliveryItem.DeliveryTime.minTime,
          maxTime: deliveryItem.DeliveryTime.maxTime,
        },
      });
      const savedOrder = await newOrder.save();

      if (!savedOrder) {
        return res.status(400).json({ Success: false, Message: "Order was not saved" });
      }

      res.status(200).json({ Success: true, Order: savedOrder });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});


//Get product Details and update

router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, {
      $set: req.body
    }, { new: true })
    res.status(200).json({ Success: true, Message: "Order has been updated", Updated_Order: updatedOrder })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

//Change Order Status
router.patch("/status/:orderId", verifyTokenAndAdmin, async (req, res) => {
  //console.log(req.params.orderId);
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.orderId,
      {
        $set: {
          status: req.body.status,
          DeliveryService: req.body.DeliveryService,
        },
      },
      { new: true }
    );

    if (req.body.status === "Delivered") {
      if (updatedOrder) {
        //console.log(updatedOrder.products);
        const userFound = await User.findById(updatedOrder.userId);
        if (userFound) {
          const productIds = updatedOrder.products.map((item) => {
            return item.productId;
          });
          //console.log(productIds);
          userFound.DeliveredOrders.push(...productIds);
          await userFound.save();
        }
      }
    }

    res
      .status(200)
      .json({
        Success: true,
        Message: "Order status has been updated",
        Updated_Order: updatedOrder,
      });
  } catch (error) {
    res.status(400).send(error.message);
  }
});


//Delete Order

router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const OrderFound=await Order.findByIdAndDelete(req.params.id)
    res.status(200).json({ Success: true, message: "Order has been deleted...." , Order:OrderFound })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

//Get User Orders

router.get("/find/:userId", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
    res.status(200).json(orders)
  } catch (error) {
    res.status(400).send(error.message)
  }
})

//Get all orders

router.get("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    const { status } = req.query; // Get the status from the query parameters
    //console.log(status);
    let orders;
    if (status) {
      // If the status parameter is provided
      orders = await Order.find({ status: status }); // Find orders with the specified status
      //console.log(orders);
    } else {
      // If no status parameter is provided, retrieve all orders
      orders = await Order.find();
      //console.log(orders);
    }
    if (orders) {
      res.status(200).json({ Success: true, Orders: orders });
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
});



module.exports = router