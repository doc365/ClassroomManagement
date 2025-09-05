import React, { useState, useEffect } from "react";
import { ArrowLeft, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { auth } from "../../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function LogInForm({ onSignInSuccess }) {
  const [activeTab, setActiveTab] = useState("email");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [userType, setUserType] = useState(null);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [selectedLoginMethod, setSelectedLoginMethod] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------- Setup Recaptcha for Testing ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response) => console.log("reCAPTCHA solved:", response),
        "expired-callback": () => console.log("reCAPTCHA expired"),
      });

      window.recaptchaVerifier.render().then((widgetId) => {
        window.recaptchaWidgetId = widgetId;
      });

      // Always disable for testing
      auth.settings.appVerificationDisabledForTesting = true;
      console.log("Firebase app verification disabled for testing");
    }
  }, []);

  // ---------- Check User Type ----------
  const checkUserType = async () => {
    setIsLoading(true);
    setError("");
    try {
      const identifier = activeTab === "phone" ? phone.trim() : email.trim();
      const response = await fetch("http://localhost:3000/auth/checkUserType", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [activeTab === "phone" ? "phoneNumber" : "email"]: identifier,
        }),
      });
      const result = await response.json();

      if (result.success) {
        setUserType(result.userType);
        if (result.userType === "student") setShowLoginOptions(true);
        else await requestCode();
      } else {
        setError(result.error || "User not found");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Request OTP ----------
  const requestCode = async () => {
    setIsLoading(true);
    setError("");

    if (activeTab === "phone") {
      try {
        let formattedPhone = phone.trim();
        if (formattedPhone.startsWith("0")) formattedPhone = "+84" + formattedPhone.slice(1);
        else if (!formattedPhone.startsWith("+")) formattedPhone = "+" + formattedPhone;

        const appVerifier = window.recaptchaVerifier;

        const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(result);
        setShowCodeInput(true);
        setShowLoginOptions(false);
      } catch (err) {
        console.error("Firebase SMS Error:", err);
        setError("Failed to send code. Make sure it's a Firebase test number.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Email login
      try {
        const response = await fetch("http://localhost:3000/auth/loginEmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const result = await response.json();
        if (result.success) {
          setShowCodeInput(true);
          setShowLoginOptions(false);
        } else {
          setError(result.error || "Failed to send access code.");
        }
      } catch (err) {
        console.error(err);
        setError("Server error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ---------- Verify OTP ----------
  const verifyCode = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (activeTab === "phone") {
        if (!confirmationResult) throw new Error("Request code first");
        const result = await confirmationResult.confirm(accessCode.trim());
        const user = result.user;
        const idToken = await user.getIdToken();
        onSignInSuccess?.({
          token: idToken,
          uid: user.uid,
          phone: user.phoneNumber,
          userType,
        });
      } else {
        const response = await fetch("http://localhost:3000/auth/validateEmailCode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), accessCode: accessCode.trim() }),
        });
        const result = await response.json();
        if (result.success) {
          onSignInSuccess?.({
            email: result.email || email.trim(),
            phone: result.phone || phone.trim(),
            name: result.name || (result.userType === "instructor" ? "Instructor" : "Student"),
            userType: result.userType,
          });
        } else {
          setError(result.error || "Invalid access code.");
        }
      }
    } catch (err) {
      console.error("Verification Error:", err);
      setError(err.message || "Invalid code.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Password Login ----------
  const loginWithPassword = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:3000/auth/loginPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [activeTab === "phone" ? "phoneNumber" : "email"]:
            activeTab === "phone" ? phone.trim() : email.trim(),
          password: password.trim(),
        }),
      });
      const result = await response.json();
      if (result.success) {
        onSignInSuccess?.({
          email: result.email || email.trim(),
          phone: result.phone || phone.trim(),
          name: result.name || "Student",
          userType: result.userType || "student",
        });
      } else {
        setError(result.error || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Handle Submit ----------
  const handleSubmit = () => {
    if (showCodeInput) return verifyCode();
    if (showLoginOptions && selectedLoginMethod === "password") return loginWithPassword();
    if (showLoginOptions && selectedLoginMethod === "otp") return requestCode();
    return checkUserType();
  };

  const handleBack = () => {
    if (showCodeInput) {
      setShowCodeInput(false);
      setAccessCode("");
      setError("");
      if (userType === "student") setShowLoginOptions(true);
    } else if (showLoginOptions) {
      setShowLoginOptions(false);
      setSelectedLoginMethod("");
      setPassword("");
      setError("");
      setUserType(null);
    }
  };

  const isFormValid = () => {
    if (showCodeInput) return accessCode.trim().length === 6;
    if (showLoginOptions) {
      if (selectedLoginMethod === "password") return password.trim() !== "";
      return selectedLoginMethod !== "";
    }
    return activeTab === "phone" ? phone.trim() !== "" : email.trim() !== "";
  };

  const getButtonText = () => {
    if (isLoading) {
      if (showCodeInput) return "Verifying...";
      if (showLoginOptions && selectedLoginMethod === "password") return "Signing in...";
      if (showLoginOptions && selectedLoginMethod === "otp") return "Sending code...";
      return "Checking...";
    }
    if (showCodeInput) return "Verify Code";
    if (showLoginOptions && selectedLoginMethod === "password") return "Sign In";
    if (showLoginOptions && selectedLoginMethod === "otp") return "Send Code";
    return "Continue";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div id="recaptcha-container"></div>
      <div className="w-full max-w-md">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </button>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-center text-gray-900 mb-2">Sign In</h1>
          <p className="text-gray-500 text-center mb-8">
            {showCodeInput
              ? `Enter the verification code sent to your ${activeTab}`
              : showLoginOptions
              ? "Choose how you want to sign in"
              : `Please enter your ${activeTab} to sign in`}
          </p>

          {!showCodeInput && !showLoginOptions && (
            <>
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setActiveTab("email")}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "email"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Mail className="w-4 h-4 mr-2" /> Email
                </button>
                <button
                  onClick={() => setActiveTab("phone")}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "phone"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Phone className="w-4 h-4 mr-2" /> Phone
                </button>
              </div>

              <input
                type={activeTab === "phone" ? "tel" : "email"}
                value={activeTab === "phone" ? phone : email}
                onChange={(e) =>
                  activeTab === "phone" ? setPhone(e.target.value) : setEmail(e.target.value)
                }
                placeholder={`Your ${activeTab}`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-400 mb-6"
              />
            </>
          )}

          {showLoginOptions && (
            <div className="space-y-4 mb-6">
              <div className="text-sm text-gray-600 mb-4">
                Signing in as: <strong>{activeTab === "phone" ? phone : email}</strong>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setSelectedLoginMethod("password")}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedLoginMethod === "password"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
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
                  onClick={() => setSelectedLoginMethod("otp")}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedLoginMethod === "otp"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    {activeTab === "phone" ? (
                      <Phone className="w-5 h-5 mr-3 text-gray-600" />
                    ) : (
                      <Mail className="w-5 h-5 mr-3 text-gray-600" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">Send verification code</div>
                      <div className="text-sm text-gray-500">Get a code via {activeTab}</div>
                    </div>
                  </div>
                </button>
              </div>

              {selectedLoginMethod === "password" && (
                <div className="relative mt-4">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
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
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              )}
            </div>
          )}

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
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
