import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
//auth
  createAccessCode: async (phoneNumber) => {
    const res = await client.post('/auth/createAccessCode', { phoneNumber });
    return res.data;
  },

  validateAccessCode: async (phoneNumber, accessCode) => {
    const res = await client.post('/auth/validateAccessCode', { phoneNumber, accessCode });
    return res.data;
  },

  loginEmail: async (email) => {
    const res = await client.post('/auth/loginEmail', { email });
    return res.data;  
  },

  validateEmailCode: async (email, accessCode) => {
    const res = await client.post('/auth/validateEmailCode', { email, accessCode });
    return res.data;
  },

  // NEW: Check user type
  checkUserType: async (email, phoneNumber) => {
    const payload = email ? { email } : { phoneNumber };
    const res = await client.post('/auth/checkUserType', payload);
    return res.data;
  },

  // NEW: Password login for students
  loginPassword: async (email, phoneNumber, password) => {
    const payload = email 
      ? { email, password }
      : { phoneNumber, password };
    const res = await client.post('/auth/loginPassword', payload);
    return res.data;
  },

  validateInvitation: async (token) => {
    const res = await client.get(`/auth/validateInvitation?token=${token}`);
    return res.data;
  },

  setupAccount: async (data) => {
    const res = await client.post('/auth/setupAccount', data);
    return res.data;
  },

  login: async (username, password) => {
    const res = await client.post('/auth/login', { username, password });
    return res.data;
  },

//instructor
  addStudent: async (studentData) => {
    const res = await client.post('/instructor/addStudent', studentData);
    return res.data;
  },

  getStudents: async () => {
    const res = await client.get('/instructor/students');
    return res.data;
  },

  getStudent: async (phone) => {
    const res = await client.get(`/instructor/student/${phone}`);
    return res.data;
  },

  editStudent: async (phone, data) => {
    const res = await client.put(`/instructor/editStudent/${phone}`, data);
    return res.data;
  },

  deleteStudent: async (phone) => {
    const res = await client.delete(`/instructor/student/${phone}`);
    return res.data;
  },

  assignLesson: async (lessonData) => {
    const res = await client.post('/instructor/assignLesson', lessonData);
    return res.data;
  },

//student
  getMyLessons: async (phone) => {
    const res = await client.get(`/student/myLessons?phone=${phone}`);
    return res.data;
  },

  markLessonDone: async (phone, lessonId) => {
    const res = await client.post('/student/markLessonDone', { phone, lessonId });
    return res.data;
  },

  editProfile: async (phone, name, email) => {
    const res = await client.put('/student/editProfile', { phone, name, email });
    return res.data;
  },
};

export default api;