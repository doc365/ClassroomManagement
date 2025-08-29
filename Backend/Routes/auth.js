const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const db = admin.firestore();
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);


router.post("/createAccessCode", async (req, res) => {
  const { phoneNumber } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await db.collection("accessCodes").doc(phoneNumber).set({ code });

  await twilioClient.messages.create({
    body: `Your access code: ${code}`,
    from: process.env.TWILIO_PHONE,
    to: phoneNumber,
  });

  res.json({ success: true });
});

router.post("/validateAccessCode", async (req, res) => {
  const { phoneNumber, accessCode } = req.body;
  const doc = await db.collection("accessCodes").doc(phoneNumber).get();

  if (!doc.exists || doc.data().code !== accessCode) {
    return res.status(400).json({ success: false, message: "Invalid code" });
  }

  await db.collection("accessCodes").doc(phoneNumber).set({ code: "" });

  const student = await db.collection("students").doc(phoneNumber).get();
  const type = student.exists ? "student" : "instructor";

  res.json({ success: true, type });
});

router.post("/loginEmail", async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await db.collection("accessCodes").doc(email).set({ code });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Login Code",
    text: `Your access code is ${code}`,
  });

  res.json({ success: true });
});

router.post("/validateEmailCode", async (req, res) => {
  const { email, accessCode } = req.body;
  const doc = await db.collection("accessCodes").doc(email).get();

  if (!doc.exists || doc.data().code !== accessCode) {
    return res.status(400).json({ success: false, message: "Invalid code" });
  }

  await db.collection("accessCodes").doc(email).set({ code: "" });
  res.json({ success: true });
});

module.exports = router;