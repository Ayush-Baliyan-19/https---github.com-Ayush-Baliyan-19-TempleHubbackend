const express = require("express")
const router = express.Router()
const Order = require("../models/Order")
const Product = require("../models/Product")
const Cart = require("../models/Cart")
const User = require("../models/User")
const Delivery = require("../models/Delivery")
const { Convert } = require("easy-currencies")
const sha512 = require('js-sha512');
const { verifyTokenAndAdmin, verifyTokenAndAuthorization } = require("./Middlewares/verifyUser")
const { call } = require("../payment/util")
const { v4 as uuid } = require("uuid")

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
    const OrderFound = await Order.findByIdAndDelete(req.params.id)
    res.status(200).json({ Success: true, message: "Order has been deleted....", Order: OrderFound })
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

function geturl(env) {
  if (env == 'test') {
    url_link = "https://testpay.easebuzz.in/";
  } else if (env == 'prod') {
    url_link = 'https://pay.easebuzz.in/';
  } else {
    url_link = "https://testpay.easebuzz.in/";
  }
  return url_link;
}

router.post("/payment/:cartId",verifyTokenAndAuthorization, async (req, res) => {
  try {
    const { cartId } = req.params;
    const cart = await Cart.findById(cartId);
    let price = 0;
    if (cart.currency == "INR") {
      for (const item of cart.products) {
        const productFound = await Product.findById(item.productId);
        if (productFound && Array.isArray(productFound.sizesandprices)) {
          const matchingSizeAndPrice = productFound.sizesandprices.find((sizeandprice) => {
            return String(sizeandprice.dimensions) === String(item.dimension);
          });
          if (matchingSizeAndPrice) {
            price += matchingSizeAndPrice.priceIndia;
          } else {
            console.log('No matching size and price found for dimension:', item.dimension);
          }
        }
      }
    } else {
      for (const item of cart.products) {
        const productFound = await Product.findById(item.productId);
        if (productFound && Array.isArray(productFound.sizesandprices)) {
          const matchingSizeAndPrice = productFound.sizesandprices.find((sizeandprice) => {
            return sizeandprice.dimensions === item.dimension;
          });
          if (matchingSizeAndPrice) {
            price += matchingSizeAndPrice.priceOutside;
          } else {
            console.log('No matching size and price found for dimension:', item.dimension);
          }
        }
      }
    }
    finalPrice = await Convert(price).from("USD").to("INR")
    const userFound = await User.findById(cart.userId)
    const firstname = userFound.username;
    let data = {
      'key': process.env.EASEBUZZ_KEY,
      'txnid': v4(),
      'email': cart.address.email,
      'amount': finalPrice.toFixed(2),
      'phone': cart.address.phone,
      'firstname': firstname,
      'udf1': '',
      'udf2': '',
      'udf3': '',
      'udf4': '',
      'udf5': '',
      'hash': '',
      'productinfo': "Temple from The Temple Hub",
      'udf6': '',
      'udf7': '',
      'udf8': '',
      'udf9': '',
      'udf10': '',
      'furl': 'http://localhost:3000/response',
      'surl': 'http://localhost:3000/response',
      'unique_id': undefined,
      'split_payments': undefined,
      'sub_merchant_id': undefined,
      'customer_authentication_id': undefined
    }
    let hashstring = data.key + "|" + data.txnid + "|" + data.amount + "|" + data.productinfo + "|" + data.firstname + "|" + data.email +
      "|" + data.udf1 + "|" + data.udf2 + "|" + data.udf3 + "|" + data.udf4 + "|" + data.udf5 + "|" + data.udf6 + "|" + data.udf7 + "|" + data.udf8 + "|" + data.udf9 + "|" + data.udf10;
    hashstring += "|" + process.env.EASEBUZZ_SALT;
    data.hash = sha512.sha512(hashstring);
    const url = geturl(process.env.EASEBUZZ_ENV);    
    call_url = url + 'payment/initiateLink';
    call(call_url, data).then(function (response) {
      if (response.status=1) {
        console.log(response);
        var finalUrl = url + 'pay/' + response.data;
        // return res.redirect(url);
        res.status(200).json({ Success: true, key: process.env.EASEBUZZ_KEY, access_key:response.data, FinalUrl: finalUrl });
        // pay(response.data, url, res);
      }
    });
    if (!cart) {
      return res.status(400).json({ Success: false, Message: "Cart not found" });
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
});

function pay(access_key, url_main, res) {

  if (process.env.EASEBUZZ_IFRAME == 0) {
    var url = url_main + 'pay/' + access_key;
    // return res.redirect(url);
    return res.send("Payment URL: " + url);
  } else {

    res.render("enable_iframe.html", {
      'key': config.key,
      'access_key': access_key
    });

  }
}



module.exports = router