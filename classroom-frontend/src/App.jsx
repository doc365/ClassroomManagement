import { useEffect, useState } from "react";
import Dashboard from "./Components/instructor/Dashboard";
import LogInForm from "./Components/auth/LogInForm";
import { Bell, User } from "lucide-react";
import SetupAccount from "./Components/auth/SetupAccount";
import {BrowserRouter as Router, Route, Routes, Navigate} from "react-router-dom";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);


  useEffect(() => {
    const savedPhone = localStorage.getItem('userPhone');
    const savedEmail = localStorage.getItem('userEmail');
    
    if (savedPhone || savedEmail) {
      setUser({ phone: savedPhone, email: savedEmail });
      setIsAuthenticated(true);
    }
  }, []);

  const handleSignInSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('userEmail', userData.email);
    if (userData.phone) {
      localStorage.setItem('userPhone', userData.phone);
    }
    console.log('User signed in:', userData);
  };

  const handleSignOut = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userEmail');
    console.log('User signed out');
  };

  const handleSaveProfile = async (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("userEmail", updatedUser.email);
    localStorage.setItem("userPhone", updatedUser.phone || "");
    setShowEditProfile(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          isAuthenticated ? (
            <div className="min-h-screen bg-gray-50">
              <header className="bg-white shadow-sm border-b">
                <div className="flex justify-between items-center p-4">
                  <h1 className="text-2xl font-bold text-gray-800">Instructor Dashboard</h1>
                  <div className="flex items-center gap-4">
              <Bell className="w-6 h-6 text-gray-500" />
              <div className="relative">
                <User
                  className="w-8 h-8 text-gray-500 bg-gray-200 rounded-full p-1"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
              />

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                  <button
                    onClick={() => {
                  setShowEditProfile(true);
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Edit Profile
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
      </header>
      <main>
        <Dashboard />
      </main>

      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-4">Edit Profile</h2>
              <div className="space-y-3">
                <input type="text"
                value = {user?.name || ''}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                placeholder="Full Name" 
                className="w-full border rounded p-2"
                />
                <input type="email"
                value = {user?.email || ''}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                placeholder="Email"
                className="w-full border rounded p-2"
                />
                <input type="text"
                value = {user?.phone || ''}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                placeholder="Phone"
                className="w-full border rounded p-2"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                onClick={() =>  setShowEditProfile(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
                  Cancel
                </button>
                <button
                onClick={() => {handleSaveProfile(user)}}
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white">
                  Save
                </button>
              </div>
          </div>
        </div>
      )}
      </div>
  ) : (
    <LogInForm onSignInSuccess={handleSignInSuccess} />
    )
  }
  />

  <Route path="/setupAccount" element={<SetupAccount />} />
  <Route path="*" element={<Navigate to="/" />} />
</Routes>
</Router>
  )
}


export default App;
