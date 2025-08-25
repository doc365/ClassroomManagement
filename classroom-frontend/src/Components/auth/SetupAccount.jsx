import { useEffect, useState } from "react";
import {ArrowLeft, User, Phone } from 'lucide-react'
import {api } from '../api';

export default function SetupAccount({ onSetupSuccess }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        if (t) {
            setToken(t);
            api.validateInvitation(t)
                .then(res => {
                    if (resizeBy.success){
                        setEmail(resizeBy.email || '');
                        setName(resizeBy.name || '');
                    }else{
                        setError(res.error || 'Invalid invitation token.');
                    }
                })
                .catch(() => { setError('Failed to validate invitation token.')})
                    .finally(() => setLoading(false));
        }else {
            setError('No invitation token provided.');
            setLoading(false);
        }
    }, []);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            const res = await api.setupAccount({ token, name, phone });
            if (res.success) {
                onSetupSuccess({
                    email: res.email || email,
                    name: res.name || name,
                    phone: res.phone || phone
                });
            } else {
                setError(res.error || 'Failed to set up account.');
            }
        } catch(err) {
            console.error('Error setting up account:', err);
            setError('Failed to set up account.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        window.history.back();
    };

    const isFormValid = name.trim() !== '' && phone.trim() !== '';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-600">
                Loading...</div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-8 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </button>

                <div className="bg-white rounded-lg shadow-sm p-8">
                    <h1 className="text-2xl font-semibold mb-2 text-center text-gray-900">
                        Set Up Your Account
                    </h1>
                    <p className="text-center text-gray-600 mb-8">
                        we've invited you with <span className="font-medium">{email}</span>
                        please confirm your details below
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-center border border-gray-300 rounded-lg px-4">
                            <User className="w-5 h-5 text-gray-400 mr-3"/>
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full py-3 outline-none text-gray-900 placeholder-gray-400"
                            />
                        </div>

                        <div className="flex items-center border border-gray-300 rounded-lg px-4">
                            <Phone className="w-5 h-5 text-gray-400 mr-3"/>
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full py-3 outline-none text-gray-900 placeholder-gray-400"
                            />
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
                            ${(isFormValid && !submitting) 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                             : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {submitting ? 'Setting Up...' : 'Set Up Account'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}