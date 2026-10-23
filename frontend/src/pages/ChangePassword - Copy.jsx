import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import your custom auth context hook
import { Eye, EyeOff, CheckCircle2, XCircle, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { updatePasswordApi } from '../api/AuthApi';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { token } = useAuth(); // Safely retrieve the auth token from global state context

  // States for input fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // States for password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // States for Custom Modal Feedback
  const [feedback, setFeedback] = useState({ show: false, title: '', message: '', type: 'success' });

  // Real-time Validation Logic
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasMinLength = newPassword.length >= 8;

  // Count passed criteria for the password strength bar
  const passedCriteriaCount = [hasUppercase, hasNumber, hasMinLength].filter(Boolean).length;

  const handleClearConfirm = () => {
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (hasUppercase && hasNumber && hasMinLength && newPassword === confirmPassword) {
      try {
        // Fire the API call using the context token
        const response = await updatePasswordApi({ currentPassword, newPassword }, token);
        
        setFeedback({
          show: true,
          title: 'Success!',
          message: response.message || 'Your password has been changed successfully.',
          type: 'success'
        });

        // Clear out the form inputs on success
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
      } catch (err) {
        console.error(err);
        // Extract backend validation messages if available
        const errorMessage = err.response?.data?.error || 'Failed to update password. Please try again.';
        
        setFeedback({
          show: true,
          title: 'Update Failed',
          message: errorMessage,
          type: 'error'
        });
      }
    } else if (newPassword !== confirmPassword) {
      setFeedback({
        show: true,
        title: 'Mismatch Error',
        message: 'New Password and Confirm Password do not match. Please try again.',
        type: 'error'
      });
    } else {
      setFeedback({
        show: true,
        title: 'Requirements Not Met',
        message: 'Please fulfill all the password security standard requirements listed below.',
        type: 'error'
      });
    }
  };

  const closeFeedbackModal = () => {
    setFeedback({ ...feedback, show: false });
    
    // If the submission was successful, redirect the user to their landing home hub dashboard
    if (feedback.type === 'success') {
      navigate('/login');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f2537] p-4 font-sans relative">
      
      {/* Main Card Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 z-10">
        
        {/* Header Section */}
        <div className="bg-[#113f67] text-white p-6 text-center relative">
          <div className="mx-auto bg-white/10 w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-inner">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-wide">Change Password</h2>
          <p className="text-xs text-slate-300 mt-1">Update password for enhanced account security.</p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Current Password Field */}
          <div>
            <label className="block text-xs font-bold text-[#113f67] uppercase tracking-wider mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#f4f7f9] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#113f67] transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-xs font-bold text-[#113f67] uppercase tracking-wider mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#f4f7f9] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#113f67] transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-[#113f67] uppercase tracking-wider">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              {confirmPassword && (
                <button
                  type="button"
                  onClick={handleClearConfirm}
                  className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#f4f7f9] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#113f67] transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Strength Indicator Bars */}
          <div className="pt-1">
            <div className="flex h-1.5 w-full gap-2">
              <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passedCriteriaCount >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
              <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passedCriteriaCount >= 2 ? 'bg-amber-500' : 'bg-gray-200'}`}></div>
              <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passedCriteriaCount >= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">
              {passedCriteriaCount === 3 ? 'Strong password.' : 'Weak password. Must contain:'}
            </p>
          </div>

          {/* Checklist Requirements Box */}
          <div className="space-y-1.5 text-xs text-gray-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2">
              {hasUppercase ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-gray-400" />}
              <span className={hasUppercase ? 'text-emerald-700 font-medium' : ''}>At least 1 uppercase</span>
            </div>
            <div className="flex items-center gap-2">
              {hasNumber ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-gray-400" />}
              <span className={hasNumber ? 'text-emerald-700 font-medium' : ''}>At least 1 number</span>
            </div>
            <div className="flex items-center gap-2">
              {hasMinLength ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-gray-400" />}
              <span className={hasMinLength ? 'text-emerald-700 font-medium' : ''}>At least 8 characters</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#113f67] hover:bg-[#0b2545] text-white rounded-lg text-sm font-medium transition-colors shadow-md shadow-blue-950/20"
            >
              Apply Changes
            </button>
          </div>
        </form>

        {/* Footer Area */}
        <div className="bg-gray-50 px-6 py-3.5 text-center border-t border-gray-100 text-[11px] text-gray-500">
          Pursuant to DepEd Order No. 007, s. 2023
        </div>
      </div>

      {/* --- CUSTOM POPUP MODAL OVERLAY --- */}
      {feedback.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full transform scale-100 transition-transform p-6 text-center border border-gray-100">
            
            {/* Dynamic Status Icon */}
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4">
              {feedback.type === 'success' ? (
                <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                  <CheckCircle size={32} />
                </div>
              ) : (
                <div className="bg-red-100 p-3 rounded-full text-red-600">
                  <AlertCircle size={32} />
                </div>
              )}
            </div>

            {/* Modal Text Content */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">{feedback.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{feedback.message}</p>

            {/* Modal Action Button */}
            <button
              type="button"
              onClick={closeFeedbackModal}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors shadow-md ${
                feedback.type === 'success' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
                  : 'bg-emerald-600 hover:bg-emerald-700' // If the user has met all valid fields but password update fails because of current password verification issues, they keep using the form.
              }`}
            >
              Okay
            </button>
          </div>
        </div>
      )}

    </div>
  );
}