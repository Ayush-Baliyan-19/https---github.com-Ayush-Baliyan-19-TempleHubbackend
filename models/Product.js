const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    colors: { type: Array, required: true },
    highlights: { type: Array },
    images:{type:Array},
    sizesandprices:{type: Array, required : true},
    Categories:{type: Array},
    rating: { type: Number, default: 0 },
    reviews:[
        {
          name:{type:String},
          rating:{type:Number},
          comment:{type:String},
          date:{type:Date,default:Date.now}
        }
    ],
    sale: { type: Number, default: 0 }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", ProductSchema);
