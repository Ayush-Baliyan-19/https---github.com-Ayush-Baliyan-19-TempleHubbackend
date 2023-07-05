require('dotenv').config()
const jwt = require('jsonwebtoken');


const fetchUser = async (req, res, next) => {

    const token = req.header('authToken');
    if (!token) {
        return res.status(401).send({ error: "(Middleware) Please authenticate using a valid token" })
    }

    try {
        const data = jwt.verify(token, process.env.JWT_SECRET)
        // console.log(data);
        req.userId = data._id||data.id;
        next()
    }

    catch (error) {
        res.status(401).send({ error: "(middleware2)Please authenticate using a valid token" })
    }
    
}

module.exports = fetchUser;