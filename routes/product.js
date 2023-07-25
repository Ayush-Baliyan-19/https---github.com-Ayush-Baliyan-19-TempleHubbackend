const express = require("express")
const router = express.Router()
const Product = require("../models/Product")
const { verifyTokenAndAdmin, verifyTokenAndAuthorization } = require("./Middlewares/verifyUser")
const { body, validationResult } = require("express-validator")
const multer = require("multer")
const archiver = require("archiver")
const { uploadFile } = require("./s3")
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
  
      // Upload each file to S3 and get the file URLs
      const fileUrls = [];
      for (const file of files) {
        const result = await uploadFile(file);
        fileUrls.push(result.Location); // 'Location' contains the URL of the uploaded file in S3
      }
  
      // Update the product with the new image URLs
      const productFound = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: { images: fileUrls } },
        { new: true } // Return the updated product document
      );
  
      if (!productFound) {
        return res.status(400).json({ Success: false, Message: "Product was not found" });
      }
  
      res.status(200).json({ Success: true, Message: "Image(s) uploaded" });
    } catch (error) {
      res.status(500).json({ Success: false, Message: error.message });
    }
  });




  router.get("/images/:id", async (req, res) => {
    const requestedId = req.params.id;
  
    try {
      // First, fetch the Product document by its productId
      const productFound = await Product.findById(requestedId);
  
      if (!productFound) {
        return res.status(404).json({ Success: false, Message: "Product not found" });
      }
  
      // Access the GridFSBucket from the global object
      const bucket = global.gridFSBucket;
      console.log(productFound.images);
      // Fetch the image files from GridFS based on the images array in the Product document
      const matchingFilesCursor = bucket.find({
        _id: { $in: productFound.images },
      });
      // Convert the cursor to an array of file documents
      const matchingFiles = await matchingFilesCursor.toArray();
      console.log(matchingFiles);
  
      if (matchingFiles.length === 0) {
        return res.status(404).json({ Success: false, Message: "No matching images found" });
      }
  
      // Create a new zip archive
      const archive = archiver("zip");
  
      // Pipe the zip archive to the response object
      archive.pipe(res);
  
      // Add each matching image file to the zip archive
      for (const file of matchingFiles) {
        // Get the file data from GridFS
        const fileStream = bucket.openDownloadStream(file._id);
  
        // Append the file to the zip archive with the original filename
        archive.append(fileStream, { name: file.filename });
      }
  
      // Finalize the zip archive and send it as the response
      archive.finalize();
    } catch (error) {
      res.status(500).json({ Success: false, Message: "Error retrieving images from GridFS" });
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
            console.log(products);
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