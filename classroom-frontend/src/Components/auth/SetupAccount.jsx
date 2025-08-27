import { useEffect, useState } from "react";
import {ArrowLeft, User, Phone, Lock } from 'lucide-react'
import {api } from '../../api';
import { useNavigate,useSearchParams } from "react-router-dom";

export default function SetupAccount({ onSetupSuccess }) {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');

    const handleBack = () => navigate(-1);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing token.');
            setLoading(false);
            return;
        }

        const fetchInvitation = async () => {
            try{
                const res = await api.validateInvitation(token);
                if (res.error) {
                    setError(res.error);
                } else {
                    setEmail(res.email);
                    setName(res.name || '');
                }
            } catch (error) {
                console.error('Error validating invitation token:', error);
                setError('Failed to validate invitation token.');
            } finally {
                setLoading(false);
            }
        };
        fetchInvitation();
    }, [token]);

    const isFormValid = password.trim().length >= 6 && phone.trim().length > 0;

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            const res = await api.setupAccount(
                name,
                phone,
                email,
                password
            );
            if (res.success) {
                onSetupSuccess({
                    email: res.email || email,
                    name: res.name || name,
                    phone: res.phone || phone
                });
            } else {
                setError(res.error || 'Failed to set up account.');
            }
        } catch(error) {
            console.error('Error setting up account:', error);
            setError('Failed to set up account.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-600">
                <p>Loading...</p>
            </div>
        )
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
                        we've invited you<span className="font-medium"> {email} </span> 
                        please fill in your details below
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

                        <div className="flex items-center border border-gray-300 rounded-lg px-4">
                            <Lock className="w-5 h-5 text-gray-400 mr-3"/>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                            ${(submitting&& !isFormValid ) 
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