import React, { useState } from 'react';
import {Plus, X} from 'lucide-react';
import { api } from '../../api';

export default function AddStudentForm({onStudentAdded, onClose}) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.addStudent(formData);
            if (response.success) {
                alert("Student added successfully");
            setFormData({ name: '', phone: '', email: '' });
            onStudentAdded?.();
            onClose?.();
            }else{
                alert("Failed to add student: " + (response.error || "Unknown error"));
            }
        } catch (error) {
            alert("An error occurred: " + error.message);
        }
        setLoading(false);
    };

    const handleInputChange = (e) => {
        setFormData((prevData) => ({
            ...prevData,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className='bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto'>
            <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-bold text-gray-800'>Add New Student</h2>
            {onClose && (
                <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
                    <X size={20} />
                </button>
            )}
        </div>

        <div className='space-y-4'>
            <div>
                <input
                type= "text"
                name= "name"
                value = {formData.name}
                onChange={handleInputChange}
                className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Enter student name'
                required
            />
        </div>

        <div>
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Enter student email'
                required
            />
        </div>
        <div>
            <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Enter student phone'
                required
            />
        </div>

        <button
            onClick={handleSubmit}
            disabled={loading}
            className='w-full bg-blue-600 text-white p-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
        >
            <Plus size={20} />
            {loading ? "Adding..." : "Add Student"}
        </button>
        </div>
    </div>
    )
};