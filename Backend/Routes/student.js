const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const db = admin.firestore();

router.get("/myLessons", async (req, res) => {
  const { phone } = req.query;
  const doc = await db.collection("students").doc(phone).get();
  res.json(doc.data()?.lessons || []);
});

router.post("/markLessonDone", async (req, res) => {
  const { phone, lessonId } = req.body;
  const docRef = db.collection("students").doc(phone);
  const student = await docRef.get();

  let lessons = student.data().lessons || [];
  lessons = lessons.map((l) => (l.id === lessonId ? { ...l, done: true } : l));

  await docRef.update({ lessons });
  res.json({ success: true });
});

router.put("/editProfile", async (req, res) => {
  const { phone, name, email } = req.body;
  await db.collection("students").doc(phone).update({ name, email });
  res.json({ success: true });
});

module.exports = router;