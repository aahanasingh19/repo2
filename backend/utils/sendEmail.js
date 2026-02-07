import nodemailer from "nodemailer"

const transporter=nodemailer.createTransport({
     host:process.env.EMAIL_HOST,
     port:587,
     secure:false,
     auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
     }
})

async function sendEmail({to,subject,html}){    
    await transporter.sendMail({
    from:process.env.EMAIL_USER,
    to:to,
    subject:subject,
    html
})
}

export default sendEmail

