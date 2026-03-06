import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Info, ArrowLeft, Tag, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

import { createCommunity } from '../../api/community';

const CreateCommunityPage = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        tags: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.description.trim()) {
            showToast('Please fill in the community name and description.', 'error');
            return;
        }

        setIsCreating(true);
        showToast('Creating community...', 'info');

        try {
            await createCommunity(formData);
            showToast('Community created successfully!', 'success');

            setTimeout(() => {
                navigate('/community');
            }, 1000);
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header flex items-center mb-6" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/community')}
                    className="icon-btn"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="page-title m-0">Create Community</h1>
            </header>

            <div className="glass-card mt-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="flex flex-col items-center mb-8">
                    <div className="avatar large" style={{ background: 'var(--surface-highlight)', color: 'var(--primary)' }}>
                        <ImageIcon size={32} />
                    </div>
                    <button className="btn btn-outline mt-4" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                        Upload Cover Image
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group mb-6">
                        <label className="input-label">Community Name</label>
                        <Users size={18} className="input-icon" />
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="e.g. React Developers"
                        />
                    </div>

                    <div className="input-group mb-6">
                        <label className="input-label">Description</label>
                        <Info size={18} className="input-icon" />
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="input-field"
                            placeholder="What is this community about?"
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div className="input-group mb-8">
                        <label className="input-label">Tags (comma separated)</label>
                        <Tag size={18} className="input-icon" />
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="e.g. react, programming, frontend"
                        />
                    </div>

                    <div className="divider"></div>

                    <div className="flex justify-between mt-6" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/community')}
                            className="btn btn-outline"
                            style={{ width: 'auto' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="btn btn-primary"
                            style={{ width: 'auto' }}
                        >
                            {isCreating ? 'Creating...' : 'Create Community'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCommunityPage;

