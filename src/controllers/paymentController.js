import db from "../models/index.js";
import S3 from "aws-sdk/clients/s3.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import moment from "moment-timezone";
import axios from "axios";
import chalk from "chalk";
import nodemailer from "nodemailer";
import UserProfileFullResource from "../resources/userprofilefullresource.js";
import UserSubscriptionResource from "../resources/usersubscription.resource.js";
// import TeamResource from "../resources/teamresource.js";
// import UserSubscriptionResource from "../resources/UserSubscriptionResource.js";
import * as stripe from "../services/stripe.js";

const User = db.User;
const Op = db.Sequelize.Op;

export const AddCard = async (req, res) => {
  console.log("Add card api");
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let user = await db.User.findByPk(authData.user.id);
      let token = req.body.source;
      console.log("User provided Token is ", token);
      let card = await stripe.createCard(user, token);

      res.send({
        status: card !== null,
        message: card !== null ? "Card added" : "Card not added",
        data: card,
      });
    }
  });
};

export const DeleteCard = async (req, res) => {
  console.log("Delete card api");
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let user = await db.User.findByPk(authData.user.id);
      let cardId = req.body.cardId;
      console.log("User deleting card ", cardId);
      let cardDeleted = await stripe.deleteCard(user, cardId);

      res.send({
        status: true,
        message: cardDeleted !== null ? "Card deleted" : "Card not deleted",
        data: cardDeleted,
      });
    }
  });
};

export const GetUserPaymentSources = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let user = await db.User.findByPk(authData.user.id);
      let cards = await stripe.loadCards(user);
      //console.log("cards loaded ", cards)
      res.send({ status: true, message: "Card loaded", data: cards });
    }
  });
};

export const CancelSubscription = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let user = await db.User.findByPk(authData.user.id);
      let sub = await db.SubscriptionModel.findOne({
        where: {
          userId: user.id,
        },
      });
      if (sub) {
        let cancelled = await stripe.cancelSubscription(user, sub);
        if (cancelled && cancelled.status) {
          sub.data = JSON.stringify(cancelled.data);
          let saved = await sub.save();
          let s = await UserSubscriptionResource(cancelled.data);
          res.send({ status: true, message: "Cancelled", data: s });
        } else {
          res.send({
            status: false,
            message: cancelled.message,
            data: cancelled,
          });
        }
      } else {
        res.send({
          status: false,
          message: `${user.name} have no active subs`,
          data: null,
        });
      }
    }
  });
};

export const subscribeUser = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let user = await db.User.findByPk(authData.user.id);

      //console.log("Getting subs for user ", user)
      let subs = await stripe.GetActiveSubscriptions(user);
      // subs = subs.data
      if (subs && subs.data.length !== 0) {
        //console.log("User is already subscribed", subs)
        let s = await UserSubscriptionResource(subs.data[0]);

        res.send({ status: false, message: "Already subscribed", data: s });
      } else {
        let cards = await stripe.loadCards(user);

        if (cards.length === 0) {
          res.send({
            status: false,
            message: "no payment source found",
            data: null,
          });
        } else {
          let subtype = req.body.sub_type; //Monthly = 0, HalfYearly = 1, Yearly = 2
          let subscription = stripe.SubscriptionTypesSandbox[0];
          let sandbox = process.env.Environment === "Sandbox";
          let code = req.body.code || null;

          //console.log("Subscription in Sandbox ", sandbox)
          if (sandbox) {
            subscription = stripe.SubscriptionTypesSandbox[subtype];
          } else {
            subscription = stripe.SubscriptionTypesProduction[subtype];
          }
          //console.log("Subscription is ", subscription)

          let sub = await stripe.createSubscription(user, subscription, code);
          if (sub && sub.status) {
            let saved = await db.SubscriptionModel.create({
              subid: sub.data.id,
              data: JSON.stringify(sub.data),
              userId: user.id,
              environment: process.env.Environment,
            });
            let plan = await UserSubscriptionResource(sub.data);
            res.send({ status: true, message: "Subscription", data: plan });
          } else {
            res.send({ status: false, message: sub.message, data: sub.data });
          }
        }
      }
    } else {
      res.send({ status: false, message: "Unauthenticated user", data: null });
    }
  });
};

export const GetTransactions = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      res.send({ status: false, message: "Unauthenticated user", data: null });
    } else {
      let user = await db.User.findByPk(authData.user.id);
      let customerId = user.customerId || null;
      if (customerId) {
        let transactions = await db.TransactionModel.findAll({
          where: {
            customerId: customerId,
          },
        });
        return res.send({
          status: true,
          message: "Transactions obtained",
          data: transactions,
        });
      } else {
        res.send({
          status: true,
          message: "User don't have transactions",
          data: null,
        });
      }
    }
  });
};

export const DownloadInvoice = async (req, res) => {
  let invoiceId = req.body.invoiceId;
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      res.send({ status: false, message: "Unauthenticated user", data: null });
    } else {
      let userId = authData.user.id;

      let t = await db.TransactionModel.findOne({
        where: {
          invoiceId: invoiceId,
        },
      });
      if (t && t.invoiceUrl != null && t.invoiceUrl != "") {
        res.send({
          status: true,
          message: "Invoice already generated",
          data: { url: t.invoiceUrl },
        });
      } else {
        let url = await stripe.createInvoicePdf(invoiceId);
        const [updated] = await db.TransactionModel.update(
          { invoiceUrl: url },
          { where: { invoiceId } }
        );
        res.send({
          status: true,
          message: "Invoice generated",
          data: { url: url },
        });
      }
    }
  });
};

export const BuyProduct = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      res.send({ status: false, message: "Unauthenticated user", data: null });
    } else {
      let user = await db.User.findByPk(authData.user.id);
      const { productId } = req.body; // Assume productId is passed in the request body
      const  userId  = user.id; 

      try {
        // Fetch the product from the database
        const product = await db.SellingProducts.findOne({
          where: { id: productId },
        });

        if (!product) {
          return res
            .send({ status: false, message: "Product not found" });
        }

        // Fetch the user profile to get the customerId
        const user = await db.User.findOne({ where: { id: userId } });

        if (!user ) {
          return res
            .send({ status: false, message: "Customer not found" });
        }

        // Check if stripeProductId is empty
        if (!product.stripeProductId) {
          // Create a new product in Stripe
          const stripeProduct = await stripe.products.create({
            name: product.name,
            description: `Product for ${product.name}`,
          });

          // Create a price for the product
          const stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: Math.round(product.productPrice * 100), // Stripe requires the amount in cents
            currency: "usd", // Adjust the currency as needed
          });

          // Update the product in the database with the Stripe product and price IDs
          product.stripeProductId = stripeProduct.id;
          product.stripePriceId = stripePrice.id;
          await product.save();
        }

        // Create a payment intent for the product
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(product.productPrice * 100), // Amount in cents
          currency: "usd", // Adjust the currency as needed
          customer: user.customerId, // Stripe customer ID
          payment_method_types: ["card"],
          description: `Purchase of ${product.name}`,
        });

        // Respond with the payment intent client secret
        return res.send({
          status: true,
          message: "Payment intent created",
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error("Error processing payment:", error);
        return res
          .status(500)
          .send({ status: false, message: "Payment processing failed", error });
      }
    }
  });
};
