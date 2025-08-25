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
        const response = await fetch(`${API_BASE}/myLesson?phone=${phone}`);
        return response.json();
    },

    MarkLessonDone: async (lessonId) => {
        const response = await fetch(`${API_BASE}/markLessonDone`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lessonId })
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
        const response = await fetch(`${API_BASE}/validateInvitation/${token}`);
        return response.json();
    },

    setupAccount: async (token, userData) => {
        const response = await fetch(`${API_BASE}/setupAccount/${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        return response.json();
    }
}
