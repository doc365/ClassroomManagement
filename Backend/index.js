const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const admin = require("./firebase");
const authRoutes = require('./Routes/auth')
const instructorRoutes = require('./Routes/instructor');
const studentRoutes = require('./Routes/student');
const db = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/instructor', instructorRoutes);
app.use('/student', studentRoutes);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("sendMessage", async (msg) => {
    await db.collection("messages").add(msg);

    io.emit("receiveMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));