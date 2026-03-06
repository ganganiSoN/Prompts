import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Camera, Save, ArrowLeft, User, Mail, Link as LinkIcon, Info } from 'lucide-react';


const EditProfilePage = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();


    const [formData, setFormData] = useState({
        name: user?.name || '',
        bio: user?.bio || '',
        website: user?.website || '',
        location: user?.location || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const { success, error: showError, showToast } = useToast();


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        showToast("Saving changes...", "info");


        setIsSaving(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });


            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                data = { message: `Server returned an unexpected response (Status: ${response.status})` };
            }


            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }


            // Update local user state
            updateUser({
                name: formData.name,
                bio: formData.bio,
                website: formData.website,
                location: formData.location
            });

            success('Profile updated successfully!');
            setTimeout(() => {
                navigate('/profile');
            }, 1000);

        } catch (err: any) {
            showError(err.message || 'An error occurred while updating profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header flex items-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/profile')}
                    className="icon-btn"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="page-title m-0">Edit Profile</h1>
            </header>


            <div className="glass-card mt-6">
                <div className="profile-header flex items-center mb-6">
                    <div className="avatar large" style={{ position: 'relative', overflow: 'visible' }}>
                        {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                        <button className="icon-btn" style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: 'var(--primary)', color: 'white', width: '28px', height: '28px', boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.39)' }}>
                            <Camera size={14} />
                        </button>
                    </div>
                </div>


                <form onSubmit={handleSubmit}>
                    <div className="settings-grid mb-6">
                        <div className="input-group">
                            <label className="input-label">Display Name</label>
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Your Name"
                            />
                        </div>


                        <div className="input-group">
                            <label className="input-label">Email Address</label>
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="input-field"
                                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                            />
                            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Email cannot be changed here.</p>
                        </div>
                    </div>


                    <div className="input-group mb-6">
                        <label className="input-label">Bio</label>
                        <Info size={18} className="input-icon" />
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={4}
                            className="input-field"
                            placeholder="Tell us about yourself..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>


                    <div className="settings-grid mb-6">
                        <div className="input-group">
                            <label className="input-label">Website</label>
                            <LinkIcon size={18} className="input-icon" />
                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="https://yoursite.com"
                            />
                        </div>


                        <div className="input-group">
                            <label className="input-label">Location</label>
                            <div className="input-icon" style={{ fontStyle: 'normal', fontSize: '18px', display: 'flex', alignItems: 'center' }}>📍</div>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="City, Country"
                            />
                        </div>
                    </div>


                    <div className="divider"></div>


                    <div className="flex justify-between mt-6" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/profile')}
                            className="btn btn-outline"
                            style={{ width: 'auto' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="btn btn-primary"
                            style={{ width: 'auto' }}
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default EditProfilePage;



