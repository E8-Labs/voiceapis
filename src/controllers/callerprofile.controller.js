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
import CallLiteResource from "../resources/callliteresource.js";
import ProductResource from "../resources/productresource.js";

import { start } from "repl";
import {
  listCustomerInvoices,
  listCustomerPaymentInvoices,
} from "../services/stripe.js";
import PurchasedProductResource from "../resources/purchasedproductresource.js";

const User = db.User;
const Op = db.Sequelize.Op;

export const GetCallLogs = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      console.log("Finding call logs for ", userId);
      //Get User Products
      let calls = await db.CallModel.findAll({
        where: {
          userId: userId,
          status: "completed",
        },
        order: [["createdAt", "DESC"]],
      });
      let data = await CallLiteResource(calls);
      res.send({ status: true, data: data, message: "Call Logs" });
    } else {
      res.send({ status: false, data: null, message: "Unauthenticated user" });
    }
  });
};

export async function ListCallerInvoices(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      console.log("Calling invoices api ", authData.user.id);
      let userId = authData.user.id;
      let lastInvoiceId = req.query.lastInvoiceId || null;
      try {
        const paymentIntents = await listCustomerPaymentInvoices(
          authData.user,
          lastInvoiceId
        );
        if (paymentIntents == null) {
          return res.send({
            status: true,
            data: paymentIntents,
            message: "no invoices",
          });
        }
        let filteredPaymentIntents = [];
        for (let i = 0; i < paymentIntents.length; i++) {
          let paymentIntent = paymentIntents[i];
          const charge = paymentIntent.charges?.data[0] || null;

          let purchased = await db.PurchasedProduct.findOne({
            where: {
              paymentIntentId: paymentIntent.id,
            },
          });
          let p = null;
          if (purchased) {
            p = await db.SellingProducts.findOne({
              where: {
                id: purchased.productId,
              },
            });
          }

          const productId = p?.id || "NA"; //charge?.metadata?.product_id || "N/A";
          let productName = p?.name || "N/A";
if(productName == null || productName == "N/A"){
  productName = paymentIntent.metadata?.product_name || "N/A";
}
          let productDescription =
            charge?.metadata?.product_description ||
            charge?.description ||
            "No description available";

            if(productDescription == null || productDescription == "N/A"){
              productDescription = paymentIntent.metadata?.product_description || "N/A";
            }

           filteredPaymentIntents.push({
            payment_intent_id: paymentIntent.id,
            customer_id: paymentIntent.customer,
            payment_amount: paymentIntent.amount / 100, // Assuming the amount is in cents
            currency: paymentIntent.currency,
            description:
              paymentIntent.description || "No description available",
            payment_date: new Date(
              paymentIntent.created * 1000
            ).toLocaleDateString("en-US"),
            status: paymentIntent.status,
            product_id: productId,
            product_name: productName,
            product_description: productDescription,
            metadata:paymentIntent.metadata
          })
        }

        res.send({
          status: true,
          data: filteredPaymentIntents,
          message: "Invoices",
        });
      } catch (error) {
        console.error("Error fetching invoices:", error);
        res.send({
          status: false,
          data: null,
          message: error.message,
          error: error,
        });
      }
    } else {
      res.send({ status: false, data: null, message: "Unauthenticated user" });
    }
  });
}

export const GetCreatorsAndTopProducts = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res
        .status(200)
        .send({ status: true, message: "Unauthorized", data: null });
    }

    if (authData) {
      let userId = authData.user.id;

      try {
        // Fetch all unique creators (modelId) the user has talked to
        const creators = await db.CallModel.findAll({
          where: {
            userId: userId,
          },
          attributes: [
            "modelId",
            [
              db.Sequelize.fn("MAX", db.Sequelize.col("createdAt")),
              "latestCreatedAt",
            ],
          ], // Get the latest interaction (createdAt)
          order: [[db.Sequelize.literal("latestCreatedAt"), "DESC"]],
          group: ["modelId"],
        });

        const creatorIds = creators.map((creator) => creator.modelId);

        if (creatorIds.length === 0) {
          return res
            .status(200)
            .send({ status: true, message: "No creators found", data: null });
        }

        // Fetch the creator profiles
        const creatorProfiles = await db.User.findAll({
          where: {
            id: {
              [db.Sequelize.Op.in]: creatorIds,
            },
          },
        });

        if (!creatorProfiles || creatorProfiles.length === 0) {
          return res
            .status(200)
            .send({ status: true, message: "No profiles found", data: null });
        }

        // Fetch top 20 products for each creator
        const callersDashboardData = await Promise.all(
          creatorProfiles.map(async (p) => {
            const topProducts = await db.SellingProducts.findAll({
              where: {
                userId: p.id,
              },
              order: [["productPrice", "DESC"]], // Top products by price, adjust if necessary
              limit: 20,
            });

            const pRes = await UserProfileFullResource(p);

            return {
              profile: pRes,
              products: await ProductResource(topProducts),
            };
          })
        );

        // Fetch products purchased by the user
        const productsPurchased = await db.PurchasedProduct.findAll({
          where: {
            userId: userId,
          },
          order: [["createdAt", "DESC"]],
        });

        let purchasedRes = await PurchasedProductResource(productsPurchased);

        // const productInfo = productsPurchased.map(product => ({
        //   productId: product.productId,
        //   latestPurchaseDate: product.get("latestPurchaseDate") // Get the alias
        // }));

        // console.log("Products purchased", productInfo)
        // // Fetch selling products based on purchased product IDs
        // const products = await db.SellingProducts.findAll({
        //   where: {
        //     id: {
        //       [db.Sequelize.Op.in]: productInfo.map(info => info.productId),
        //     },
        //   },
        // });

        // Attach purchase date to the products
        // const productsWithPurchaseDate = products.map(product => {
        //   const purchaseInfo = productInfo.find(info => info.productId === product.id);
        //   return {
        //     ...product.toJSON(),
        //     createdAt: purchaseInfo ? purchaseInfo.latestPurchaseDate : null,
        //   };
        // });

        // Return the final response
        return res.status(200).send({
          status: true,
          message: "Creators and products retrieved successfully",
          data: {
            callersDashboardData,
            products: purchasedRes,
          },
        });
      } catch (error) {
        console.error("Error fetching creators and products:", error);
        return res.status(500).send({
          status: false,
          message: "Error fetching creators and products",
          data: null,
          error: error.message,
        });
      }
    }
  });
};
