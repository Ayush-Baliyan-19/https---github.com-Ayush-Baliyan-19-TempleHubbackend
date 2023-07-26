const mongoose = require("mongoose");

const DeliverySchema = new mongoose.Schema(
    {
        CountryName: { type: String, required: true },
        DeliveryPrice: { type: Number, required: true },
        DeliveryTime: { type: Object, required: true },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Delivery", DeliverySchema);
