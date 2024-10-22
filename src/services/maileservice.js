import nodemailer from "nodemailer";

export const SendMail = async (to, subject, text = "", html) => {
  let email = to;
  ////console.log("User is ", user)

  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // Replace with your mail server host
    port: 587, // Port number depends on your email provider and whether you're using SSL or not
    secure: false, // true for 465 (SSL), false for other ports
    auth: {
      user: "salman@e8-labs.com", // Your email address
      pass: "uzmvwsljflyqnzgu", // Your email password
    },
  });

  try {
    let mailOptions = {
      from: '"Voice.ai" salman@e8-labs.com', // Sender address
      to: email, // List of recipients
      subject: subject, // Subject line
      text: text, // Plain text body
      html: html, // HTML body
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return { status: false, message: "Mail not sent" };
        //////console.log(error);
      } else {
        return { status: true, message: "Mail sent" };
      }
    });
  } catch (error) {
    ////console.log("Exception email", error)
    return { status: false, message: "Mail not sent", error: error };
  }
};
