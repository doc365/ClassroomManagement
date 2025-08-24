import { useEffect, useState } from "react";
import Dashboard from "./Components/instructor/Dashboard";
import LogInForm from "./Components/auth/LogInForm";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedPhone = localStorage.getItem('userPhone');
    if (savedPhone) {
      setUser({ phone: savedPhone });
      setIsAuthenticated(true);
    }
  }, []);

  const handleSignInSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('userPhone', userData.phone);
    console.log('User signed in:', userData);
  };

  const handleSignOut = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userPhone');
    console.log('User signed out');
  };

  if (!isAuthenticated) {
    return <LogInForm onSignInSuccess={handleSignInSuccess} />;
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="flex justify-between items-center p-4">
            <h1 className="text-2xl font-bold text-gray-800">Instructor Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{user?.phone}</span>
              </span>
              <button onClick={handleSignOut} 
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                Sign Out</button>
            </div>
          </div>
        </header>
        <main>
          <Dashboard />
        </main>
      </div>
  );
}

export default App;
