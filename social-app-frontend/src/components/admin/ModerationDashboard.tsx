import { useState, useEffect } from 'react';
import { getReports, updateReport } from '../../api/moderation';
import { useToast } from '../../context/ToastContext';
import { Shield, CheckCircle, AlertTriangle, EyeOff, Ban, Clock, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const ModerationDashboard = () => {
    const { user } = useAuth();
    const { success, error: showError } = useToast();

    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Redirect non-admins/moderators
    if (user && user.role !== 'admin' && user.role !== 'moderator') {
        return <Navigate to="/" />;
    }

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getReports({ status: filter });
            setReports(data.reports || []);
        } catch (err: any) {
            showError(err.message || 'Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const handleAction = async (reportId: string, actionCategory: string, decision?: string) => {
        setProcessingId(reportId);
        try {
            let payload: any = {};

            if (actionCategory === 'DISMISS') {
                payload = { status: 'CLOSED', decision: 'DISMISSED' };
            } else if (actionCategory === 'RESOLVE') {
                payload = { status: 'CLOSED', decision: decision };
            } else if (actionCategory === 'REVIEW') {
                payload = { status: 'MODERATOR_REVIEW' };
            }

            await updateReport(reportId, payload);
            success(`Report updated successfully!`);
            fetchReports(); // Refresh the list
        } catch (err: any) {
            showError(err.message || 'Failed to update report');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUBMITTED':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">New</span>;
            case 'AUTO_RISK_SCORING':
            case 'MODERATOR_REVIEW':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 flex items-center gap-1"><Clock size={12} /> Under Review</span>;
            case 'ESCALATED':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Escalated</span>;
            case 'CLOSED':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Closed</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">{status}</span>;
        }
    };

    return (
        <div className="page-container max-w-5xl mx-auto animate-fade-in w-full">
            <header className="page-header mt-4 mb-6 flex justify-between items-end flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500/10 rounded-xl">
                        <Shield size={28} className="text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moderation Queue</h1>
                        <p className="text-sm text-gray-500">Review and action community reports.</p>
                    </div>
                </div>

                <div className="relative flex items-center gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="custom-select bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 py-2 pl-4 pr-10 cursor-pointer shadow-sm font-medium"
                    >
                        <option value="ALL">All Reports</option>
                        <option value="SUBMITTED">New</option>
                        <option value="AUTO_RISK_SCORING">Auto Risk Scoring</option>
                        <option value="MODERATOR_REVIEW">Under Review</option>
                        <option value="ESCALATED">Escalated</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDown size={16} />
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-red-500" size={32} />
                </div>
            ) : reports.length === 0 ? (
                <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">All clear!</h3>
                    <p className="text-gray-500 mt-2">There are currently no reports pending your review.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reports.map((report) => (
                        <div key={report._id} className="glass-card p-5 border-l-4 border-l-red-500 transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {getStatusBadge(report.status)}
                                        <span className="text-xs text-gray-400">
                                            Reported {new Date(report.createdAt).toLocaleDateString()}
                                        </span>
                                        {report.aiToxicityScore > 0.85 && (
                                            <span className="flex items-center gap-1 text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                                                <AlertTriangle size={12} /> High Toxicity ({Math.round(report.aiToxicityScore * 100)}%)
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        Reason: {report.reason}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Reported by <span className="font-medium text-indigo-500">@{report.reporter?.name || report.reporter?.email?.split('@')[0]}</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleAction(report._id, 'DISMISS')}
                                        disabled={processingId === report._id || report.status === 'CLOSED'}
                                        className="btn btn-outline text-xs py-1.5 px-3"
                                    >
                                        Dismiss
                                    </button>

                                    <div className="relative group">
                                        <button
                                            disabled={processingId === report._id || report.status === 'CLOSED'}
                                            className="btn text-xs py-1.5 px-3 bg-red-500 hover:bg-red-600 text-white flex items-center gap-1"
                                        >
                                            Take Action <ChevronDown size={14} />
                                        </button>
                                        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 hidden group-hover:block z-10">
                                            <button
                                                onClick={() => handleAction(report._id, 'RESOLVE', 'REMOVED')}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                            >
                                                <EyeOff size={14} /> Remove Post
                                            </button>
                                            <button
                                                onClick={() => handleAction(report._id, 'RESOLVE', 'USER_WARNED')}
                                                className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-2"
                                            >
                                                <AlertTriangle size={14} /> Warn User + Remove
                                            </button>
                                            <button
                                                onClick={() => handleAction(report._id, 'RESOLVE', 'USER_SUSPENDED')}
                                                className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 mt-1 pt-2"
                                            >
                                                <Ban size={14} /> Suspend Author
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Offending Content Preview */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Offending Content (ID: {report.post?._id})</p>
                                {report.post ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                                {report.post.author?.name?.[0] || report.post.author?.email?.[0] || '?'}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                @{report.post.author?.name || report.post.author?.email?.split('@')[0]}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3 overflow-hidden" dangerouslySetInnerHTML={{ __html: report.post.content }} />
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">This post has already been fully deleted from the database.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
