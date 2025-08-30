const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const db = admin.firestore();
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


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
  const student = await db.collection("students").doc(email).get();
  const type = student.exists ? "student" : "instructor";
  res.json({ success: true, type });
});

router.post("/setupAccount", async (req, res) => {
  try {
    const { token, username, password } = req.body;
    if (!token || !username || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const snapshot = await db.collection("students")
      .where("setupToken", "==", token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const doc = snapshot.docs[0];
    const studentRef = db.collection("students").doc(doc.id);
    const student = doc.data();

    if (student.setupTokenExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Token expired" });
    }

    const hash = await bcrypt.hash(password, 10);

    await studentRef.update({
      username,
      password: hash,
      setupToken: admin.firestore.FieldValue.delete(),
      setupTokenExpires: admin.firestore.FieldValue.delete()
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error setting up account:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const snapshot = await db.collection("students")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const student = snapshot.docs[0].data();
    const match = await bcrypt.compare(password, student.password);

    if (!match) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { phone: student.phone, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;