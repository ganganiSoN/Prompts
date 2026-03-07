import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { reportPost } from '../../api/posts';
import { useToast } from '../../context/ToastContext';

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

    return (
        <div className="modal-overlay">
            <div className="modal-content relative animate-fade-in max-w-md w-full">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6 gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <ShieldAlert className="text-red-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Report Post</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Please select the reason that best describes why you are reporting this post.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors bg-transparent border-0 flex items-center justify-center p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 mb-8">
                    {REPORT_REASONS.map((reason) => (
                        <label
                            key={reason}
                            className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${selectedReason === reason
                                ? 'border-red-500 bg-red-50 dark:bg-red-500/10'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <input
                                type="radio"
                                name="reportReason"
                                value={reason}
                                checked={selectedReason === reason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                style={{ display: 'none' }}
                            />
                            <div className="flex items-center gap-4 w-full">
                                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedReason === reason ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                    {selectedReason === reason && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                                </span>
                                <span className={`text-[15px] font-medium leading-none ${selectedReason === reason ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {reason}
                                </span>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/60">
                    <button
                        onClick={onClose}
                        className="btn btn-outline py-1.5 px-4 text-sm"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedReason || isSubmitting}
                        className="btn bg-red-500 hover:bg-red-600 text-white py-1.5 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </div>
            </div>
        </div >
    );
};
