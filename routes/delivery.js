const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const { verifyTokenAndAdmin, verifyTokenAndAuthorization } = require('./Middlewares/verifyUser');

//Create a delivery
router.post('/',verifyTokenAndAdmin, async (req, res) => {
    const newDelivery = new Delivery(req.body);
    try {
        const savedDelivery = await newDelivery.save();
        if (!savedDelivery) {
            return res.status(400).json({ Success: false, Message: 'Delivery Template was not saved' });
        }
        res.status(200).json({ Success: true, Delivery: savedDelivery });
    } catch (error) {
        res.status(400).json(error.message);
    }
}
);

//Get all deliveries
router.get('/',verifyTokenAndAuthorization, async (req, res) => {
    try {
        const deliveries = await Delivery.find();
        if (!deliveries) {
            return res.status(400).json({ Success: false, Message: 'No deliveries found' });
        }
        res.status(200).json({ Success: true, Deliveries: deliveries });
    } catch (error) {
        res.status(400).json(error.message);
    }
}
);

//Update a delivery

router.put('/:id',verifyTokenAndAdmin, async (req, res) => {
    try {
        const delivery = await Delivery.findByIdAndUpdate(req.params.id, {
            $set: req.body
        }, { new: true });
        if (!delivery) {
            return res.status(400).json({ Success: false, Message: "Delivery Template was not found" });
        }
        res.status(200).json({ Success: true, Delivery: delivery });
    }
    catch (error) {
        res.status(400).json(error.message);
    }
});

//Delete a delivery

router.delete('/:id',verifyTokenAndAdmin, async (req, res) => {
    try {
        const delivery = await Delivery.findByIdAndDelete(req.params.id);
        if (!delivery) {
            return res.status(400).json({ Success: false, Message: "Delivery Template was not found" });
        }
        res.status(200).json({ Success: true, Message: "Delivery Template was deleted" });
    }
    catch (error) {
        res.status(400).json(error.message);
    }
}
);

module.exports = router;