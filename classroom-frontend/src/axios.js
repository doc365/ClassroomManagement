import axios from 'axios';

const client = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json'
    }
});

export const api = {
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

    getMyLessons: async (phone) => {
        const res = await client.get(`/student/myLessons?phone=${phone}`);
        return res.data;
    },

    markLessonDone: async (phone, lessonId) => {
        const res = await client.post('/student/markLessonDone', { phone, lessonId });
        return res.data;
    },

    editProfile: async (name, email, phone) => {
        const res = await client.put('/student/editProfile', { 
            name, 
            email, 
            phone 
        });
        return res.data;
    },

    createAccessCode: async (phoneNumber) => {
        const res = await client.post('/auth/createAccessCode', { phoneNumber });
        return res.data;
    },

    validateAccessCode: async (phoneNumber, accessCode) => {
        const res = await client.post('/auth/validateAccessCode', { 
            phoneNumber, 
            accessCode 
        });
        return res.data;
    },

    loginEmail: async (email) => {
        const res = await client.post('/auth/loginEmail', { email });
        return res.data;
    },

    validateEmailCode: async (email, accessCode) => {
        const res = await client.post('/auth/validateEmailCode', { email, accessCode });
        return res.data;
    }
};