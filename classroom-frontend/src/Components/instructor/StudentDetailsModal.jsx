import { X } from 'lucide-react';
import React from 'react';

export default function StudentDetailsModal({ student, onClose }) {
    const assignedLesson = student?.assignedLesson || [];
    const completedLesson = assignedLesson.filter(lesson => lesson.completed);
    const pendingLessons = assignedLesson.filter(lesson => !lesson.completed);

    return(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"> 
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{student?.className} - Lesson Details</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-gray-700 mb-2">Student Information</h3>
                <p><strong>Name:</strong> {student?.name}</p>
                <p><strong>Email:</strong> {student?.email}</p>
                <p><strong>Phone:</strong> {student?.phone}</p>
                <p><strong>Progress:</strong> {completedLesson.length}/{assignedLesson.length} Lessons completed</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Pending Lessons</h3>
                    {pendingLessons.length === 0 ? (
                        <p className="text-gray-600 italic">No pending lessons</p>
                    ) : (
                        <ul className="space-y-3">
                            {pendingLessons.map(lesson => (
                                <div key={lesson.id} className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                                    <h4 className="font-medium text-gray-800">{lesson.title}</h4>
                                    <p className="text-gray-600">{lesson.description}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        assigned: {new Date(lesson.assignedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Completed Lessons</h3>
                    {completedLesson.length === 0 ? (
                        <p className="text-gray-500 italic">No completed lessons</p>
                    ) : (
                        <div className="space-y-3">
                            {completedLesson.map(lesson => (
                                <div key={lesson.id} className="bg-green-50 border border-green-200 p-3 rounded-md">
                                    <h4 className="font-medium text-gray-800">{lesson.title}</h4>
                                    <p className="text-gray-600 text-sm mt-1">{lesson.description}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        completed: {new Date(lesson.completedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
    )
}