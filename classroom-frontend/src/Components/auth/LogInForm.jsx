import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';

export default function LogInForm({ onSignInSuccess }) {
  const [accessCode, setAccessCode] = useState('');
  const [activeTab, setActiveTab] = useState('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [selectedLoginMethod, setSelectedLoginMethod] = useState('');
  const [userType, setUserType] = useState(null);

  const checkUserType = async () => {
    setIsLoading(true);
    setError('');

    try {
      const identifier = activeTab === 'phone' ? phone.trim() : email.trim();
      const response = await fetch('http://localhost:3000/auth/checkUserType', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          [activeTab === 'phone' ? 'phoneNumber' : 'email']: identifier 
        })
      });

      const result = await response.json();
      if (result.success) {
        setUserType(result.userType);
        
        if (result.userType === 'student') {
          setShowLoginOptions(true);
        } else {
          // For instructors, go directly to OTP
          await requestCode();
        }
      } else {
        setError(result.error || 'User not found.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPassword = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/auth/loginPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [activeTab === 'phone' ? 'phoneNumber' : 'email']: activeTab === 'phone' ? phone.trim() : email.trim(),
          password: password.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        if (onSignInSuccess) {
          onSignInSuccess({
            email: result.email || email.trim(),
            phone: result.phone || phone.trim(),
            name: result.name || 'Student',
            userType: result.userType || 'student'
          });
        }
      } else {
        setError(result.error || 'Invalid credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

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
        setShowCodeInput(true);
        setShowLoginOptions(false);
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
      if (userType === 'student') {
        setShowLoginOptions(true);
      }
    } else if (showLoginOptions) {
      setShowLoginOptions(false);
      setSelectedLoginMethod('');
      setPassword('');
      setError('');
      setUserType(null);
    } else {
      console.log('Back to previous page');
    }
  };

  const handleSubmit = () => {
    if (showCodeInput) {
      verifyCode();
    } else if (showLoginOptions && selectedLoginMethod === 'password') {
      loginWithPassword();
    } else if (showLoginOptions && selectedLoginMethod === 'otp') {
      requestCode();
    } else {
      checkUserType();
    }
  };

  const isFormValid = () => {
    if (showCodeInput) {
      return accessCode.trim().length === 6;
    }
    if (showLoginOptions) {
      if (selectedLoginMethod === 'password') {
        return password.trim() !== '';
      }
      return selectedLoginMethod !== ''; // Just need to select a method for OTP
    }
    return activeTab === 'phone' ? phone.trim() !== '' : email.trim() !== '';
  };

  const getButtonText = () => {
    if (isLoading) {
      if (showCodeInput) return 'Verifying...';
      if (showLoginOptions && selectedLoginMethod === 'password') return 'Signing in...';
      if (showLoginOptions && selectedLoginMethod === 'otp') return 'Sending code...';
      return 'Checking...';
    }
    
    if (showCodeInput) return 'Verify Code';
    if (showLoginOptions && selectedLoginMethod === 'password') return 'Sign In';
    if (showLoginOptions && selectedLoginMethod === 'otp') return 'Send Code';
    return 'Continue';
  };

  const getHeaderText = () => {
    if (showCodeInput) {
      return `Enter the verification code sent to your ${activeTab}`;
    }
    if (showLoginOptions) {
      return 'Choose how you want to sign in';
    }
    return `Please enter your ${activeTab} to sign in`;
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
            {getHeaderText()}
          </p>

          {/* Initial Email/Phone Input */}
          {!showCodeInput && !showLoginOptions && (
            <>
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

              <input
                type={activeTab === 'phone' ? 'tel' : 'email'}
                value={activeTab === 'phone' ? phone : email}
                onChange={(e) =>
                  activeTab === 'phone'
                    ? setPhone(e.target.value)
                    : setEmail(e.target.value)
                }
                placeholder={`Your ${activeTab}`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-400 mb-6"
              />
            </>
          )}

          {/* Login Options for Students */}
          {showLoginOptions && (
            <div className="space-y-4 mb-6">
              <div className="text-sm text-gray-600 mb-4">
                Signing in as: <strong>{activeTab === 'phone' ? phone : email}</strong>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedLoginMethod('password')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedLoginMethod === 'password'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Lock className="w-5 h-5 mr-3 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Sign in with password</div>
                      <div className="text-sm text-gray-500">Use your account password</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedLoginMethod('otp')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedLoginMethod === 'otp'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    {activeTab === 'phone' ? (
                      <Phone className="w-5 h-5 mr-3 text-gray-600" />
                    ) : (
                      <Mail className="w-5 h-5 mr-3 text-gray-600" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        Send verification code
                      </div>
                      <div className="text-sm text-gray-500">
                        Get a code via {activeTab}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {selectedLoginMethod === 'password' && (
                <div className="relative mt-4">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* OTP Code Input */}
          {showCodeInput && (
            <div className="relative mb-6">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-400"
              />
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg mb-6">
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
            <p className="text-center text-sm text-gray-500 mt-4">
              Signing in as <strong>{userType}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}