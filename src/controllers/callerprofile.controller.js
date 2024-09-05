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
import { listCustomerInvoices } from "../services/stripe.js";

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

export async function ListCustomerInvoices(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      console.log("Calling invoices api ", authData.user.id);
      let userId = authData.user.id;
      let lastInvoiceId = req.query.lastInvoiceId || null;
      try {
        const invoices = await listCustomerInvoices(
          authData.user,
          lastInvoiceId
        );
        if (invoices == null) {
          return res.send({
            status: true,
            data: invoices,
            message: "no invoices",
          });
        }
        const filteredInvoices = invoices.map((invoice) => {
          return {
            invoice_id: invoice.id,
            customer_id: invoice.customer,
            customer_email: invoice.customer_email,
            invoice_amount: invoice.amount_due / 100, // Assuming the amount is in cents
            // customer_custom_id: customer.metadata.id || 'No custom ID', // Custom attribute
            product_id: invoice.lines.data[0]?.price?.product || "N/A",
            name: invoice.lines.data[0]?.description || "N/A",
            description: invoice.description || "No description available",
            invoice_date: new Date(invoice.created * 1000).toLocaleDateString(
              "en-US"
            ),
            pdf_url: invoice.invoice_pdf,
          };
        });
        res.send({ status: true, data: filteredInvoices, message: "Invoices" });
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
      return res.status(401).send({ status: false, message: "Unauthorized", data: null });
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
            [db.Sequelize.fn("MAX", db.Sequelize.col("createdAt")), "latestCreatedAt"],
          ], // Get the latest interaction (createdAt)
          order: [[db.Sequelize.literal("latestCreatedAt"), "DESC"]],
          group: ["modelId"],
        });

        const creatorIds = creators.map((creator) => creator.modelId);

        if (creatorIds.length === 0) {
          return res.status(404).send({ status: false, message: "No creators found", data: null });
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
          return res.status(404).send({ status: false, message: "No profiles found", data: null });
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
          attributes: [
            "productId", 
            [db.Sequelize.fn("MAX", db.Sequelize.col("createdAt")), "latestPurchaseDate"]
          ],
          group: ["productId"],
        });

        const productInfo = productsPurchased.map(product => ({
          productId: product.productId,
          latestPurchaseDate: product.get("latestPurchaseDate") // Get the alias
        }));

        console.log("Products purchased", productInfo)
        // Fetch selling products based on purchased product IDs
        const products = await db.SellingProducts.findAll({
          where: {
            id: {
              [db.Sequelize.Op.in]: productInfo.map(info => info.productId),
            },
          },
        });

        // Attach purchase date to the products
        const productsWithPurchaseDate = products.map(product => {
          const purchaseInfo = productInfo.find(info => info.productId === product.id);
          return {
            ...product.toJSON(),
            createdAt: purchaseInfo ? purchaseInfo.latestPurchaseDate : null,
          };
        });

        // Return the final response
        return res.status(200).send({
          status: true,
          message: "Creators and products retrieved successfully",
          data: {
            callersDashboardData,
            products: await ProductResource(productsWithPurchaseDate),
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

