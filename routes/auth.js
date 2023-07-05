const express = require("express")
const jwt = require("jsonwebtoken")
const router = express.Router()
const bcrypt = require("bcryptjs")
const { body, validationResult } = require("express-validator")
const JWT_SECRET = process.env.JWT_SECRET
const User = require('../models/User');
const fetchUser = require("./Middlewares/fetchhUserFromToken")


router.post("/register", [
    body("email", "Enter a valid email address").isEmail(),
    body("name", "Enter a valid name of minimum 3 digits").isLength({ min: 3 }),
    body("password", "Enter valid password").isLength({ min: 8 }),
], async (req, res) => {
    const { name, email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const success = false;
        return res.status(400).json({ success, errors: errors.array() });
    }

    try {
        let userExist = await User.findOne({ email: email });

        if (userExist) {
            return res.status(422).json({success:false,message:"User already exist"})
        }

        const hashedPass = await bcrypt.hash(password, 10)

        const user = new User({ username:name, email, password: hashedPass });

        const authKey = jwt.sign({ id: user._id }, JWT_SECRET);

        const savedata = await user.save();

        if (savedata) {
            const success = true;
            res.status(201).json({ success, authKey })
        }
    } catch (err) {
        res.status(400).json({ status: false, error: err })
    }
});

router.post("/login", [
    body("email","Email is not valid").isString(),
    body("password","Password is not a valid password").isLength({min:8})
], async (req,res)=>{
    console.log(req.body);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const success = false;
        return res.status(400).json({ success, errors: errors.array() });
    }

    try {
        const user = await User.findOne({email:req.body.email})
        
        const {password,...others} = user._doc;

        if(!user)
        {
            return res.status(500).json({Success:false,Message:"Invalid credentials"})
        }

        const isMatch= await bcrypt.compare(req.body.password,user.password);

        if(!isMatch)
        {
            return res.status(500).json({Success:false,Message:"Invalid credentials"})
        }

        const token = jwt.sign({_id: user._id,isAdmin:user.isAdmin},JWT_SECRET,{expiresIn:"30d"})


        res.status(200).json({Success:true,token:token,...others});
    } catch (error) {
        res.status(500).send(error.message)
    }
})

router.post('/user/getDetails', fetchUser, async (req, res) => {
    try {
        const userId = req.userId;
        const userfound = await User.findById(userId);
        if (!userfound) {
            return res.status(401).send({ error: "(code)Please authenticate using a valid token" });
        } else {
            const {password,...others}=userfound._doc
            res.status(200).json(others);
        }

    } catch (err) {
        res.status(400).json({ success: false, error: err.message })
    }
})

module.exports = router;