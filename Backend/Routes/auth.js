const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const db = admin.firestore();
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/checkUserType", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    const identifier = email || phoneNumber;
    
    if (!identifier) {
      return res.status(400).json({ success: false, error: "Email or phone number required" });
    }

    let userDoc;
    
    if (email) {
      const snapshot = await db.collection("students")
        .where("email", "==", email)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        return res.json({ success: true, userType: "student" });
      }
    } else {
      userDoc = await db.collection("students").doc(phoneNumber).get();
      if (userDoc.exists) {
        return res.json({ success: true, userType: "student" });
      }
    }

    res.json({ success: true, userType: "instructor" });
  } catch (err) {
    console.error("Error checking user type:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/loginPassword", async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;
    const identifier = email || phoneNumber;
    
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: "Credentials required" });
    }

    let studentDoc;
    let student;
    
    if (email) {
      const snapshot = await db.collection("students")
        .where("email", "==", email)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return res.status(400).json({ success: false, error: "Student account not found" });
      }
      
      studentDoc = snapshot.docs[0];
      student = studentDoc.data();
    } else {
      studentDoc = await db.collection("students").doc(phoneNumber).get();
      
      if (!studentDoc.exists) {
        return res.status(400).json({ success: false, error: "Student account not found" });
      }
      
      student = studentDoc.data();
    }

    if (!student.password) {
      return res.status(400).json({ success: false, error: "Password not set. Please use verification code." });
    }

    const match = await bcrypt.compare(password, student.password);
    if (!match) {
      return res.status(400).json({ success: false, error: "Invalid password" });
    }

    const token = jwt.sign(
      { 
        id: studentDoc.id,
        email: student.email,
        phone: student.phone,
        userType: "student" 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ 
      success: true, 
      email: student.email,
      phone: student.phone,
      name: student.name || student.username || "Student",
      userType: "student",
      token
    });
  } catch (err) {
    console.error("Error logging in with password:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

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
  try {
    const { phoneNumber, accessCode } = req.body;
    const doc = await db.collection("accessCodes").doc(phoneNumber).get();

    if (!doc.exists || doc.data().code !== accessCode) {
      return res.status(400).json({ success: false, error: "Invalid code" });
    }

    await db.collection("accessCodes").doc(phoneNumber).set({ code: "" });

    const student = await db.collection("students").doc(phoneNumber).get();
    const type = student.exists ? "student" : "instructor";

    res.json({ 
      success: true, 
      userType: type,
      email: student.exists ? student.data().email : null,
      phone: phoneNumber,
      name: student.exists ? student.data().name : "Instructor"
    });
  } catch (err) {
    console.error("Error validating access code:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
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
  try {
    const { email, accessCode } = req.body;
    const doc = await db.collection("accessCodes").doc(email).get();

    if (!doc.exists || doc.data().code !== accessCode) {
      return res.status(400).json({ success: false, error: "Invalid code" });
    }

    await db.collection("accessCodes").doc(email).set({ code: "" });

    const snapshot = await db.collection("students")
      .where("email", "==", email)
      .limit(1)
      .get();
    
    const isStudent = !snapshot.empty;
    const student = isStudent ? snapshot.docs[0].data() : null;
    
    res.json({ 
      success: true, 
      userType: isStudent ? "student" : "instructor",
      email: email,
      phone: isStudent ? student.phone : null,
      name: isStudent ? student.name : "Instructor"
    });
  } catch (err) {
    console.error("Error validating email code:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get("/validateInvitation", async (req, res) => {
  const { token } = req.query;
  try {
    const snapshot = await db.collection("students")
      .where("setupToken", "==", token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const student = snapshot.docs[0].data();
    
    if (student.setupTokenExpires < Date.now()) {
      return res.status(400).json({ error: "Token has expired" });
    }

    res.json({ 
      email: student.email, 
      name: student.name,
      phone: student.phone 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/setupAccount", async (req, res) => {
  try {
    const { token, username, password } = req.body;
    
    if (!token || !username || !password) {
      console.log('Missing required fields:', { token: !!token, username: !!username, password: !!password });
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    console.log('Setup account request:', { token, username, passwordLength: password.length });

    const snapshot = await db.collection("students")
      .where("setupToken", "==", token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log('No student found with token:', token);
      return res.status(400).json({ success: false, error: "Invalid or expired token" });
    }

    const doc = snapshot.docs[0];
    const student = doc.data();
    const documentId = doc.id; 

    console.log('Found student:', { 
      documentId, 
      email: student.email, 
      hasSetupToken: !!student.setupToken 
    });

    if (student.setupTokenExpires && student.setupTokenExpires < Date.now()) {
      console.log('Token expired:', new Date(student.setupTokenExpires), 'vs now:', new Date());
      return res.status(400).json({ success: false, error: "Token has expired" });
    }

    const usernameCheck = await db.collection("students")
      .where("username", "==", username.trim())
      .limit(1)
      .get();

    if (!usernameCheck.empty) {
      return res.status(400).json({ success: false, error: "Username already taken" });
    }

    const hash = await bcrypt.hash(password, 10);

    await doc.ref.update({
      username: username.trim(),
      password: hash,
      setupToken: admin.firestore.FieldValue.delete(),
      setupTokenExpires: admin.firestore.FieldValue.delete(),
      accountSetup: true,
      setupDate: admin.firestore.Timestamp.now()
    });

    console.log('Account setup successful for document ID:', documentId);

    res.json({ success: true });
  } catch (err) {
    console.error("Error setting up account:", err);
    res.status(500).json({ success: false, error: "Server error" });
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
      return res.status(400).json({ success: false, error: "User not found" });
    }

    const student = snapshot.docs[0].data();
    const match = await bcrypt.compare(password, student.password);

    if (!match) {
      return res.status(400).json({ success: false, error: "Invalid password" });
    }

    const token = jwt.sign(
      { phone: student.phone, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;