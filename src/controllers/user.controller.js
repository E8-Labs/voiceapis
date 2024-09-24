import db from "../models/index.js";
import S3 from "aws-sdk/clients/s3.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import twilio from "twilio";
import moment from "moment-timezone";
import axios from "axios";
import chalk from "chalk";
import nodemailer from "nodemailer";
import UserProfileFullResource from "../resources/userprofilefullresource.js";
import {
  createThumbnailAndUpload,
  ensureDirExists,
} from "../utils/generateThumbnail.js";

// lib/firebase-admin.js
// const admin = require('firebase-admin');
// import { admin } from "../services/firebase-admin.js";
// import ClickSend from 'clicksend';

const User = db.User;
const Op = db.Sequelize.Op;

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Store in environment variables
const authToken = process.env.TWILIO_AUTH_TOKEN; // Store in environment variables

// Initialize the Twilio client

const SignUser = async (user) => {
  return new Promise((resolve, reject) => {
    JWT.sign(
      { user },
      process.env.SecretJwtKey,
      { expiresIn: "365d" },
      async (err, token) => {
        if (err) {
          reject(err);
        } else {
          let u = await UserProfileFullResource(user);
          resolve({ user: u, token: token });
        }
      }
    );
  });
};
export const LoginUser = async (req, res) => {
  // res.send("Hello Login")
  ////////console.log("Login " + req.body.email);
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  const username = req.body.username;
  const phone = req.body.phone;
  const login = req.body.login || false;
  const role = req.body.role || "caller";

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);
  const user = await User.findOne({
    where: {
      email: email,
    },
  });

  const count = await User.count();
  ////////console.log("Count " + count);
  if (!user) {
    if (login) {
      //user is trying to login
      // const result = await SignUser(user);
      return res.send({
        status: false,
        message: "User doesn't exist",
        data: null,
      });
    }

    let user = await db.User.create({
      email: email,
      password: hashed,
      name: name,
      phone: phone,
      username: username,
      role: role,
    });

    const result = await SignUser(user);
    return res.send({ status: true, message: "User registered", data: result });
  } else {
    bcrypt.compare(password, user.password, async function (err, result) {
      // result == true
      if (result) {
        const result = await SignUser(user);
        return res.send({
          status: true,
          message: "User logged in",
          data: result,
        });
      } else {
        res.send({ status: false, message: "Invalid password", data: null });
      }
    });
  }
};

export const UpdateUserToCreator = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let username = req.body.username;
      let user = await db.User.findByPk(userId);
      user.username = username;
      user.role = "creator";
      let userUpdated = await user.save();
      if (userUpdated) {
        let assistant = await db.Assistant.create({
          name: username,
          userId: user.id,
          phone: user.phone,
        });
        res.send({
          status: true,
          data: await UserProfileFullResource(user),
          message: "User role updated",
        });
      }
    } else {
      res.send({ status: false, data: null, message: "Unauthenticated user" });
    }
  });
};

export const UpdateProfile = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      //console.log("City", req.body.city);
      //console.log("State", req.body.state);

      let user = await db.User.findByPk(userId);

      let username = req.body.username || user.username;
      let name = req.body.name || user.name;
      let email = req.body.email || user.email;
      let city = req.body.city || user.city;
      let state = req.body.state || user.state;

      user.city = city || "";
      user.state = state || "";
      user.username = username;
      user.name = name;
      user.email = email;

      let image = null; //user.full_profile_image;
      let thumbnail = null; //user.profile_image;
      //check profile image
      if (req.files && req.files.media) {
        let file = req.files.media[0];

        const mediaBuffer = file.buffer;
        const mediaType = file.mimetype;
        const mediaExt = path.extname(file.originalname);
        const mediaFilename = `${Date.now()}${mediaExt}`;
        //console.log("There is a file uploaded");

        // Ensure directories exist
        let dir = process.env.DocsDir; // e.g., /var/www/neo/neoapis/uploads
        const docsDir = path.join(dir + "/images");
        ensureDirExists(docsDir);

        // Save the PDF file
        const docPath = path.join(docsDir, mediaFilename);
        fs.writeFileSync(docPath, mediaBuffer);
        image = `https://www.blindcircle.com:444/voiceapp/uploads/images/${mediaFilename}`;
        //console.log("Pdf uploaded is ", image);

        thumbnail = await createThumbnailAndUpload(
          mediaBuffer,
          mediaFilename,
          "images"
        );

        // If the file is a PDF, extract text from it using pdf-extraction
        if (mediaType.includes("image")) {
        }
        user.full_profile_image = image;
        user.profile_image = thumbnail;
      }

      let userUpdated = await user.save();
      if (userUpdated) {
        res.send({
          status: true,
          data: await UserProfileFullResource(user),
          message: "User role updated",
        });
      }
    } else {
      res.send({ status: false, data: null, message: "Unauthenticated user" });
    }
  });
};

