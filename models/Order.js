const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        products: [
            {
                productId: {
                    type: String,
                },
                dimension:{
                    type:Array,
                    required:true
                },
                color:{
                    type:Array,
                    required:true
                },
                quantity: {
                    type: Number,
                    default: 1
                },
                customization: {
                    type: Object,
                }
            }
        ],
        address: { type: Object, required: true },
        DeliveryService:{
            type:Object
        },
        status: { type: String, default: "Recieved" },
        OrderDates :{
            type:Object
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Order", OrderSchema);
