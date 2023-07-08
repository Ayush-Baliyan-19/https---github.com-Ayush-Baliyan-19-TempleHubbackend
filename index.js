const express= require("express")
const app= express();
const dotenv=require("dotenv")
const cors= require("cors")

const ConnectToDB= require("./DB")

dotenv.config();

ConnectToDB()

app.use(cors())

app.use(express.json())

app.get("/address/cityforPincode", async (req,res)=>{
    try {
        const pincode = req.query.pincode;
        const response= await fetch(`https://www.postpincode.in/api/getCityName.php?pincode=${pincode}`,{
            method:"GET",
            headers:{
                "Content-Type":"application/json"
            }
        })
        const data = await response.json();
        if(!data)
        res.status(400).send("No data found")
    } catch (error) {   
        res.status(200).send(error)
    }
})

app.use("/api/auth",require("./routes/auth"))
app.use("/api/user",require("./routes/user"))
app.use("/api/product",require("./routes/product"))
app.use("/api/cart",require("./routes/cart"))
app.use("/api/order",require("./routes/order"))
app.use("/api/payment",require("./routes/stripe"))
app.use("/api/mail",require("./routes/mailer"))

app.listen(process.env.PORT||80,()=>{
    console.log("Server Started at localhost")
})