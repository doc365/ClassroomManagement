import React, { useEffect, useState } from "react";
import { Book, User, MessageCircle, CheckCircle, XCircle, Bell, LogOut } from 'lucide-react';
import { api } from "../../axios";

export default function StudentDashboard({ user, onSignOut }) {
  const [lessons, setLessons] = useState([]);
  const [profile, setProfile] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("lessons");

  useEffect(() => {
    loadLessons();
    loadProfile();
  }, [user]);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const phone = localStorage.getItem('userPhone') || user?.phone;
      if (phone) {
        const response = await api.getMyLessons(phone);
        setLessons(response.lessons || []);
      }
    } catch (error) {
      console.error("Error loading lessons:", error);
      alert('Error loading lessons');
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      // Use existing user data or fetch from API if you have a getProfile endpoint
      setProfile(user || {
        name: localStorage.getItem('userName'),
        email: localStorage.getItem('userEmail'),
        phone: localStorage.getItem('userPhone'),
        userType: localStorage.getItem('userType')
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleMarkLessonDone = async (lessonId) => {
    try {
      const phone = localStorage.getItem('userPhone') || user?.phone;
      const response = await api.markLessonDone(phone, lessonId);
      if (response.success) {
        loadLessons(); // Reload lessons to update status
      }
    } catch (error) {
      console.error("Error marking lesson as done:", error);
      alert('Error marking lesson as done');
    }
  };

  const handleChatWithInstructor = () => {
    alert('Chat feature coming soon!');
  };

  const handleSignOut = () => {
    // Call the parent component's sign out handler instead of direct navigation
    if (onSignOut) {
      onSignOut();
    } else {
      // Fallback if onSignOut is not provided
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleSaveProfile = async (updatedProfile) => {
    try {
      const phone = localStorage.getItem('userPhone') || user?.phone;
      await api.editProfile(phone, updatedProfile.name, updatedProfile.email);
      setProfile(updatedProfile);
      localStorage.setItem('userName', updatedProfile.name);
      localStorage.setItem('userEmail', updatedProfile.email);
      setShowEditProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Error updating profile');
    }
  };

  const renderContent = () => {
    if (activeTab === "lessons") {
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
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading lessons...</p>
              </div>
            ) : lessons.length === 0 ? (
              <div className="p-12 text-center">
                <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No lessons assigned yet. Check back later!
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {lesson.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                          lesson.completed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {lesson.completed ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Completed
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Pending
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {!lesson.completed && (
                          <button
                            onClick={() => handleMarkLessonDone(lesson.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
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
    } else if (activeTab === 'profile') {
      return (
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>
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
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{profile.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{profile.userType}</p>
                </div>
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
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
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Messages</h1>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              Chat with your instructor for help and guidance.
            </p>
            <button
              onClick={handleChatWithInstructor}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2 mx-auto"
            >
              <MessageCircle size={20} />
              Chat with Instructor
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg relative">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{profile?.name || user?.name || 'Student'}</h2>
              <p className="text-sm text-gray-500">Student Portal</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-8 pb-20">
          <div
            onClick={() => setActiveTab('lessons')}
            className={`px-6 py-3 text-sm font-medium cursor-pointer border-r-4 flex items-center gap-3 ${
              activeTab === 'lessons' 
                ? 'bg-blue-50 text-blue-700 border-blue-500'
                : 'text-gray-600 border-transparent hover:bg-gray-50'
            }`}
          >
            <Book className="w-5 h-5" />
            My Lessons
          </div>
          
          <div
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 text-sm font-medium cursor-pointer border-r-4 flex items-center gap-3 ${
              activeTab === 'profile' 
                ? 'bg-blue-50 text-blue-700 border-blue-500'
                : 'text-gray-600 border-transparent hover:bg-gray-50'
            }`}
          >
            <User className="w-5 h-5" />
            My Profile
          </div>
          
          <div
            onClick={() => setActiveTab('messages')}
            className={`px-6 py-3 text-sm font-medium cursor-pointer border-r-4 flex items-center gap-3 ${
              activeTab === 'messages' 
                ? 'bg-blue-50 text-blue-700 border-blue-500'
                : 'text-gray-600 border-transparent hover:bg-gray-50'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            Messages
          </div>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-4">Edit Profile</h2>
            <div className="space-y-3">
              <input 
                type="text"
                value={profile?.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Full Name" 
                className="w-full border rounded p-2"
              />
              <input 
                type="email"
                value={profile?.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="Email"
                className="w-full border rounded p-2"
              />
              <input 
                type="text"
                value={profile?.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="Phone"
                className="w-full border rounded p-2"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowEditProfile(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveProfile(profile)}
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}