import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, Lock } from 'lucide-react';

export default function SignInForm({ onSignInSuccess }) {
  const [accessCode, setAccessCode] = useState('');
  const [activeTab, setActiveTab] = useState('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [userType, setUserType] = useState(null);

  const requestCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      let response;

      if (activeTab === 'phone') {
        response = await fetch('http://localhost:3000/auth/createAccessCode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone.trim() })
        });
      } else {
        response = await fetch('http://localhost:3000/auth/loginEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() })
        });
      }

      const result = await response.json();
      if (result.success) {
        setUserType(result.userType || null); // backend should tell us student/instructor
        setShowCodeInput(true);
      } else {
        setError(result.error || 'Failed to send access code.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      let endpoint = activeTab === 'phone'
        ? 'http://localhost:3000/auth/validateAccessCode'
        : 'http://localhost:3000/auth/validateEmailCode';

      const payload =
        activeTab === 'phone'
          ? { phoneNumber: phone.trim(), accessCode: accessCode.trim() }
          : { email: email.trim(), accessCode: accessCode.trim() };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        if (onSignInSuccess) {
          onSignInSuccess({
            email: result.email || email.trim(),
            phone: result.phone || phone.trim(),
            name: result.name || (result.userType === 'instructor' ? 'Instructor' : 'Student'),
            userType: result.userType
          });
        }
      } else {
        setError(result.error || 'Invalid access code.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to verify code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (showCodeInput) {
      setShowCodeInput(false);
      setAccessCode('');
      setError('');
      setUserType(null);
    } else {
      console.log('Back to previous page');
    }
  };

  const handleSubmit = () => {
    if (showCodeInput) {
      verifyCode();
    } else {
      requestCode();
    }
  };

  const isFormValid = () => {
    if (showCodeInput) {
      return accessCode.trim().length === 6;
    }
    return activeTab === 'phone' ? phone.trim() !== '' : email.trim() !== '';
  };

  const getButtonText = () => {
    if (isLoading) return showCodeInput ? 'Verifying...' : 'Sending code...';
    return showCodeInput ? 'Verify Code' : 'Sign In';
  };

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
          <h1 className="text-2xl font-semibold text-center text-gray-900 mb-2">
            Sign In
          </h1>

          <p className="text-gray-500 text-center mb-8">
            {showCodeInput
              ? `Enter the verification code sent to your ${activeTab}`
              : `Please enter your ${activeTab} to sign in`}
          </p>

          {!showCodeInput && (
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'email'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </button>
              <button
                onClick={() => setActiveTab('phone')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'phone'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Phone className="w-4 h-4 mr-2" />
                Phone
              </button>
            </div>
          )}

          <div className="space-y-6">
            {!showCodeInput && (
              <input
                type={activeTab === 'phone' ? 'tel' : 'email'}
                value={activeTab === 'phone' ? phone : email}
                onChange={(e) =>
                  activeTab === 'phone'
                    ? setPhone(e.target.value)
                    : setEmail(e.target.value)
                }
                placeholder={`Your ${activeTab}`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-400"
              />
            )}

            {showCodeInput && (
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-400"
                />
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || isLoading}
              className={`w-full font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none ${
                !isFormValid() || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {getButtonText()}
            </button>

            {userType && (
              <p className="text-center text-sm text-gray-500">
                Logged in as <strong>{userType}</strong>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
