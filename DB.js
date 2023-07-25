const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { GridFSBucket } = require("mongodb");

dotenv.config();

const ConnectToDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.connectionString);

    if(connection)
    {
        console.log("Connected to db");
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

module.exports = ConnectToDB;
