const mongoose= require("mongoose")
const dotenv=require("dotenv")

dotenv.config()

const ConnectToDB=()=>{
    try {
        mongoose.connect(process.env.connectionString).then(()=>{
            console.log("Connected to db")
        })
    } catch (error) {
        throw(error)
    }
}

module.exports=ConnectToDB;