import React, { useState } from 'react';
import { Shield, Key, Lock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { changePassword, setupMfa, enableMfa, disableMfa } from '../../api/auth';

const SettingsPage = () => {
    const { user, updateUser } = useAuth();
    const { success, error } = useToast();

    // Password Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    // MFA State
    const [showMfaModal, setShowMfaModal] = useState(false);
    const [mfaData, setMfaData] = useState<{ qrCodeUrl?: string, secret?: string } | null>(null);
    const [mfaToken, setMfaToken] = useState('');
    const [isSubmittingMfa, setIsSubmittingMfa] = useState(false);

    const isLocalUser = !user?.authProvider || user?.authProvider === 'local';

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            return error("New passwords don't match.");
        }
        setIsSubmittingPassword(true);
        try {
            await changePassword(passwords.current, passwords.new);
            success("Password updated successfully!");
            setShowPasswordModal(false);
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            error(err.message || "Failed to change password.");
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    const handleSetupMFA = async () => {
        setIsSubmittingMfa(true);
        try {
            const data = await setupMfa();
            setMfaData({ qrCodeUrl: data.qrCodeUrl, secret: data.secret });
            setShowMfaModal(true);
        } catch (err: any) {
            error(err.message || "Failed to initiate MFA setup.");
        } finally {
            setIsSubmittingMfa(false);
        }
    };

    const handleVerifyMFA = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingMfa(true);
        try {
            await enableMfa(mfaToken);
            success("MFA successfully enabled!");
            setShowMfaModal(false);
            setMfaData(null);
            setMfaToken('');
            updateUser({ isMfaEnabled: true });
        } catch (err: any) {
            error(err.message || "Invalid token.");
        } finally {
            setIsSubmittingMfa(false);
        }
    };

    const handleDisableMFA = async () => {
        if (!window.confirm("Are you sure you want to disable Multi-Factor Authentication?")) return;
        try {
            await disableMfa();
            success("MFA disabled.");
            updateUser({ isMfaEnabled: false });
        } catch (err: any) {
            error(err.message || "Failed to disable MFA.");
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">
                    <Shield className="text-indigo-400" size={28} />
                    Security Settings
                </h1>
                <p className="page-subtitle">Manage your account security, passwords, and authentication methods.</p>
            </header>

            <div className="settings-grid">

                {/* Change Password Section */}
                {isLocalUser && (
                    <div className="glass-card p-6 border border-white/10 relative overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-indigo-300">
                                    <Key size={22} />
                                    <h3 className="text-lg font-bold text-gray-200">Password</h3>
                                </div>
                                <p className="text-sm text-gray-400 max-w-sm">Ensure your account is using a long, random password to stay secure.</p>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="btn btn-outline"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                )}

                {/* MFA Section */}
                <div className="glass-card p-6 border border-white/10 relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-indigo-300">
                                <Lock size={22} />
                                <h3 className="text-lg font-bold text-gray-200">Multi-Factor Authentication (MFA)</h3>
                                {user?.isMfaEnabled && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1"><CheckCircle size={10} /> Enabled</span>}
                            </div>
                            <p className="text-sm text-gray-400 max-w-md">Add additional security to your account using two-factor authentication.</p>
                        </div>
                        {user?.isMfaEnabled ? (
                            <button onClick={handleDisableMFA} className="btn bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition">
                                Disable MFA
                            </button>
                        ) : (
                            <button onClick={handleSetupMFA} className="btn btn-primary" disabled={isSubmittingMfa}>
                                {isSubmittingMfa ? 'Loading...' : 'Configure MFA'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-md relative overflow-hidden animate-slide-up">
                        <button className="absolute top-6 right-6 text-gray-400 hover:text-white transition" onClick={() => setShowPasswordModal(false)}>
                            <XCircle size={24} />
                        </button>

                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
                            <Key className="text-indigo-400" size={28} /> Change Password
                        </h2>

                        <form onSubmit={handlePasswordChange}>
                            <div className="input-group">
                                <label className="input-label">Current Password</label>
                                <Lock className="input-icon" size={20} />
                                <input
                                    type="password" required
                                    className="input-field"
                                    value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">New Password</label>
                                <Lock className="input-icon" size={20} />
                                <input
                                    type="password" required minLength={6}
                                    className="input-field"
                                    value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Confirm New Password</label>
                                <Lock className="input-icon" size={20} />
                                <input
                                    type="password" required minLength={6}
                                    className="input-field"
                                    value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    className="btn btn-outline flex-1"
                                    onClick={() => setShowPasswordModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                    disabled={isSubmittingPassword}
                                >
                                    <CheckCircle size={20} />
                                    {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MFA Setup Modal */}
            {showMfaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-md border border-white/10 shadow-2xl relative overflow-hidden animate-slide-up">
                        <button className="absolute top-4 right-4 text-gray-400 hover:text-white transition" onClick={() => { setShowMfaModal(false); setMfaData(null); setMfaToken(''); }}>
                            <XCircle size={24} />
                        </button>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-200">
                            <Lock className="text-indigo-400" /> Setup Authenticator App
                        </h2>

                        <div className="text-sm text-gray-400 mb-6 space-y-3">
                            <p>1. Install an authenticator app like Google Authenticator or Authy on your mobile device.</p>
                            <p>2. Scan the QR code below or enter the setup key manually.</p>
                        </div>

                        <div className="flex flex-col items-center justify-center mb-6">
                            {mfaData?.qrCodeUrl ? (
                                <div className="bg-white p-2 rounded-lg mb-4">
                                    <img src={mfaData.qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
                                </div>
                            ) : (
                                <div className="w-48 h-48 bg-white/5 rounded-lg mb-4 flex items-center justify-center animate-pulse">
                                    <span className="text-xs text-gray-500">Loading QR...</span>
                                </div>
                            )}
                            {mfaData?.secret && (
                                <div className="text-center">
                                    <span className="text-xs text-gray-500 block mb-1">Setup Key</span>
                                    <code className="text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded text-sm font-mono">{mfaData.secret}</code>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleVerifyMFA} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">3. Enter the 6-digit code</label>
                                <input
                                    type="text" required maxLength={6} pattern="\d{6}" placeholder="000000"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-center text-lg tracking-widest"
                                    value={mfaToken} onChange={e => setMfaToken(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" className="btn btn-outline" onClick={() => { setShowMfaModal(false); setMfaData(null); setMfaToken(''); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmittingMfa || mfaToken.length < 6}>
                                    {isSubmittingMfa ? 'Verifying...' : 'Verify & Enable'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
