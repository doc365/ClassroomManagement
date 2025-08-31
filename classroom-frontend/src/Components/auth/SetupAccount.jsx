import { useEffect, useState } from "react";
import { ArrowLeft, User, Phone, Lock } from "lucide-react";
import { api } from "../../axios";
import { useSearchParams } from "react-router-dom";

export default function SetupAccount({ onSetupSuccess }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");

  const handleBack = () => {
    window.history.back();
  };

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing token.");
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const res = await api.validateInvitation(token);
        
        console.log('Validation response:', res);
        
        if (res.error) {
          setError(res.error);
        } else {
          setEmail(res.email || "");
          setName(res.name || "");
          setPhone(res.phone || "");
        }
      } catch (error) {
        console.error("Error validating invitation token:", error);
        
        if (error.response?.data?.error) {
          setError(error.response.data.error);
        } else if (error.error) {
          setError(error.error);
        } else {
          setError("Failed to validate invitation token.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const isFormValid = password.trim().length >= 6 && username.trim().length > 0;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    
    setSubmitting(true);
    setError("");
    
    try {
      const res = await api.setupAccount({
        token: token,
        username: username.trim(),
        password: password
      });

      if (res.success) {
        // Automatically log the user in after successful setup
        const userData = {
          email: email,
          name: name,
          phone: phone,
          username: username.trim(),
          userType: 'student'
        };
        
        // Call the success handler to navigate to student dashboard
        onSetupSuccess(userData);
      } else {
        setError(res.error || "Failed to set up account.");
      }
    } catch (error) {
      console.error("Error setting up account:", error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.error) {
        setError(error.error);
      } else {
        setError("Failed to set up account.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Validating invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-semibold mb-2 text-center text-gray-900">
            Set Up Your Account
          </h1>
          <p className="text-center text-gray-600 mb-8">
            We've invited you{" "}
            <span className="font-medium">{email}</span>{" "}
            please fill in your details below
          </p>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-4 bg-gray-50">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full py-3 outline-none text-gray-600 bg-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-4 bg-gray-50">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  value={name}
                  readOnly
                  className="w-full py-3 outline-none text-gray-600 bg-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-4 bg-gray-50">
                <Phone className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="tel"
                  value={phone}
                  readOnly
                  className="w-full py-3 outline-none text-gray-600 bg-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Username *</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-4">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full py-3 outline-none text-gray-900 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-4">
                <Lock className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="password"
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 outline-none text-gray-900 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
              className={`w-full py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none 
              ${
                !isFormValid || submitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {submitting ? "Setting Up..." : "Set Up Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}