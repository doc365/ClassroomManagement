const express = require('express');
require('dotenv').config();
const cors = require('cors');
const admin = require('firebase-admin');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const {Server} = require('socket.io');
const http = require('http');
const serviceAccount = require('./serviceAccountKey.json');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
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
        methods: ["GET", "POST"],
        
    }
});

const corsOptions = {
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use (express.json())
app.use (express.urlencoded({extended: true}))

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

//Authentication
app.post('/createAccessCode', async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    const code = generateCode();

    try {
        await db.collection('AccessCodes').doc(phone).set({ 
            code, 
            createdAt: Date.now(),
            expires: Date.now() + 5 * 60 * 1000
        });
        
        await twilioClient.messages.create({
            body: `Your access code is: ${code}`,
            from: twilioPhone,
            to: phone
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending access code:', error);
        res.status(500).json({ error: 'failed to send SMS', detail: error.message });
    }
});

app.post('/validateAccessCode', async (req, res) => {
    const { phone, accessCode } = req.body;
    
    if (!phone || !accessCode) {
        return res.status(400).json({ error: 'Phone number and access code are required' });
    }

    try {
        const doc = await db.collection('AccessCodes').doc(phone).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Access code not found or invalid' });
        }
        const data = doc.data();

        if (data.code !== accessCode || data.expires < Date.now()) {
            return res.status(400).json({ error: 'Invalid/expired access code' });
        }

        await db.collection('AccessCodes').doc(phone).delete();

        const userDoc = await db.collection('users').doc(phone).get();

        let userType = 'student';
        if (userDoc.exists) {
            userType = userDoc.data().role;
        } else {
            await db.collection('users').doc(phone).set({
                phone,
                role: 'student',
                createdAt: Date.now()
            });
        }
        res.json({ success: true, userType, phone 
        });

    } catch (error) {
        console.error('Error validating access code:', error);
        res.status(500).json({ error: 'Failed to validate access code', detail: error.message });
    }
});

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
    try {
        const doc = await db.collection('emailAccessCodes').doc(email).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Access code not found or invalid' });
        }
        const data = doc.data();
        if (data.code !== accessCode || data.expires < Date.now()) {
            return res.status(400).json({ error: 'Invalid/expired access code' });
        }
        await db.collection('emailAccessCodes').doc(email).delete();

        const userQuery = await db.collection('users').where('email', '==', email).get();
        
        if(userQuery.empty){
            const newUserRef = db.collection('users').doc();
            await newUserRef.set({
                email,
                role: 'instructor',
                createdAt: Date.now()
            });

            return res.json({
                success: true,
                userType: 'instructor',
                email,
                name: null,
                phone: newUserRef.id,
                newUser: true,
                nextStep: 'dashboard'
            });
        }

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();

        if (userData.role === 'student' && !userData.passwordHash){
            return res.json({
                success: true,
                userType: 'student',
                email,
                name: null,
                phone: userDoc.id,
                nextStep: 'setupAccount'
            });
        }

        res.json({
            success: true,
            userType: userData.role,
            email,
            name: userData.name || null,
            phone: userDoc.id,
            nextStep: userData.role === 'student' ? 'passwordLogin' : 'dashboard'
        });
    } catch (error) {
        console.error('Error validating email code:', error);
        res.status(500).json({ error: 'Failed to validate email code', detail: error.message });
    }
});

app.post('/validateInvitation', async (req, res) => {
    try {
        const { token } = req.body;
        const inviteDoc = await db.collection('invitations').doc(token).get();

        if (!inviteDoc.exists) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        const inviteData = inviteDoc.data();
        if (inviteData.expiresAt < Date.now()) {
            return res.status(403).json({ error: 'Invitation has expired' });
        }
        res.json({
            success: true,
            email: inviteData.email,
            name: inviteData.name || ''
        });

    } catch (error) {
        console.error('Error validating invitation:', error);
        res.status(500).json({ error: 'Failed to validate invitation', detail: error.message });
    }
});

app.post ('/checkUseByEmail', async (req, res) => {
    const { email } = req.body;
    if(!email) {
        return res.status(400).json({error: 'Email is required'});
    }
    try {
        const userQuery = await db.collection ('users').where('email','==', email).get();

        if(userQuery.empty){
            return res.json({ exists: false, userType: null})
        }

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();

        res.json({
            exists: true,
            userType: userData.role,
            phone: userDoc.id
        });
    } catch (error){
        console.error('Error checking user by email: ', error);
        res.status(500).json({ error: 'failed to check user', detail: error.message})
    }
})

app.post ('/checkUseByPhone', async (req, res) => {
    const { phone } = req.body;
    if(!phone) {
        return res.status(400).json({error: 'Phone is required'});
    }
    try {
        const userDoc = await db.collection('users').doc(phone).get();

        if(userDoc.exists){
            return res.json({ exists: false, userType: null})
        };
        const userData = userDoc.data();

        res.json({
            exists: true,
            userType: userData.role,

        });
    } catch (error){
        console.error('Error checking user by phone: ', error);
        res.status(500).json({ error: 'failed to check user', detail: error.message})
    }
})


