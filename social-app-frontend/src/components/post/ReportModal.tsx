import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldAlert } from 'lucide-react';
import { reportPost } from '../../api/posts';
import { useToast } from '../../context/ToastContext';
import '../ui/Modal.css';


interface ReportModalProps {
    postId: string;
    onClose: () => void;
}

const REPORT_REASONS = [
    'Hate Speech',
    'Spam',
    'Misinformation',
    'Harassment',
    'NSFW'
];

export const ReportModal: React.FC<ReportModalProps> = ({ postId, onClose }) => {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error: showError } = useToast();

    const handleSubmit = async () => {
        if (!selectedReason) {
            showError('Please select a reason');
            return;
        }

        setIsSubmitting(true);
        try {
            await reportPost(postId, selectedReason);
            success('Post reported successfully. Our moderation team will review it.');
            onClose();
        } catch (err: any) {
            showError(err.message || 'Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 99999 }}>
            <div className="modal-content relative animate-fade-in max-w-md w-full" style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '1rem', width: '90%', maxWidth: '28rem', color: 'white', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.1)' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '3rem', height: '3rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShieldAlert color="#ef4444" size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'white' }}>Report Post</h3>
                            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0, lineHeight: 1.4 }}>
                                Please select the reason that best describes why you are reporting this post.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                    {REPORT_REASONS.map((reason) => (
                        <label
                            key={reason}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                border: selectedReason === reason ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                                backgroundColor: selectedReason === reason ? 'rgba(239, 68, 68, 0.05)' : 'rgba(15, 23, 42, 0.4)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <input
                                type="radio"
                                name="reportReason"
                                value={reason}
                                checked={selectedReason === reason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                style={{ display: 'none' }}
                            />
                            <div style={{
                                width: '1.25rem', height: '1.25rem', borderRadius: '50%', flexShrink: 0,
                                border: selectedReason === reason ? '2px solid #ef4444' : '2px solid #4b5563',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: selectedReason === reason ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
                            }}>
                                {selectedReason === reason && <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', backgroundColor: '#ef4444' }} />}
                            </div>
                            <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: selectedReason === reason ? '#fca5a5' : '#d1d5db' }}>
                                {reason}
                            </span>
                        </label>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.5rem', background: 'transparent', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.2)', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1 }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedReason || isSubmitting}
                        style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.5rem', background: '#ef4444', color: 'white', border: 'none', cursor: (!selectedReason || isSubmitting) ? 'not-allowed' : 'pointer', opacity: (!selectedReason || isSubmitting) ? 0.5 : 1 }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
