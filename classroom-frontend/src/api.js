const API_BASE = 'http://localhost:3000';

export const api = {
    
    addStudent: async (studentData) => {
        const response = await fetch(`${API_BASE}/addStudent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });
        return response.json();
    },

    getStudents: async () => {
        const response = await fetch(`${API_BASE}/students`);
        return response.json();
    },

    getStudent: async (phone) => {
        const response = await fetch(`${API_BASE}/student/${phone}`);
        return response.json();
    },

    editStudent: async (phone, data) => {
        const response = await fetch(`${API_BASE}/editStudent/${phone}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.json();
        },

     deleteStudent: async (phone) => {
            const response = await fetch(`${API_BASE}/student/${phone}`, {
                method: 'DELETE'
            });
            return response.json();
        },

    assignLesson: async (lessonData) => {
            const response = await fetch(`${API_BASE}/assignLesson`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lessonData)
            });
            return response.json();
        },

    getMyLessons: async (phone) => {
        const response = await fetch(`${API_BASE}/myLessons?phone=${phone}`);
        return response.json();
    },

    markLessonDone: async (phone, lessonId) => {
        const response = await fetch(`${API_BASE}/markLessonDone`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone, lessonId })
        });
        return response.json();
    },

    editProfile: async (name, email, phone) => {
        const response = await fetch(`${API_BASE}/editProfile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone })
        });
        return response.json();
    },

    validateInvitation: async (token) => {
        const res = await fetch(`${API_BASE}/validateInvitation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });
        return res.json();
    },

    setupAccount: async (phone, name, email, password) => {
        const response = await fetch(`${API_BASE}/setupAccount`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone, name, email, password })
        });
        return response.json();
    },

    createAccessCode: async (phone) => {
        const response = await fetch(`${API_BASE}/createAccessCode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone })
        });
        return response.json();
    },

    validateAccessCode: async (phone, code) => {
        const response = await fetch(`${API_BASE}/validateAccessCode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone, accessCode: code })
        });
        return response.json();
    },

    loginEmail: async (email) => {
        const response = await fetch(`${API_BASE}/loginEmail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        return response.json();
    },

    validateEmailCode: async (email, accessCode) => {
        const response = await fetch(`${API_BASE}/validateEmailCode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, accessCode })
        });
        return response.json();
    },

    getMessages: async (user1, user2) => {
        const response = await fetch(`${API_BASE}/messages?user1=${user1}&user2=${user2}`);
        return response.json();
    },

    markAsRead: async (messageIds) => {
        const response = await fetch(`${API_BASE}/messages/markAsRead`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messageIds })
        });
        return response.json();
    },

    loginStudent: async (phone, password) => {
        const response = await fetch(`${API_BASE}/loginStudent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone, password })
        });
        return response.json();
    }
}
