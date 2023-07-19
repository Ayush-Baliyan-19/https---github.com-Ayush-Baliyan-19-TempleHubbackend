const router= require("express").Router()

router.post("/",async (req,res)=>{
    const {email,subject,message}= req.body;
    console.log(req.body)
    const nodemailer= require("nodemailer")
    const transporter= nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:"ayushbaliyan05@gmail.com",
            pass:"rgetoefqylnpsagz"
        }
    })
    transporter.sendMail({
        from:"ayushbaliyan56@gmail.com",
        to:email,
        subject:subject,
        text:message
    },(err,data)=>{
        if(err){
            return res.status(400).json({Success:false,Message:"Email not sent"})
        }
        else{
            return res.status(200).json({Success:true,Message:"Email sent"})
        }
    })
})

module.exports= router