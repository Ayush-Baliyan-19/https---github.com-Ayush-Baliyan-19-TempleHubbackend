const router= require("express").Router()
const stripe= require("stripe")(process.env.STRIPE_SECRET_KEY)


router.post("/create-payment-intent", async (req, res)=>{
    const paymentIntent= await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "inr"
    })
    if(paymentIntent)
    {   
        //console.log(paymentIntent.client_secret)
        return res.status(200).json({clientSecret:paymentIntent.client_secret})
    }
    res.status(500).send("Something went wrong")
}
)

module.exports = router;