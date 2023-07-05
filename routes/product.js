const express = require("express")
const router = express.Router()
const Product = require("../models/Product")
const { verifyTokenAndAdmin, verifyTokenAndAuthorization } = require("./Middlewares/verifyUser")
const { body, validationResult } = require("express-validator")

//Create a product

router.post("/", verifyTokenAndAdmin, async (req, res) => {
    const newProduct = new Product(req.body)
    try {

        const savedProduct = await newProduct.save()
        if (!savedProduct) {
            return res.status(400).json({ Success: false, Message: "Product was not saved" });
        }
        res.status(200).json({ Success: true, Product: savedProduct })
    } catch (error) {
        res.status(400).json(error)
    }
})

//Add Review to a product

router.put("/review/:id",[
    body("rating", "Enter a valid rating").isNumeric(),
    body("name", "Enter a valid name of minimum 3 alphabets").isLength({ min: 3 }),
    body("comment", "Enter valid comment").isLength({ min: 3 }),
], verifyTokenAndAuthorization, async (req, res) => {


    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const success = false;
        return res.status(400).json({ success, errors: errors.array() });
    }
    try {
        const review = {
            name: req.body.name,
            rating: req.body.rating,
            comment: req.body.comment
        }
        const product = await Product.findByIdAndUpdate(req.params.id, {
            $push: { reviews: review }
        })
        if (!product) {
            return res.status(400).json({ Success: false, Message: "Product was not found" });
        }
        res.status(200).json({ Success: true, Message: "Review added", Updated_Product: updatedProduct })
    } catch (error) {
        res.status(400).json(error)
    }
})

//Get product Details and update

router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, {
            $set: req.body
        }, { new: true })
        res.status(200).json({ Success: true, Message: "Product has been updated", Updated_Product: updatedProduct })
    } catch (error) {
        res.status(400).send(error.message)
    }
})

//Delete Product

router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id)
        res.status(200).json({ Success: true, message: "Product has been deleted...." })
    } catch (error) {
        res.status(400).send(error.message)
    }
})

//Get a product

router.get("/find/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        console.log(product);
        res.status(200).json(product)
    } catch (error) {
        res.status(400).send(error.message)
    }
})

//Get all product

router.get("/", async (req, res) => {
    const qNew = req.query.new
    const qCategories = req.query.Categories
    const limit = req.query.limit ? req.query.limit : 5
    try {

        let products;
        if (qNew) {
            products = await Product.find().sort({ createdAt: -1 }).limit(limit)
        } else if (qCategories) {
            products = await Product.find({
                Categories: {
                    $in: [qCategories],
                }
            })
        }
        else {
            products = await Product.find();
        }
        res.status(200).json({ Success: true, Products: products })
    } catch (error) {
        res.status(400).send(error.message)
    }
})

module.exports = router