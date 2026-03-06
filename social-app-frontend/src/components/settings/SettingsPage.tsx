import React from 'react';
import { Settings, Shield, Bell, Key } from 'lucide-react';

const SettingsPage = () => {
    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">Settings</h1>
            </header>

            <div className="settings-grid mt-6">
                <div className="glass-card settings-card">
                    <div className="settings-header">
                        <Shield className="settings-icon" size={24} />
                        <h3>Security Preferences</h3>
                    </div>
                    <p className="mt-2 text-sm">Manage your account security and authentication methods.</p>
                    <button className="btn btn-outline mt-4">Configure MFA</button>
                </div>

                <div className="glass-card settings-card">
                    <div className="settings-header">
                        <Bell className="settings-icon" size={24} />
                        <h3>Notifications</h3>
                    </div>
                    <p className="mt-2 text-sm">Choose what updates you want to receive.</p>
                    <button className="btn btn-outline mt-4">Manage Alerts</button>
                </div>

                <div className="glass-card settings-card">
                    <div className="settings-header">
                        <Key className="settings-icon" size={24} />
                        <h3>API Keys</h3>
                    </div>
                    <p className="mt-2 text-sm">Manage access tokens for external integrations.</p>
                    <button className="btn btn-outline mt-4">Generate Key</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
