const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const db = admin.firestore();

// Get student lessons
router.get("/myLessons", async (req, res) => {
  try {
    const studentId = req.query.phone || req.query.email;
    
    if (!studentId) {
      return res.status(400).json({ error: "Phone or email required" });
    }

    const studentDoc = await db.collection("students").doc(studentId).get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ error: "Student not found" });
    }

    const studentData = studentDoc.data();
    res.json({ 
      lessons: studentData.lessons || [],
      student: {
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone
      }
    });

  } catch (err) {
    console.error("Error getting lessons:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark lesson as completed
router.post("/markLessonDone", async (req, res) => {
  try {
    const { phone, lessonId } = req.body;
    
    if (!phone || !lessonId) {
      return res.status(400).json({ error: "Phone and lessonId required" });
    }

    const docRef = db.collection("students").doc(phone);
    const student = await docRef.get();

    if (!student.exists) {
      return res.status(404).json({ error: "Student not found" });
    }

    const lessons = student.data().lessons || [];
    const updatedLessons = lessons.map(lesson => 
      lesson.id === lessonId 
        ? { ...lesson, completed: true, completedDate: new Date() }
        : lesson
    );

    await docRef.update({ lessons: updatedLessons });
    res.json({ success: true });

  } catch (err) {
    console.error("Error marking lesson:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Edit student profile
router.put("/editProfile", async (req, res) => {
  try {
    const { phone, name, email } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: "Phone required" });
    }

    await db.collection("students").doc(phone).update({ name, email });
    res.json({ success: true });

  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;