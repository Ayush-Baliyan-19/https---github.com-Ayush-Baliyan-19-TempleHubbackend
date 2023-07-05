const express = require("express")
const router = express.Router()
const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./Middlewares/verifyUser")
const User = require("../models/User")

router.post("/:id", verifyTokenAndAuthorization, async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, {
            $set: req.body
        }, { new: true })
        res.status(200).json({ Success: true, Message: "User has been updated", Updated_User: updatedUser })
    } catch (error) {
        res.status(400).send(error.message)
    }
})

router.post("/favorites/:id", verifyTokenAndAuthorization, async (req, res) => {
    try {
      const { id } = req.params; // Get the user ID from the URL params
      const { productId } = req.body; // Get the product ID from the request body
  
      const user = await User.findById(id); // Find the user by ID
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      const favorites = user.favorites;
  
      const productIndex = favorites.indexOf(productId);
  
      if (productIndex === -1) {
        // If the product ID doesn't exist in the favorites array, add it
        favorites.push(productId);
      } else {
        // If the product ID already exists in the favorites array, remove it
        favorites.splice(productIndex, 1);
      }
  
      user.favorites = favorites; // Update the favorites array in the user document
  
      const updatedUser = await user.save(); // Save the updated user
  
      res.status(200).json({ success: true, message: "Favorites updated", updatedUser });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
});
  

router.delete("/:id",verifyTokenAndAuthorization, async(req,res)=>{
    try {
        await User.findByIdAndDelete(req.params.id)
        res.status(200).json({Success:true,message:"User has been deleted...."})
    } catch (error) {
        res.status(400).send(error.message)
    }
})


//Get USER

router.get("/find/:id", verifyTokenAndAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        const { password, ...others } = user._doc;
        res.status(200).json(others)
    } catch (error) {
        res.status(400).send(error.message)
    }
})

//Get All Users

router.get("/", verifyTokenAndAdmin, async (req, res) => {
    const query = req.query.new
    const limit = req.query.limit
    try {
        const users = query ? await User.find().sort({ _id: -1 }).limit(limit) : await User.find()
        res.status(200).json({ Success: true, Users: users })
    } catch (error) {
        res.status(400).send(error.message)
    }
})

//Get User Stats

router.get("/stats", verifyTokenAndAdmin, async (req, res) => {
    const date = new Date();
    const lastyear = new Date(date.setFullYear(date.getFullYear() - 1))

    try {

        const data = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastyear }
                }
            },
            {
                $project:{
                    month:{$month:"$createdAt"},
                }
            },
            {
                $group:{
                    _id:"$month",
                    total:{$sum:1}
                }
            }
        ])
        res.status(200).json({Success:true,Data:data})
    } catch (error) {
        res.status(400).send(error.message)
    }
})


module.exports = router