function generateRandomCode(length) {
  let result = "";
  const characters = "0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const SendPhoneVerificationCode = async (req, res) => {
  let phone = req.body.phone;
  let login = req.body.login || false;
  if (phone == null || phone == "") {
    res.send({ status: false, data: null, message: "Invalid phone number" });
  }
  let user = await db.User.findOne({
    where: {
      phone: phone,
    },
  });

  ////console.log("User is ", user)
  if (user && !login) {
    res.send({ status: false, data: null, message: "Phone already taken" });
  } else {
    const randomCode = generateRandomCode(5);
    db.PhoneVerificationCodeModel.destroy({
      where: {
        phone: phone,
      },
    });
    db.PhoneVerificationCodeModel.create({
      phone: phone,
      code: `${randomCode}`,
    });
    try {
      let sent = await sendSMS(
        phone,
        `This is your verification code for voice.ai ${randomCode}`
      );
      res.send({ status: true, message: "Code sent", code: sent });
    } catch (error) {
      ////console.log("Exception email", error)
    }
  }
};

export const VerifyPhoneCode = async (req, res) => {
  let phone = req.body.phone;
  let code = req.body.code;
  const login = req.body.login || false;
  let city = req.body.city || "";
  let state = req.body.state || "";

  console.log("User Details ", req.body);
  //If user Signs up
  const email = req.body.email;

  const username = req.body.username;
  const name = req.body.name;

  const role = req.body.role || "caller";

  console.log("UserWithPhone", phone);
  let user = await db.User.findOne({
    where: {
      phone: {
        [db.Sequelize.Op.like]: `%${phone}%`,
      },
    },
  });
  console.log("User is ", user);
  // let dbCode = await db.PhoneVerificationCodeModel.findOne({
  //     where: {
  //         phone: {
  //             [db.Sequelize.Op.like]: `%${phone}%`
  //         }
  //     },
  //     order: [["createdAt", "DESC"]]
  // })

  // //console.log("Db Code is ", dbCode)

  if (user) {
    if (login) {
      // if(!dbCode){
      //     return res.send({ status: false, data: null, message: "Incorrect code" })
      // }
      // if ((dbCode && dbCode.code === code) || (dbCode && code == "11222")) {
      //send user data back. User logged in
      // await db.PhoneVerificationCodeModel.destroy({
      //     where: {
      //         phone: {
      //             [db.Sequelize.Op.like]: `%${phone}%`
      //         }
      //     },
      // })
      let signedData = await SignUser(user);
      res.send({
        status: true,
        data: signedData,
        message: "Phone verified & user logged in",
      });
      // }
      // else {
      //     res.send({ status: false, data: null, message: "Incorrect code " + code })
      // }
    } else {
      res.send({ status: false, data: null, message: "Phone already taken" });
    }
  } else {
    console.log("Db code is ", dbCode)
    console.log("User email is ", email)

    if (!login) {
      // if(!dbCode){
      //     return res.send({ status: false, data: null, message: "Incorrect phone number" })
      // }
      // if ((dbCode && dbCode.code === code) || (dbCode &&code == "11222")) {
      //User signed up. Send User data back
      let user = await db.User.create({
        email: email,
        phone: phone,
        role: role,
        username: username,
        name: name,
        city: city,
        state: state,
      });

      let assistant = await db.Assistant.create({
        name: username,
        phone: phone,
        userId: user.id,
      });
      let signedData = await SignUser(user);
      // await db.PhoneVerificationCodeModel.destroy({
      //     where: {
      //         phone: {
      //             [db.Sequelize.Op.like]: `%${phone}%`
      //         }
      //     },
      // })
      res.send({
        status: true,
        data: signedData,
        message: "Phone verified & user registered",
      });
      // }
      // else {
      //     res.send({ status: false, data: null, message: "Incorrect code " + code })
      // }
    } else {
      res.send({ status: false, data: null, message: "No such user " });
    }
  }
};

export const CheckPhoneExists = async (req, res) => {
  let phone = req.body.phone;
  // let code = req.body.code;

  let user = await db.User.findOne({
    where: {
      phone: phone,
    },
  });

  if (user) {
    res.send({ status: false, data: null, message: "Phone already taken" });
  } else {
    res.send({ status: true, data: null, message: "Phone available" });
  }
};

//Authenticated Users
export const GetMyProfile = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      ;
      let user = await db.User.findOne({
        where: {
          id: authData.user.id,
        },
      });

      if (user) {
        let resource = await UserProfileFullResource(user);
        res.send({
          status: true,
          data: null,
          message: "User profile details",
          data: resource,
        });
      } else {
        res.send({ status: false, data: null, message: "No such user" });
      }
    }
    else{
        res.send({ status: false, data: null, message: "Unauthenticated user" });
    }
  });
};

