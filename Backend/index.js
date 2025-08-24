const express = require('express');
require('dotenv').config();
const cors = require('cors');
const admin = require('firebase-admin');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const {Server} = require('socket.io');
const http = require('http');
const serviceAccount = require('./serviceAccountKey.json');
const { Console, time } = require('console');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioPhone = process.env.TWILIO_PHONE;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(bodyParser.json());

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

app.post('/createAccessCode', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    const code = generateCode();

    try {
        await db.collection('AccessCodes').doc(phoneNumber).set({ 
            code, 
            createdAt: Date.now(),
            expires: Date.now() + 5 * 60 * 1000
        });
        
        await twilioClient.messages.create({
            body: `Your access code is: ${code}`,
            from: twilioPhone,
            to: phoneNumber
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending access code:', error);
        res.status(500).json({ error: 'failed to send SMS', detail: error.message });
    }
});

app.post('/validateAccessCode', async (req, res) => {
    const { phoneNumber, accessCode } = req.body;
    
    if (!phoneNumber || !accessCode) {
        return res.status(400).json({ error: 'Phone number and access code are required' });
    }

    try {
        const doc = await db.collection('AccessCodes').doc(phoneNumber).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Access code not found or invalid' });
        }
        const data = doc.data();

        if (data.code !== accessCode || data.expires < Date.now()) {
            return res.status(400).json({ error: 'Invalid/expired access code' });
        }

        await db.collection('AccessCodes').doc(phoneNumber).delete();

        const userDoc = await db.collection('users').doc(phoneNumber).get();
        let userType = 'student';
        if (userDoc.exists) {
            userType = userDoc.data().role;
        } else {
            await db.collection('users').doc(phoneNumber).set({
                phoneNumber,
                role: 'student',
                createdAt: Date.now()
            });
        }
        res.json({ success: true, userType, phoneNumber 
        });

    } catch (error) {
        console.error('Error validating access code:', error);
        res.status(500).json({ error: 'Failed to validate access code', detail: error.message });
    }
});

//student
app.post('/loginEmail', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const code = generateCode();

    try {
        await db.collection('emailAccessCodes').doc(email).set({ 
            code, 
            createdAt: Date.now(),
            expires: Date.now() + 5 * 60 * 1000
        });

        await transporter.sendMail({
            from: '"Classroom Management" <' + process.env.EMAIL_USER + '>',
            to: email,
        subject: 'Your Classroom Access Code',
        text: `Your access code is: ${code}`
    });
        res.json({ success: true });
    
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email', detail: error.message });
    }
});

app.post('/validateEmailCode', async (req, res) => {
    const { email, accessCode } = req.body;

    if (!email || !accessCode) {
        return res.status(400).json({ error: 'Email and access code are required' });
    }

    try{
        const doc = await db.collection('emailAccessCodes').doc(email).get();

    if (!doc.exists) {
        return res.status(404).json({ error: 'Access code not found or invalid' });
    }
    const data = doc.data();

    if (data.code !== accessCode || data.expires < Date.now()) {
        return res.status(400).json({ error: 'Invalid/expired access code' });
    }
        await db.collection('emailAccessCodes').doc(email).delete();
        res.json({ success: true });
    } catch(error){
    console.error('Error validating email code:', error);
    res.status(500).json({ error: 'Failed to validate email code', detail: error.message });
    }
});

//Instructor
app.post('/addStudent', async (req, res) => {
    const { name, email, phone } = req.body;
    if (!email || !name || !phone) {
        return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    try{
        const studentData = {
            email,
            name,
            phone,
            role: 'student',
            assignedLessons: [],
            completedLessons: [],
            createdAt: Date.now()
        };

        await db.collection('students').doc(phone).set(studentData);

        await db.collection('users').doc(phone).set({
            phoneNumber: phone,
            role: 'student',
            createdAt: Date.now()
        });

        await transporter.sendMail({
            from: '"Classroom Management" <' + process.env.EMAIL_USER + '>',
            to: email,
            subject: 'Welcome to Classroom Management',
            text: `Hello ${name},\n\nYou have been added as a student. 
            Your login email is: ${email}
            \n\nBest regards,\nClassroom Management Team`
        });
        res.json({ success: true, message: 'Student added successfully' });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ error: 'Failed to add student', detail: error.message });
    }
});

app.post('/assignLesson', async (req, res) => {
    const { studentPhone, title, description } = req.body;
    if (!studentPhone || !title || !description) {
        return res.status(400).json({ error: 'Student phone, title, and description are required' });
    }

    try {
        const lessonId = Date.now().toString();
        const lesson={
            id: lessonId,
            title,
            description,
            assignedAt: Date.now(),
            completed: false,
            completedAt: null
        }

        const studentRef = db.collection('students').doc(studentPhone);
        await studentRef.update({
            assignedLessons: admin.firestore.FieldValue.arrayUnion(lesson)
        });

        res.json({ success: true, lessonId });
    } catch (error) {
        console.error('Error assigning lesson:', error);
        res.status(500).json({ error: 'Failed to assign lesson', detail: error.message });
    }
});

app.get('/students/:phone', async (req, res) => {
    const { phone } = req.params;

    try {
        const doc = await db.collection('students').doc(phone).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({
            phone: doc.id,
            ...doc.data()
        });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Failed to fetch student', detail: error.message });
    }
});

