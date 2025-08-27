import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, Lock } from 'lucide-react';

export default function SignInForm({ onSignInSuccess }) {
  const [accessCode, setAccessCode] = useState('');
  const [activeTab, setActiveTab] = useState('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState(null);
  

  const checkUserTypeAndSignIn = async () => {
    setIsLoading(true);
    setError('');

    try{
      const identifier = activeTab === 'phone' ? phone.trim() : email.trim();

      let userExists = false;
      let detectedUserType = null;

    if (activeTab === 'email'){
      const checkResponse = await fetch('http://localhost:3000/checkUserByEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: identifier })
      });

      if (checkResponse.ok) {
        const result = await checkResponse.json();
        userExists = result.exists;
        detectedUserType = result.userType;
      } else{
        throw new Error('failed to check user');
      }
    } else {
      const checkResponse = await fetch('http://localhost:3000/checkUserByPhone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: identifier })
      });

      if (checkResponse.ok) {
        const result = await checkResponse.json();
        userExists = result.exists;
        detectedUserType = result.userType;
      }else{
        throw new Error('Failed to check user')
      }
    
    } 
    setUserType(detectedUserType);

    if(!userExists){
      setError('Account not found, please check your information or sign up');
      return;
    }

    if (detectedUserType === 'instructor'){

      const response = await fetch('http://localhost:3000/loginEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: activeTab === 'email' ? identifier: email.trim() })
      })

      const result = await response.json();
      if (result.success) {
        setShowCodeInput(true)
      } else {
        setError(result.error || 'failed to send access code. Please try again.')
      }
    } else if( detectedUserType === 'student') {
      if (activeTab === 'phone'){
        setShowPasswordInput(true);
    } else{
      const response = await fetch('http://localhost:3000/createAccessCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({phone: identifier})
      });

      const result = await response.json();

      if(result.success) {
        setUserType('instructor');
        setShowCodeInput(true);
      } else {
        setError(result.error || 'Failed to send access code. Please try again.');
      }
    }
  }
    } catch (error) {
      console.error('Error checking user type:', error);
      setError('Failed to check user type. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const endpoint = activeTab === 'phone' ? 'http://localhost:3000/validateAccessCode' : 'http://localhost:3000/validateEmailCode';
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

  const handlePasswordLogin = async () => {
    setIsLoading(true);
    setError('');

    try{
      const response = await fetch('http://localhost:3000/loginStudent',{
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phone.trim(),
        password: password.trim()
      })
    });
    const result = await response.json();

    if (result.success){
      if(onSignInSuccess){
        onSignInSuccess({
          email: email.trim(),
          phone: phone.trim(),
          name: "Student",
          userType: 'student'
        });
      }
    } else {
      setError(result.error || 'invalid password');
    }
  } catch (error){
    console.error('error logging in: ', error);
    setError('failed to login. Please try again')
  }finally{
    setIsLoading(false)
  }
};
  

  const handleBack = () => {
    if (showCodeInput || showPasswordInput){
      setShowCodeInput(false);
      setShowPasswordInput(false);
      setAccessCode('');
      setPassword('');
      setError('');
      setUserType(null);
    }else{
      console.log('back button clicked- naviagte to previous page')
    }
  };

  const handleSignUp = () => {
    console.log('Sign up clicked');
  };

  const isFormValid = () => {
    const identifierValid = activeTab ==='phone' ? phone.trim() !== '' : email.trim() !== '';

    if (showCodeInput) {
      return accessCode.trim().length >= 6;
    } else if (showPasswordInput) {
      return identifierValid && password.trim().length >=6;
    }else {
      return identifierValid;
    }
  };

  const getButtonText = () => {
    if(isLoading){
      if(showCodeInput) return 'Verifying...';
      if (showPasswordInput) return 'Signing in...';
      return 'Checking...'
    }

    if(showCodeInput) return 'Verify Code';
    if(showPasswordInput) return 'Sign In';
    return 'Sign In';
  };

  const handleSubmit = () => {
    if (showCodeInput) {
      handleVerifyCode();
    } else if (showPasswordInput){
      handlePasswordLogin();
    } else {
      checkUserTypeAndSignIn();
    }
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
              :showPasswordInput
              ? 'Enter your password to sign in'
              : `Please enter your ${activeTab} to sign in`
            }
          </p>


          {!showCodeInput && !showPasswordInput && (
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
            <div className='space-y-4'>
              {!showCodeInput &&(
                <div>
                  {activeTab === 'phone' ? (
                    <input 
                    type="tel"
                    value = {phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder = "your Phone Number"
                    className='w-full px-4 py-3 border border-gray-300
                    rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors
                    text-gray-900 placeholder-gray-400' />
                  ) :(
                    <input 
                    type="email"
                    value = {email}
                    onChange={(e) =>setEmail(e.target.value)}
                    placeholder = "your Email Number"
                    className='w-full px-4 py-3 border border-gray-300
                    rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors
                    text-gray-900 placeholder-gray-400' />
                  )}
                  </div>
                )}
                {showPasswordInput && (
                  <div className='relative'>
                    <Lock className='absolute left-3 top-3.5 h-5 w-5 text-gray-400'/>
                    <input 
                    type="password"
                    value = {password}
                    onChange = {(e) => setPassword(e.target.value)}
                    placeholder='enter your password'
                    className='w-full px-4 py-3 border border-gray-300
                    rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors
                    text-gray-900 placeholder-gray-400'/>
                    </div>
                )}

                {showCodeInput && (
                  <div className='relative'>
                    <Lock className='absolute left-3 top-3.5 h-5 w-5 text-gray-400'/>
                    <input
                    type="Code"
                    value = {accessCode}
                    onChange = {(e) => setAccessCode(e.target.value)}
                    placeholder='enter your password'
                    className='w-full px-4 py-3 border border-gray-300
                    rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors
                    text-gray-900 placeholder-gray-400'/>
                </div>
              )}
            </div>
            

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || isLoading}
              className={`w-full font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none ${
                (!isFormValid() || isLoading)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
               
                {getButtonText()}

            </button>

            <p className="text-center text-sm text-gray-500">
              {userType === 'student' ? 'Student login with password' : 'Passwordless authentication methods'}
            </p>
          </div>

          {!showCodeInput && !showPasswordInput && (
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
