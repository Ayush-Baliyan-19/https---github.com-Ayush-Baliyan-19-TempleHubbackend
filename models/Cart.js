const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    email:{type:String},
    products:[
        {
            productId:{
                type:String,
                required:true
            },
            color:{
              type:Array,
              required:true
            },
            dimension:{
              type:Array,
              required:true
            },
            quantity:{
                type:Number,
                required:true,
                default:1
            },
            customization:{
              type: String,
              default: ""
            }
        }
    ],
    address:{
      type:Object,
      default:{}
    },
    delivery:{
      type:Number,
      default:0
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cart", CartSchema);
