const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.token;
    if (authHeader) {
        const token= authHeader.split(" ")[1]
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({
                    Success: false,
                    Message: "Token is not right!!"
                })
            }
            // //console.log(user)
            req.user = user;
            next();
        })
    }
    else {
        return res.status(401).json({
            Success: false,
            Message: "You are not a authenticated!"
        })
    }
}

const verifyTokenAndAuthorization = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user._id=== req.params.id || req.user.isAdmin) {
            next()
        }
        else{
            res.status(400).json({Success:false,Message:"You are not allowed to do that - User"})
        }
    })
}
const verifyTokenAndAdmin = (req, res, next) => {
    // //console.log("admin working");
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next()
        }
        else{
            res.status(400).json({Success:false,Message:"You are not allowed to do that"})
        }
    })
}

module.exports ={ verifyToken , verifyTokenAndAuthorization , verifyTokenAndAdmin }