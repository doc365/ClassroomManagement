export const api = {
    addStudent: async (studentData) => {
        const response = await fetch('/api/students', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });
        return response.json();
    },

    getStudents: async () => {
        const response = await fetch('/api/students');
        return response.json();
    },

    getStudent: async (phone) => {
        const response = await fetch(`/api/students/${phone}`);
        return response.json();
    },

    editStudent: async (phone, data) => {
        const response = await fetch(`/api/students/${phone}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.json();
        },

        deleteStudent: async (phone) => {
            const response = await fetch(`/api/students/${phone}`, {
                method: 'DELETE'
            });
            return response.json();
        },

        assignLesson: async (lessonData) => {
            const response = await fetch('/api/lessons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lessonData)
            });
            return response.json();
        }
    };