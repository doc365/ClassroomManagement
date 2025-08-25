import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone } from 'lucide-react';

export default function SignInForm({ onSignInSuccess }) {
  const [accessCode, setAccessCode] = useState('');
  const [activeTab, setActiveTab] = useState('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const endpoint = activeTab === 'phone' ? 'http://localhost:3000/createAccessCode' : 'http://localhost:3000/loginEmail';
      const payload = activeTab === 'phone'
        ? { phone: phone.trim() }
        : { email: email.trim() };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        setStep(2);
      } else {
        setError(result.error || 'Failed to send code');
      }
    } catch (error) {
      console.error('Error sending code:', error);
      setError('Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const endpoint = activeTab === 'phone' ? 'http://localhost:3000/verifyCode' : 'http://localhost:3000/validateEmailCode';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessCode: accessCode.trim(),
          [activeTab]: activeTab === 'phone' ? phone.trim() : email.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        if (onSignInSuccess) {
          onSignInSuccess({
            email:result.email || email.trim(),
            phone:result.phone || phone.trim(),
            name: result.name || 'Instructor',
          });
        }
      } else {
        setError(result.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setAccessCode('');
      setError('');
    } else {
      console.log('Back button clicked - navigate to previous page');
    }
  };

  const handleSignUp = () => {
    console.log('Sign up clicked');
  };

  const isStep1Valid = activeTab === 'phone' ? phone.trim() !== '' : email.trim() !== '';
  const isStep2Valid = accessCode.trim().length >= 6;

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
            {step === 1 
              ? `Please enter your ${activeTab} to sign in`
              : `Enter the verification code sent to your ${activeTab}`
            }
          </p>


          {step === 1 && (
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

            <div>
              {step === 1 ? (

                activeTab === 'phone' ? (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your Phone Number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-400"
                  />
                ) : (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your Email Address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-400"
                  />
                )
              ) : (

                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter 6-digit verification code"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-400 text-center text-xl tracking-widest"
                />
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={step === 1 ? handleSubmit : handleVerifyCode}
              disabled={step === 1 ? (!isStep1Valid || isLoading) : (!isStep2Valid || isLoading)}
              className={`w-full font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none ${
                (step === 1 ? (!isStep1Valid || isLoading) : (!isStep2Valid || isLoading))
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading 
                ? (step === 1 ? 'Sending...' : 'Verifying...') 
                : (step === 1 ? 'Send Code' : 'Sign In')
              }
            </button>

            <p className="text-center text-sm text-gray-500">
              Passwordless authentication methods
            </p>
          </div>

          {step === 1 && (
            <div className="mt-8 text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <button
                onClick={handleSignUp}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}