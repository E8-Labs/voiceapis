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

import { start } from "repl";
import { listCustomerInvoices } from "../services/stripe.js";

const User = db.User;
const Op = db.Sequelize.Op;


export const GetCallLogs = async (req, res) => {
    JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
      if (authData) {
        let userId = authData.user.id;
        console.log("Finding call logs for ", userId)
        //Get User Products
        let calls = await db.CallModel.findAll({
          where: {
            userId: userId,
            status: "completed"
          },
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
        let userId = authData.user.id;
        let lastInvoiceId = req.query.lastInvoiceId || null
        try {
          const invoices = await listCustomerInvoices(authData.user, lastInvoiceId)
          if(invoices == null){
            return res.send({ status: true, data: invoices, message: "no invoices" });
          }
          const filteredInvoices = invoices.map(invoice => {
            return {
                invoice_id: invoice.id,
                customer_id: invoice.customer,
                customer_email: invoice.customer_email,
                invoice_amount: invoice.amount_due / 100, // Assuming the amount is in cents
                // customer_custom_id: customer.metadata.id || 'No custom ID', // Custom attribute
                product_id: invoice.lines.data[0]?.price?.product || 'N/A',
                name: invoice.lines.data[0]?.description || 'N/A',
                description: invoice.description || 'No description available',
                invoice_date: new Date(invoice.created * 1000).toLocaleDateString('en-US'),
                pdf_url: invoice.invoice_pdf,
            };
        });
          res.send({ status: true, data: filteredInvoices, message: "Invoices" });
      } catch (error) {
          console.error('Error fetching invoices:', error);
          res.send({ status: false, data: null, message: error.message, error: error });
      }
      }
      else{
        res.send({ status: false, data: null, message: "Unauthenticated user" });
      }
    })
}