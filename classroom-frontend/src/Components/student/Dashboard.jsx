import React, {useEffect, useState} from "react";
import { Plus, Book, Users, MessageCircle, Search, User } from 'lucide-react';
import {api} from "../../api";


export default function Dashboard() {
    const [lessons, setLessons] = useState([]);
    const [profile, setProfile] = useState(null);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("lessons");

    useEffect(() => {
        loadLessons();
        loadProfile();
    }, []);

    const loadLessons = async () => {
        setLoading(true);
        try {
            const phone = localStorage.getItem('phone');
            const response = await api.getMyLessons(phone);
            setLessons(response.lessons || []);
        } catch (error) {
            console.error("Error loading lessons:", error);
            alert('Error loading lessons');
        } finally {
            setLoading(false);
        }
    };

    const loadProfile = async () => {
        try{
            const phone = localStorage.getItem('phone');
            const response = await api.getMyProfile(phone);
            setProfile(response.profile || {});
        } catch (error) {
            console.error("Error loading profile:", error);
            alert('Error loading profile');
        }
    };

    const handleMarkLessonDone = async (lessonId) => {
        
        try {
            const phone = localStorage.getItem('phone');
            const response = await api.markLessonDone(phone, lessonId);
            if (response.success) {
                loadLessons();
            }
        } catch (error) {
            console.error("Error marking lesson as done:", error);
            alert('Error marking lesson as done');
        }
    };

    const handleChatWithInstructor = () =>{
        alert('Chat feature coming soon!');
    }



    const renderContent = () => {
        if (activeTab === "Lessons") {
            return (
                <div className="flex-1 px-6 py-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Lessons</h1>
                        </div>
                    </div>
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-800">{lessons.length} Lessons</h2>

                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center ">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4">
                            </div>
                            <p className="text-gray-600">Loading students...</p>
                        </div>
                    ) : lessons.length === 0 ? (
                        <div className="p-12 text-center">
                            <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">
                                No lessons found. Check back later!.
                            </p>
                            
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 upperase tracking-wider">
                                        Lesson Title
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {lessons.map(lesson => (
                                    <tr key={lesson.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {lesson.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {lesson.description}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                            lesson.completed
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }">
                                    {lesson.completed ? (
                                        <><CheckCircle className="w-4 h-4 text-green-500"/>
                                        completed</>
                                    ) : (
                                        <><XCircle className="w-4 h-4 text-yellow-500"/>
                                        pending</>
                                        )}
                                    </span>
                                </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 ">
                                        {!lesson.completed && (
                                            <button
                                                onClick={() => handleMarkLessonDone(lesson.id)}
                                                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                            >
                                                Mark as Complete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                ))}
                            </tbody> 
                        </table>
                    )}
                    </div>
                    </div>
            );
        } else if (activeTab === '[profile]') {
            return (
                <div className="flex-1 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-8">My profile</h1>
                    <div className="bg-white rounded-lg shadow p-8">
                    {profile ? (
                        <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <p className="mt-1 text-sm text-gray-900">{profile.name}</p>    
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <p className="mt-1 text-sm text-gray-900">{profile.phone}</p>
                        </div>
                        <button
                            onClick={() => setShowEditProfile(true)}
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            <User size={20} />
                            Edit Profile
                            </button>
                        </div>
                    ) : (
                        <div className="text-gray-500">No profile information available.</div>
                    )}
                </div>
            </div>
            );
        } else if (activeTab === 'messages') {
            return (
            <div className="flex-1 p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Manage Messages</h1>
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                        View and manage messages between you and your students.
                    </p>
                    <button
                    onClick={handleChatWithInstructor}
                    className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2 mx-auto"
                    >
                        <MessageCircle size={20} />
                        Chat with Instructor
                    </button>
                </div>
            </div>
            )
        }
    };

        return( 
            <div className="min-h-screen bg-gray-50 flex">
                <div className="w-64 bg-white shadow-lg">
                    <div className="p-6">
                        <div className="w-20 h-12 bg-gray-200 rounded mb-8">
                        </div>
                    </div>
                    <nav className="mt-8">
                        <div
                            onClick={() => setActiveTab('essons')}
                            className={`px-6 py-3 text-sm font-medium cursor-pointer border-r-4 ${
                                activeTab === 'lessons' 
                                ? 'bg-blue-50 text-blue-700 border-blue-500'
                                : 'text-gray-600 border-transparent hover:bg-gray-50'
                            }`}
                        >
                            My Profile
                        </div>
                        <div
                            onClick={() => setActiveTab('messages')}
                            className={`px-6 py-3 text-sm font-medium cursor-pointer border-r-4 ${
                                activeTab === 'messages' ? 'bg-blue-50 text-blue-700 border-blue-500' : 'text-gray-600 border-transparent hover:bg-gray-50'
                            }`}
                        >
                            Manage Messages
                        </div>
                        <div
                            onClick={() => setActiveTab('messages')}
                            className={`px-6 py-3 text-sm font-medium cursor-pointer border-r-4 ${
                                activeTab === 'messages' ? 'bg-blue-50 text-blue-700 border-blue-500' : 'text-gray-600 border-transparent hover:bg-gray-50'
                            }`}
                        >
                            Manage Messages
                        </div>
                    </nav>
                </div>
              {renderContent()}
            {showEditProfile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <EditProfileModal
                    profile={profile}
                    onSave = {() => {
                        loadProfile();
                        setShowEditProfile(false);
                    }}
                    onClose={() => setShowEditProfile(false)}
                    />
                </div>
            )}
        </div>
    )
};