app.get('/students', async (req, res) => {
    try {
        const snapshot = await db.collection('students').get();
        const students = [];
        snapshot.forEach(doc => {
            students.push({
                phone: doc.id,
                ...doc.data()
            });
        });
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students', detail: error.message });
    }
});

app.get('/lessons/:phone', async (req, res) => {
    const { phone } = req.params;
    try{
        const doc = await db.collection('students').doc(phone).get();
        if(!doc.exists){
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({
            phone: doc.id,
            ...doc.data()
        })
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Failed to fetch lessons', detail: error.message });
    }
});

app.put('/students/:phone', async (req, res) => {
    const { phone } = req.params;
    const { name, email } = req.body;

    if (!name && !email) {
        return res.status(400).json({ error: 'At least one of name or email is required to update' });
    }
    try {
        await db.collection('students').doc(phone).update({
            name,
            email,
            updatedAt: Date.now()
        });
        res.json({ success: true, message: 'Student updated successfully' });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Failed to update student', detail: error.message });
    }
});

app.delete('/students/:phone', async (req, res) => {
    const { phone } = req.params;

    try {
        await db.collection('students').doc(phone).delete();
        await db.collection('users').doc(phone).delete();

        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Failed to delete student', detail: error.message });
    }
});


app.post('/assignLesson', async (req, res) => {
    const {studentPhone, title, description } = req.body;
    if(!studentPhone || !title || !description){
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const lessonId = Date.now().toString();
        const lesson={
            id: lessonId,
            title,
            description,
            assignedAt: Date.now(),
            completed: false,
            completedAt: null
        }

        const studentRef = db.collection('students').doc(studentPhone);
        await studentRef.update({
            assignedLessons: admin.firestore.FieldValue.arrayUnion(lesson)
        });

        res.json({ success: true, lessonId });
    } catch (error) {
        console.error('Error assigning lesson:', error);
        res.status(500).json({ error: 'Failed to assign lesson', detail: error.message });
    }
});

app.post('/completeLesson', async (req, res) => {
    const { studentPhone, lessonId } = req.body;

    if (!studentPhone || !lessonId) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const studentRef = db.collection('students').doc(studentPhone);
        const studentDoc = await studentRef.get();

        if (!studentDoc.exists) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const assignedLessons = studentDoc.data().assignedLessons || [];
        const lessonIndex = assignedLessons.findIndex(lesson => lesson.id === lessonId);

        if (lessonIndex === -1) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        assignedLessons[lessonIndex].completed = true;
        assignedLessons[lessonIndex].completedAt = Date.now();

        await studentRef.update({ assignedLessons });

        res.json({ success: true });
    } catch (error) {
        console.error('Error completing lesson:', error);
        res.status(500).json({ error: 'Failed to complete lesson', detail: error.message });
    }
});

app.get('/students/:phone/Lessons', async (req, res) => {
    const { phone } = req.params;

    try {
        const doc = await db.collection('students').doc(phone).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Student not found' });
        }
        const student = doc.data();
        res.json({
            success: true,
            lessons: student.assignedLessons || [],
            completedLessons: student.completedLessons?.filter(lesson => lesson.completed) || []
        });
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Failed to fetch lessons', detail: error.message });
    }
});

app.post('/sendMessage', async (req, res) => {
    const {from, to, message, timestamp} = req.body;

    if (!from || !to || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try{
        const chatData = {
            from,
            to,
            message,
            timestamp: timestamp || Date.now(),
            read: false
        };

        const docRef = await db.collection('chats').add(chatData);

        io.to(to).emit('newMessage', { id: docRef.id, ...chatData });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message', detail: error.message });
    }
});

app.get('/messages/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;

    try {
       const snapshot = await db.collection('chats')
            .where('from', 'in', [user1, user2])
            .where('to', 'in', [user1, user2])
            .orderBy('timestamp', 'asc')
            .get();

        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });

        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages', detail: error.message });
    }
});

app.get('/markAsRead', async (req, res) => {
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
        return res.status(400).json({ error: 'messageIds array is required' });
    }

    try{
        const batch = db.batch();

        messageIds.forEach(messageId => {
            const messageRef = db.collection('chats').doc(messageId);
            batch.update(messageRef, { read: true });
        });
        await batch.commit();
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to mark messages as read', detail: error.message });
        
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join', (phone) => {
        socket.join(phone);
        console.log(`User ${phone} joined the chat`);
    });

    socket.on('sendMessage', async (data) => {
        try{
            const chatData = {
                from: data.from,
                to: data.to,
                message: data.message,
                timestamp: Date.now(),
                read: false
            };
            const docRef = await db.collection('chats').add(chatData);
            socket.to(data.to).emit('ReceiveMessage', { id: docRef.id, ...chatData });
            socket.emit('messageConfirmed', { id: docRef.id, ...chatData });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('typing', (data) => {
        socket.to(data.to).emit('userTyping',{ 
            from: data.from,
            isTyping: true
         });
    });

    socket.on('stopTyping', (data) => {
        socket.to(data.to).emit('userTyping', {
            from: data.from,
            isTyping: false
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
