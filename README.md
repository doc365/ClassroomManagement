# 📚 Classroom Management App

A real-time classroom management tool that enables instructors to manage students, assign lessons, and communicate.  
The app supports login for both students and instructors via phone or email with verification codes (no JWT sessions used).

---

## 🚀 Features (Implemented & Pending)

### 🔐 Authentication
- [x] Instructor/Student login using **phone number** and access code.
- [x] Instructor/Student login using **email** and access code.
- [x] Twilio SMS setup complete (not yet integrated into backend routes).
- [ ] Full backend integration for Twilio-based code delivery.
- [ ] Token/JWT sessions (**not used in this project**).

### 👥 Role-Based Dashboards
- **Instructor Dashboard**
  - [x] Add students.
  - [x] Edit/Delete student profiles.
  - [x] Assign lessons to one or multiple students.
  - [ ] Real-time chat with students.
- **Student Dashboard**
  - [x] View assigned lessons.
  - [x] Mark lessons as completed.
  - [x] Edit profile information.
  - [ ] Real-time chat with instructor.

### 💬 Real-Time Chat
- [ ] Chat via Socket.io (not implemented yet).
- [ ] (Optional) Store chat history in Firebase.

---

## 🛠️ Tech Stack
**Frontend**
- React (CRA or Vite)
- Tailwind CSS (styling)

**Backend**
- Node.js + Express
- Firebase (Firestore for data storage)
- Twilio (configured, pending backend integration)

---

## 📂 Project Structure
classroom-management/
├── Backend/ # Express server
│ ├── index.js # Main backend entry point
│ ├── .env # Environment variables (Firebase, Twilio)
│ ├── serviceAccountKey.json # Firebase admin SDK credentials
│ ├── package.json # Backend dependencies
│ └── ...
│
├── classroom-frontend/ # React frontend
│ ├── src/
│ │ ├── api.js # API service for frontend requests
│ │ ├── App.jsx # Main React component
│ │ ├── Components/
│ │ │ ├── auth/ # Authentication (Login, Setup Account)
│ │ │ ├── instructor/ # Instructor UI: add/edit students, assign lessons
│ │ │ └── student/ # Student UI: dashboard, lessons
│ │ └── assets/ # Static assets (images, icons)
│ ├── public/ # Public static files
│ ├── package.json # Frontend dependencies
│ └── ...
│
└── README.md # Project documentation


---

## 📧 Email Setup (Gmail App Password)

This project uses **Nodemailer + Gmail** to send verification emails.  
Because of Google’s security, you can’t use your normal Gmail password.  
Instead, you need to create a **16-digit App Password**.

### 🔹 Step 1: Enable 2-Step Verification
1. Open [Google My Account → Security](https://myaccount.google.com/security).  
2. Under **“Signing in to Google”**, turn on **2-Step Verification**.  

---

### 🔹 Step 2: Create an App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords).  
2. Log in again if needed.  
3. At the bottom, select:  
   - **App** → choose **Mail**  
   - **Device** → choose **Other (Custom name)** → type `ClassroomApp`  
4. Click **Generate**.  
5. Copy the **16-digit App Password** (looks like `abcd efgh ijkl mnop`).  

---

### 🔹 Step 3: Add to `.env`
Create or edit your `.env` file in the project root:

```env
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your-16-digit-app-password