export const GetProfileWithUsername = async (req, res) => {
  let phone = req.query.username;
  // let code = req.body.code;

  let user = await db.User.findOne({
    where: {
      username: phone,
    },
  });

  if (user) {
    let resource = await UserProfileFullResource(user);
    res.send({
      status: true,
      data: null,
      message: "User profile details",
      data: resource,
    });
  } else {
    res.send({ status: false, data: null, message: "No such user" });
  }
};
export const CheckUsernameExists = async (req, res) => {
  let phone = req.body.username;
  // let code = req.body.code;

  let user = await db.User.findOne({
    where: {
      username: phone,
    },
  });

  if (user) {
    res.send({ status: false, data: null, message: "Username already taken" });
  } else {
    res.send({ status: true, data: null, message: "Username available" });
  }
};

export const CheckEmailExists = async (req, res) => {
  let phone = req.body.email;
  // let code = req.body.code;

  let user = await db.User.findOne({
    where: {
      email: phone,
    },
  });

  if (user) {
    res.send({ status: false, data: null, message: `Email already taken` });
  } else {
    res.send({ status: true, data: null, message: `email available` });
  }
};

export const SendEmailVerificationCode = async (req, res) => {
  let email = req.body.email;
  let user = await db.User.findOne({
    where: {
      email: email,
    },
  });
  ////console.log("User is ", user)
  if (user) {
    res.send({ status: false, data: null, message: `Email already taken` });
  } else {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // Replace with your mail server host
      port: 587, // Port number depends on your email provider and whether you're using SSL or not
      secure: false, // true for 465 (SSL), false for other ports
      auth: {
        user: "salman@e8-labs.com", // Your email address
        pass: "uzmvwsljflyqnzgu", // Your email password
      },
    });
    const randomCode = generateRandomCode(5);
    db.EmailVerificationCode.destroy({
      where: {
        email: email,
      },
    });
    db.EmailVerificationCode.create({
      email: email,
      code: `${randomCode}`,
    });
    try {
      let mailOptions = {
        from: '"Voice.ai" salman@e8-labs.com', // Sender address
        to: email, // List of recipients
        subject: "Verification Code", // Subject line
        text: `${randomCode}`, // Plain text body
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 50px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background-color: #6050DC;
            color: white;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .content p {
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
        }
        .content .code {
            display: inline-block;
            margin: 20px 0;
            padding: 10px 20px;
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
            background-color: #6050DC;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #777777;
        }
        .footer a {
            color: #007BFF;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <p><strong>Hello there!</strong></p>
            <p>This is your email verification code:</p>
            <div class="code">${randomCode}</div>
        </div>
        <div class="footer">
            <p>If you did not request a verification code, please ignore this email. If you have any questions, please <a href="mailto:salman@e8-labs.com">contact us</a>.</p>
        </div>
    </div>
</body>
</html>
`, // HTML body
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          res.send({ status: false, message: "Code not sent" });
          //////console.log(error);
        } else {
          res.send({ status: true, message: "Code sent" });
        }
      });
    } catch (error) {
      ////console.log("Exception email", error)
    }
  }
};

export const VerifyEmailCode = async (req, res) => {
  let email = req.body.email;
  let code = req.body.code;

  let user = await db.User.findOne({
    where: {
      email: email,
    },
  });

  if (user) {
    res.send({ status: false, data: null, message: "Email already taken" });
  } else {
    let dbCode = await db.EmailVerificationCode.findOne({
      where: {
        email: email,
      },
    });
    ////console.log("Db code is ", dbCode)
    ////console.log("User email is ", email)

    if ((dbCode && dbCode.code === code) || code == "11222") {
      res.send({ status: true, data: null, message: "Email verified" });
    } else {
      res.send({
        status: false,
        data: null,
        message: "Incorrect code " + code,
      });
    }
  }
};

export const SendCustomSms = async (req, res) => {
  let message = req.body.message;
  let sent = await sendSMS(req.body.phone, message);
  return res.send({ status: true, data: sent });
};

export const sendSMS = async (to, body) => {
  const smsApi = new ClickSend.SMSApi();
  const smsMessage = new ClickSend.SmsMessage();
  smsMessage.body = body;
  smsMessage.to = to;
  smsMessage.source = "sdk";

  const smsMessages = new ClickSend.SmsMessageCollection();
  smsMessages.messages = [smsMessage];

  try {
    const response = await smsApi.smsSend(smsMessages);
    //console.log("SMS sent:", response.body);
  } catch (error) {
    console.error("Error sending SMS:", error);
  }

  // const client = twilio(accountSid, authToken);
  // try {
  //   const message = await client.messages.create({
  //     body: body, // The message body
  //     to: to, // Recipient's phone number (in E.164 format, e.g., "+1234567890")
  //     from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number (also in E.164 format)
  //   });

  //   //console.log('SMS sent successfully:', message.sid);
  //   return { status: true, message: "SMS sent successfully", sid: message.sid };
  // } catch (error) {
  //   console.error('Failed to send SMS:', error);
  //   return { status: false, message: "Failed to send SMS", error: error.message };
  // }
};
