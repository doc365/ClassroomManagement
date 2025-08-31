const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const db = admin.firestore();
const crypto = require("crypto");
const nodemailer = require("nodemailer");

router.post("/addStudent", async (req, res) => {
  try{
  const { name, phone, email } = req.body;
  if (!name || !phone || !email) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const token = crypto.randomBytes(32).toString("hex");

  await db.collection("students").doc(phone).set({ 
    name,
    phone,
    email,
    role: "student",
    lessons: [],
    setupToken: token,
    setupTokenExpires: Date.now() + 1000 * 60 * 60
   });

  const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

  const link = `${process.env.CLIENT_URL}/setup-account?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Set up your account",
      html: `
        <p>Hi ${name},</p>
        <p>Your instructor has added you to the classroom system. Click below to set up your account:</p>
        <a href="${link}">Set up account</a>
        <p>This link expires in 1 hour.</p>
      `
    }); 

  res.json({ success: true });
  } catch (err) {
    console.error("Error adding student:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/assignLesson", async (req, res) => {
  try {
    const { studentPhone, title, description, dueDate } = req.body;
    
    console.log('Assigning lesson:', { studentPhone, title, description });
    
    // Create lesson with consistent field names  
    const lesson = {
      id: Date.now().toString(),
      lessonId: Date.now().toString(),
      title: title.trim(),
      description: description?.trim() || "",
      completed: false, // Changed from 'done' to 'completed'
      assignedDate: admin.firestore.Timestamp.now(),
      dueDate: dueDate ? admin.firestore.Timestamp.fromDate(new Date(dueDate)) : null,
      assignedBy: "instructor"
    };

    // Add lesson to student's lessons array
    await db.collection("students").doc(studentPhone).update({
      lessons: admin.firestore.FieldValue.arrayUnion(lesson)
    });

    console.log('Lesson assigned successfully to:', studentPhone);

    res.json({ success: true, lesson });

  } catch (err) {
    console.error("Error assigning lesson:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get("/students", async (req, res) => {
  const snapshot = await db.collection("students").get();
  const students = snapshot.docs.map((doc) => doc.data());
  res.json(students);
});

router.get("/student/:phone", async (req, res) => {
  const doc = await db.collection("students").doc(req.params.phone).get();
  res.json(doc.data());
});

router.put("/editStudent/:phone", async (req, res) => {
  await db.collection("students").doc(req.params.phone).update(req.body);
  res.json({ success: true });
});

router.delete("/student/:phone", async (req, res) => {
  await db.collection("students").doc(req.params.phone).delete();
  res.json({ success: true });
});

module.exports = router;