//Instructor
app.post('/addStudent', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        if (!email || !name || !phone) {
            return res.status(400).json({ error: 'Name, email, and phone are required' });
        }
        
    const inviteToken = uuidv4();
    const inviteExpires = Date.now() + 24 * 60 * 60 * 1000;
    await db.collection('invitations').doc(inviteToken).set({
        email,
        name,
        createdAt: Date.now(),
        expiresAt: inviteExpires
    });

    const setupLink = `${process.env.FRONTEND_URL}/setupAccount?token=${inviteToken}`;
    await transporter.sendMail({
        from: '"Classroom Management" <' + process.env.EMAIL_USER + '>',
        to: email,
        subject: 'Account Setup Invitation',
        text: `Hello ${name},\n\nYou have been invited to set up your account. Please click the link below to get started:\n\n${setupLink}\n\nBest regards,\nClassroom Management Team`
    });
    res.json({ success: true, message: 'Invitation sent successfully' });
        } catch (error) {
        console.error('Error sending invitation email:', error);
        res.status(500).json({ error: 'Failed to send invitation email', detail: error.message });
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

app.get('/students', async (req, res) => {
    try {
        const snapshot = await db.collection('students').get();
        const students = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            students.push({
                phone: doc.id,
                ...doc.data(),
                lessons: data.assignedLessons || []
            });
        });
        res.json(students);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Failed to fetch student', detail: error.message });
    }
});

app.get('/student/:phone', async (req, res) => {
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

app.put('/editStudent/:phone', async (req, res) => {
    const { phone } = req.params;
    const { name, email } = req.body;

    if (!name && !email) {
        return res.status(400).json({ error: 'At least one of name or email is required to update' });
    }

    try {
        const updateData = { updatedAt: Date.now() };
        if (name) updateData.name = name;
        if (email) updateData.email = email;

        await db.collection('students').doc(phone).update(updateData);
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile', detail: error.message });
    }
});

app.delete('/student/:phone', async (req, res) => {
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

//student
app.post('/setupAccount', async (req, res) => {
    try {
        const { phone, name, email, password } = req.body;

        if (!password) return res.status(400).json({ error: 'Password is required' });
        if (!phone || !email) return res.status(400).json({ error: 'Phone and email are required' });

        const passwordHash = await bcrypt.hash(password, 10);

        await db.collection('students').doc(phone).set({
            name: name || '',
            email: email || '',
            createdAt: Date.now(),
            passwordHash,
        });

        await db.collection('users').doc(phone).set({
            role: 'student',
            name: name || '',
            email: email || '',
            createdAt: Date.now(),
            passwordHash
        });

        res.json({ success: true, message: 'Account setup successfully' });
    } catch (error) {
        console.error('Error setting up account:', error);
        res.status(500).json({ error: 'Failed to set up account', detail: error.message });
    }
});

app.post('/loginStudent', async (req, res) => {
    try{
        const {phone, password} = req.body;

        const studentDoc = await db.collection('students').doc(phone).get();
        if(!studentDoc.exists){
            return res.status(404).json({ error: 'Student not found' });
        }
        const student = studentDoc.data();
        const match = await bcrypt.compare(password, student.passwordHash);
        if(!match){
            return res.status(401).json({ error: 'Invalid password' });
        }

        res.json({ success: true, message: 'Login successful' });
    } catch (error) {
        console.error('Error logging in student:', error);
        res.status(500).json({ error: 'Failed to log in student', detail: error.message });
    }
});

app.get('/myLessons', async (req, res) => {
    const { phone } = req.query;

    if(!phone){
        return res.status(400).json({error: 'phone number is required'});
    }

    try {
        const doc = await db.collection('students').doc(phone).get();
        if(!doc.exists){
            return res.status(404).json({ error: 'Student not found' });
        }
        
        const student = doc.data();
        res.json({
            success: true,
            lessons: student.assignedLessons || []
        });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Failed to fetch student', detail: error.message });
    }
});

app.post('/markLessonDone', async (req, res) => {
    const { phone, lessonId } = req.body;

    if (!phone || !lessonId) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const studentRef = db.collection('students').doc(phone);
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

app.put('/editProfile', async (req, res) => {
    const { phone, name, email } = req.body;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    if (!name && !email) {
        return res.status(400).json({ error: 'At least one of name or email is required to update' });
    }

    try {
        const updateData = {updatedAt: Date.now()};
        if (name) updateData.name = name;
        if (email) updateData.email = email;

        await db.collection('students').doc(phone).update(updateData);
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile', detail: error.message });
    }
});

//io chat
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
        res.json({ success: true, message: 'Message sent successfully', data: { id: docRef.id, ...chatData } });
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

app.put('/markAsRead', async (req, res) => {
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
        res.json({ success: true, message: 'Messages marked as read' });
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

app.get('/chatHistory/:email', async (req, res) => {
    try {
        const {email} = req.params;

        const snapshot = await db.collection('chats')
        .where('from', '==', email)
        .orderBy('timestamp', 'asc')
        .get();

        const conversations = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            const otherUser = data.to;
            if (!conversations[otherUser]) {
                conversations[otherUser] = [];
                conversations[otherUser].push({id: doc.id, ...data})
            }
        });
        res.json({ success: true, conversations });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Failed to fetch chat history', detail: error.message });
    }
});

const PORT = process.env.PORT || 3000;
const path = require('path');

app.use (express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
