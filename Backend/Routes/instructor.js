const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const db = admin.firestore();


router.post("/addStudent", async (req, res) => {
  const { name, phone, email } = req.body;
  await db.collection("students").doc(phone).set({ name, phone, email, lessons: [] });
  res.json({ success: true });
});

router.post("/assignLesson", async (req, res) => {
  const { studentPhone, title, description } = req.body;
  const lesson = { id: Date.now().toString(), title, description, done: false };

  await db.collection("students").doc(studentPhone).update({
    lessons: admin.firestore.FieldValue.arrayUnion(lesson),
  });

  res.json({ success: true });
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