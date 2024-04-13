const express= require("express")
const app= express();
const dotenv=require("dotenv")
const cors= require("cors")
const bodyParser= require("body-parser")
const axios = require('axios');
const ConnectToDB= require("./DB");

dotenv.config();

ConnectToDB()

app.use(cors())

app.use(express.json())

app.use(express.static(__dirname));

app.use(bodyParser.json({limit: "100mb"}));

app.use(bodyParser.urlencoded({limit: "100mb",extended:true}));

app.use(express.urlencoded({limit: "10mb",extended:true}));


app.get("/api/test",(req,res)=>{
    return res.status(200).json({message:"Server is up and running"})
})

const sendPingRequest = async () => {
    try {
        const response = await axios.get("http://localhost:8080/api/test"); // Replace with your server's URL
        console.log("Ping successful:", response.data);
    } catch (error) {
        console.error("Error pinging the server:", error.message);
    }
};

setInterval(sendPingRequest, 15 * 60 * 1000);

app.use("/api/auth",require("./routes/auth"))
app.use("/api/user",require("./routes/user"))
app.use("/api/product",require("./routes/product"))
app.use("/api/cart",require("./routes/cart"))
app.use("/api/order",require("./routes/order"))
app.use("/api/mail",require("./routes/mailer"))
app.use("/api/delivery",require("./routes/delivery"))

app.listen(process.env.PORT||80,()=>{
    //console.log("Server Started at localhost")
})