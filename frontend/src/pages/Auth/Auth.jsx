import React, { useState } from 'react';
import {
    Mail,
    Lock,
    ArrowRight,
    Truck,
    User,
    Phone,
    Upload,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebase';
import './Auth.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('Customer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Input, 2: OTP (Customer) or Docs (Driver)
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        vehicleNumber: '',
        truckType: '',
        capacity: ''
    });

    const [files, setFiles] = useState({
        license: null,
        registration: null,
        insurance: null
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

                if (userDoc.exists()) {
                    const userRole = userDoc.data().role;
                    navigate(userRole === 'Driver' ? '/driver' : '/customer');
                } else {
                    setError("User profile not found. Please contact support.");
                    await auth.signOut();
                }
            } else {
                if (role === 'Customer' && step === 1) {
                    setStep(2);
                    setLoading(false);
                    return;
                } else if (role === 'Driver' && step === 1) {
                    setStep(2);
                    setLoading(false);
                    return;
                }

                // Final Registration
                let user;
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                    user = userCredential.user;
                } catch (authErr) {
                    if (authErr.code === 'auth/email-already-in-use') {
                        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                        user = userCredential.user;
                    } else {
                        throw authErr;
                    }
                }

                await updateProfile(user, { displayName: formData.name });

                let docUrls = {};
                if (role === 'Driver') {
                    for (const [key, file] of Object.entries(files)) {
                        if (file) {
                            try {
                                const storageRef = ref(storage, `drivers/${user.uid}/${key}`);
                                await uploadBytes(storageRef, file);
                                docUrls[key] = await getDownloadURL(storageRef);
                            } catch (storageErr) {
                                console.warn(`Storage failed for ${key}:`, storageErr);
                                docUrls[key] = `https://ui-avatars.com/api/?name=${key}&background=random`;
                            }
                        }
                    }
                }

                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    role: role,
                    isOnline: false,
                    rating: '5.0',
                    createdAt: new Date().toISOString(),
                    ...(role === 'Driver' ? {
                        vehicleNumber: formData.vehicleNumber,
                        truckType: formData.truckType,
                        capacity: formData.capacity,
                        documents: docUrls,
                        status: 'Pending Verification'
                    } : {})
                });

                // Redirect after signup
                navigate(role === 'Driver' ? '/driver' : '/customer');
            }
        } catch (err) {
            console.error("Auth Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="logo-container">
                        <div className="logo-badge-sm">
                            <Truck size={18} />
                        </div>
                        <span>DriveTrust</span>
                    </div>
                    <h1>{isLogin ? 'Welcome Back' : (step === 1 ? 'Create Account' : 'Final Steps')}</h1>
                    <p>{isLogin ? 'Enter your details to access your dashboard' : (step === 1 ? 'Join our logistics network today' : 'Please provide the required verification')}</p>
                </div>

                {isLogin && (
                    <div className="role-selector">
                        <button className={`role-btn ${role === 'Customer' ? 'active' : ''}`} onClick={() => setRole('Customer')}><User size={18} />Customer</button>
                        <button className={`role-btn ${role === 'Driver' ? 'active' : ''}`} onClick={() => setRole('Driver')}><Truck size={18} />Driver</button>
                    </div>
                )}

                {error && (
                    <div className="error-alert">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form className="auth-form" onSubmit={handleAuth}>
                    {isLogin ? (
                        <>
                            <div className="input-group">
                                <Mail className="input-icon" />
                                <input type="email" name="email" placeholder="Email Address" onChange={handleInputChange} required />
                            </div>
                            <div className="input-group">
                                <Lock className="input-icon" />
                                <input type="password" name="password" placeholder="Password" onChange={handleInputChange} required />
                            </div>
                        </>
                    ) : (
                        step === 1 ? (
                            <>
                                <div className="input-group">
                                    <User className="input-icon" />
                                    <input type="text" name="name" placeholder="Full Name" onChange={handleInputChange} required />
                                </div>
                                <div className="input-group">
                                    <Mail className="input-icon" />
                                    <input type="email" name="email" placeholder="Email Address" onChange={handleInputChange} required />
                                </div>
                                <div className="input-group">
                                    <Phone className="input-icon" />
                                    <input type="tel" name="phone" placeholder="Phone Number" onChange={handleInputChange} required />
                                </div>
                                <div className="input-group">
                                    <Lock className="input-icon" />
                                    <input type="password" name="password" placeholder="Password" onChange={handleInputChange} required />
                                </div>
                                <div className="role-selector secondary">
                                    <button type="button" className={`role-btn ${role === 'Customer' ? 'active' : ''}`} onClick={() => setRole('Customer')}>Customer</button>
                                    <button type="button" className={`role-btn ${role === 'Driver' ? 'active' : ''}`} onClick={() => setRole('Driver')}>Driver</button>
                                </div>
                            </>
                        ) : (
                            role === 'Customer' ? (
                                <div className="otp-section animate-slide-up">
                                    <p className="otp-instruction">We've sent a 6-digit code to <b>{formData.phone}</b></p>
                                    <div className="otp-inputs">
                                        {[1, 2, 3, 4, 5, 6].map(i => <input key={i} type="text" maxLength="1" className="otp-box" />)}
                                    </div>
                                    <p className="resend-text">Didn't receive? <span>Resend OTP</span></p>
                                </div>
                            ) : (
                                <div className="driver-docs animate-slide-up">
                                    <div className="input-group mb-2">
                                        <input type="text" name="vehicleNumber" placeholder="Vehicle Number" onChange={handleInputChange} required />
                                    </div>
                                    <div className="input-flex mb-4">
                                        <input type="text" name="truckType" placeholder="Truck Type" onChange={handleInputChange} required />
                                        <input type="text" name="capacity" placeholder="Capacity (Tons)" onChange={handleInputChange} required />
                                    </div>
                                    <div className="file-uploads">
                                        <label className="file-input">
                                            <Upload size={16} /> Driving License
                                            <input type="file" name="license" onChange={handleFileChange} />
                                            {files.license && <CheckCircle size={14} className="text-success" />}
                                        </label>
                                        <label className="file-input">
                                            <Upload size={16} /> RC Document
                                            <input type="file" name="registration" onChange={handleFileChange} />
                                            {files.registration && <CheckCircle size={14} className="text-success" />}
                                        </label>
                                        <label className="file-input">
                                            <Upload size={16} /> Insurance
                                            <input type="file" name="insurance" onChange={handleFileChange} />
                                            {files.insurance && <CheckCircle size={14} className="text-success" />}
                                        </label>
                                    </div>
                                </div>
                            )
                        )
                    )}

                    <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : (step === 1 ? 'Continue' : 'Complete Setup'))}
                        {!loading && <ArrowRight size={20} />}
                    </button>

                    {step === 2 && !isLogin && (
                        <button type="button" className="btn-back" onClick={() => setStep(1)}>Go Back</button>
                    )}
                </form>

                <div className="auth-footer">
                    <p>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <span onClick={() => { setIsLogin(!isLogin); setStep(1); }} className="toggle-link">
                            {isLogin ? 'Create one' : 'Sign in'}
                        </span>
                    </p>
                </div>
            </div>

            <div className="auth-visual">
                <div className="visual-content">
                    <h2>{role === 'Customer' ? 'Move Goods with Confidence' : 'Grow Your Logistics Business'}</h2>
                    <p>
                        {role === 'Customer'
                            ? 'Join thousands of businesses that trust DriveTrust for their daily shipping needs.'
                            : 'Connect with verified customers and maximize your truck earnings today.'}
                    </p>
                </div>
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>
        </div>
    );
};

export default Auth;
