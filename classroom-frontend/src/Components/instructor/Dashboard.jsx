import React, {useEffect, useState} from "react";
import { Plus, Book, Users, MessageCircle } from 'lucide-react';
import {api} from "../../api";
import AddStudentForm from "./AddstudentForm";
import EditStudentModal from "./EditStudentModal";
import AssignLessonModal from "./AssignLessonModal";
import StudentDetailsModal from "./StudentDetailsModal";
import StudentCard from "./StudentCard";

export default function Dashboard() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [showAssignLesson, setShowAssignLesson] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const response = await api.getStudents();
            setStudents(response.students || []);
        } catch (error) {
            console.error("Error loading students:", error);
            alert('Error loading students');
        }finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = async (student) => {
        if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
            try {
                const response = await api.deleteStudent(student.phone);
                if (response.success) {
                    alert("Student deleted successfully");
                    loadStudents();
                } else {
                    alert("Failed to delete student: ");
                }
            } catch (error) {
                alert("An error occurred: " + error.message);
            }
        }
    };

    const handleChatWithStudent = (student) => {
        alert(`Opening chat with ${student.name} (${student.phone})`);
        
    };

    const handleViewStudentLessons = async (student) => {
        try{
            const response = await api.getStudent(student.phone);
            setSelectedStudent(response);
        } catch (error) {
            alert("An error occurred: " + error.message);
        }
    };
    if (loading) {
        return(
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto">
                        <p className="mt-4 text-gray-600">Loading Dashboard...</p>
                    </div>
                </div>

                r
            </div>
        )
    }
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
                            <p className="text-gray-600">Manage your students and lessons</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                            onClick={() => setShowAddStudent(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus size={20} />Add Student
                        </button>

                        <button
                            onClick={() => setShowAssignLesson(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                        >
                            <Book size={20} />Assign Lesson
                        </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:rid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6 flex items-center">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-lg font-medium text-gray-600">Total Students</p>
                                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <Book className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Lessons</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {students.reduce((acc, student) => acc + (student.assignedLesson?.length || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <MessageCircle className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Completed Lessons</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {students.reduce((acc, student) => acc + (student.messages?.filter(lesson => lesson.completed).length || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">All Students</h2>
                    </div>

                    {students.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="h-12 w-12 text-gray-400 mx0auto mb-4" />
                            <p className="text-gray-500">No students found. Click "Add Student" to get started.</p>
                            <button onClick={() => setShowAddStudent(true)}
                                className="mt-4 text-blue-600 hover:text-blue-700 font-medium">
                                Add Student
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {students.map(student => (
                               <StudentCard
                               key={student.phone}
                                student={student}
                                onEdit={setEditingStudent}
                                onDelete={handleDeleteStudent}
                                onChat={handleChatWithStudent}
                                onViewLessons={handleViewStudentLessons}
                               />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showAddStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <AddStudentForm
                        onStudentAdded={loadStudents}                       
                        onClose={() => setShowAddStudent(false)}
                    />
                </div>
            )}

            {editingStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <EditStudentModal
                        student={editingStudent}
                        onStudentUpdated={loadStudents}
                        onClose={() => setEditingStudent(null)}
                    />
                </div>
            )}

            {showAssignLesson && (
               <AssignLessonModal
                   students={students}
                   onClose={() => setShowAssignLesson(false)}
               />
            )}

            {selectedStudent && (
                    <StudentDetailsModal
                        student={selectedStudent}
                        onClose={() => setSelectedStudent(null)}
                    />
            )}
    </div>
    );
}