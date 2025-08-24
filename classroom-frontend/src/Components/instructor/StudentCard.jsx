import React from "react";
import {Edit, MessageCircle, Book, X } from 'lucide-react';

export default function StudentCard({ student, onEdit, onDelete, onChat, onViewLessons }) {
    const completedLessons = (student.assignedLessons?.filter(lesson => lesson.completed).length || 0);
    const totalLessons = (student.assignedLessons?.length || 0);
    
    return(
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.email}</p>
                    <p className="text-sm text-gray-600">{student.phone}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500"> Lessons Progress</p>
                    <p className="text-lg font-semibold text-blue-600">{completedLessons} / {totalLessons}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                onClick={() => onEdit(student)}
                className="flex item-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm hover:bg-blue-200">
                    <Edit size={14}/>
                    Edit
                </button>

                <button
                onClick={() => onDelete(student)}
                className="flex item-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm hover:bg-red-200">
                    <X size={14}/>
                    Delete
                </button>

                <button
                onClick={() => onChat(student)}
                className="flex item-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm hover:bg-green-200">
                    <MessageCircle size={14}/>
                    Chat
                </button>

                <button
                onClick={() => onViewLessons(student)}
                className="flex item-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm hover:bg-yellow-200">
                    <Book size={14}/>
                    View Lessons
                </button>
            </div>
        </div>
    );
}
