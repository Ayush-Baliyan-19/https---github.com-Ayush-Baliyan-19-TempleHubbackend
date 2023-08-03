const express = require("express")
const router = express.Router()
const Product = require("../models/Product")
const { verifyTokenAndAdmin, verifyTokenAndAuthorization } = require("./Middlewares/verifyUser")
const { body, validationResult } = require("express-validator")
const multer = require("multer")
const archiver = require("archiver")
const { uploadFile, removeFile } = require("./s3")
const Order = require("../models/Order")
const User = require("../models/User")
//Create a product

router.post("/", verifyTokenAndAdmin, async (req, res) => {
    console.log(req.body);
    const newProduct = new Product(req.body)
    try {
        const savedProduct = await newProduct.save()
        if (!savedProduct) {
            return res.status(400).json({ Success: false, Message: "Product was not saved" });
        }
        res.status(200).json({ Success: true, Product: savedProduct })
    } catch (error) {
        res.status(400).json(error.message)
    }
})

//Upload Image

const upload = multer({ dest: "./uploads/" });

router.post("/images/upload/:id", verifyTokenAndAdmin, upload.array("images"), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ Success: false, Message: "No files were uploaded" });
        }

        const product = await Product.findById(req.params.id);
        // Upload each file to S3 and get the file URLs
        const fileUrls = product.images;
        for (const file of files) {
            const result = await uploadFile(file);
            fileUrls.push(result.Location); // 'Location' contains the URL of the uploaded file in S3
        }

        console.log(product);
        // Update the product with the new image URLs
        product.images = fileUrls;

        await product.save();

        if (!product) {
            return res.status(400).json({ Success: false, Message: "Product was not found" });
        }

        res.status(200).json({ Success: true, Message: "Image(s) uploaded" });
    } catch (error) {
        res.status(500).json({ Success: false, Message: error.message });
    }
});

//Add Review to a product

router.put("/review/:id", [
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
            comment: req.body.comment,
        };
        const userFound = await User.findById(req.user._id);
        console.log(review)
        if (userFound) {
            for (const productId of userFound.DeliveredOrders) {
                if (productId === req.params.id) {
                    const product = await Product.findByIdAndUpdate(req.params.id, {
                        $push: { reviews: review },
                    });
                    res.status(200).json({ Success: true, Message: "Review added", Updated_Product: product });
                    return; // Return here to exit the loop after finding the matching productId
                }
            }
        }
        // If the loop completes without finding the matching productId
        res.status(400).json({ Success: false, Message: "Product not found in user's delivered orders" });
    } catch (error) {
        res.status(400).json(error);
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

//Remove an image from s3 container

router.delete("/images/remove/:id", verifyTokenAndAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(400).json({ Success: false, Message: "Product was not found" });
        }

        const images = product.images;
        const index = req.body.index;

        // Validate the index before accessing images[index]
        if (index < 0 || index >= images.length) {
            return res.status(400).json({ Success: false, Message: "Invalid image index" });
        }

        // Delete the image from S3
        const fileKeyToRemove = images[index];
        console.log(fileKeyToRemove.split("/")[3]);
        const removeParams = {
            Key: fileKeyToRemove.split("/")[3],
            Bucket: process.env.AWS_BUCKET_NAME,
        };

        await removeFile(removeParams.Key)

        // Remove the image from the images array in the product document
        product.images.splice(index, 1);

        // Save the updated product document back to the database
        await product.save();

        res.status(200).json({ Success: true, Message: "Image has been removed", Updated_Product: product });
    } catch (error) {
        res.status(400).json(error.message);
    }
});

//Set A Sale

router.post("/sale", verifyTokenAndAdmin, async (req, res) => {
    console.log("req called");
    console.log(req.body)
    try {
        const productSales = await Product.updateMany({ $set: { sale: req.body.Sale } })
        res.status(200).json({ Success: true, Message: "Sale has been set" })
    } catch (error) {
        res.status(400).send(error.message)
    }
})

router.get("/sale", verifyTokenAndAdmin, async (req, res) => {
    try {
        const productSales = await Product.find()
        const sale= productSales[0].sale;
        res.status(200).json({ Success: true, Sale:sale })
    } catch (error) {
        res.status(400).send(error.message)
    }
})

//Delete Product

router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(400).json({ Success: false, Message: "Product was not found" });
        }

        // Delete the product from the Product collection
        await product.deleteOne()

        // Call removeFile function for all images in the product's images array
        for (const image of product.images) {
            const removeParams = {
                Key: image.split("/")[3],
                Bucket: process.env.AWS_BUCKET_NAME,
            };
            await removeFile(removeParams.Key);
        }

        // Remove the product from the products array in all the orders
        const orders = await Order.find({ "products.productId": product._id });

        for (const order of orders) {
            order.products = order.products.filter((prod) => prod.productId.toString() !== product._id.toString());
            if (order.products.length === 0) {
                await order.deleteOne();
            } else {
                await order.save();
            }
        }

        res.status(200).json({ Success: true, message: "Product has been deleted...." });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

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
    const qNew = req.query.new;
    const qCategories = req.query.Categories;
    const qSearch = req.query.search; // Search query from frontend
    console.log(qSearch);
    console.log(qCategories)
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;

    try {
        let products;
        if (qNew) {
            products = await Product.find().sort({ createdAt: -1 }).limit(limit);
            console.log(products);
        } else if (qCategories) {
            products = await Product.find({
                Categories: {
                    $in: [qCategories],
                },
            });
        } else if (qSearch) {
            // Use a regular expression to search for products with similar names or categories
            const regex = new RegExp(qSearch, "i");
            products = await Product.find({
                $or: [
                    { title: { $regex: regex } }, // Search by title
                    { Categories: { $regex: regex } }, // Search by categories
                ],
            });
        } else {
            products = await Product.find();
        }
        res.status(200).json({ Success: true, Products: products });
    } catch (error) {
        res.status(400).send(error.message);
    }
});


module.exports = router