import React, { useEffect, useState } from 'react';
import { getCreatorAnalytics } from '../../api/analytics';
import { getAccessHistory, getAuditLogs, exportUserData, deleteAccount } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Database, Activity, Users, Star, TrendingUp, Calendar, Shield, Download, Trash2, FileJson, FileText, File as FileIcon, Clock, ShieldAlert, CheckSquare, Square, Lock } from 'lucide-react';
import '../analytics/AnalyticsPage.css';

export const DataPage: React.FC = () => {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'privacy'>('overview');

    // Overview Data
    const [data, setData] = useState<any>(null);

    // Privacy Data
    const [accessLogs, setAccessLogs] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    // Actions State
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        posts: true,
        comments: true,
        messages: true,
        profile: true,
        activity: true
    });

    // Deletion Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const { error: showError, success } = useToast();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [result, access, audit] = await Promise.all([
                    getCreatorAnalytics(),
                    getAccessHistory(),
                    getAuditLogs()
                ]);
                setData(result);
                setAccessLogs(access);
                setAuditLogs(audit);
            } catch (err: any) {
                showError(err.message || "Failed to load personal data.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [showError]);

    if (loading) {
        return (
            <div className="page-container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <div style={{ textAlign: 'center', opacity: 0.5 }}>
                    <Database size={48} style={{ color: 'var(--primary)', marginBottom: '1rem', margin: '0 auto' }} />
                    <div className="text-gray-400">Loading Personal Data...</div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', minHeight: '50vh' }}>
                No personal data available.
            </div>
        );
    }

    const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
        setExporting(true);
        try {
            const response = await exportUserData({ ...exportOptions, format });
            // The new backend endpoint returns 202 Accepted with a message when dispatching email
            success(response?.message || `Your data export request has been queued. You will receive an email shortly with the attached ${format.toUpperCase()} file.`);
        } catch (err: any) {
            showError(err.message || 'Failed to export data');
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            showError("Please enter your password to confirm deletion.");
            return;
        }
        setIsDeleting(true);
        try {
            await deleteAccount(deletePassword);
            success("Account and data completely deleted. Redirecting...");
            setTimeout(() => {
                logout();
            }, 2000);
        } catch (err: any) {
            showError(err.message || 'Failed to delete account');
            setIsDeleting(false);
        }
    };

    return (
        <div className="page-container animate-fade-in pb-10">
            <header className="page-header mb-6">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <Database className="text-indigo-400" size={28} />
                        My Data & Metrics
                    </h1>
                    <p className="page-subtitle mt-1">Review your personal platform activity and manage privacy.</p>
                </div>
            </header>

            {/* Custom Tabs */}
            <div className="data-tabs">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`data-tab ${activeTab === 'overview' ? 'active' : ''}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('privacy')}
                    className={`data-tab ${activeTab === 'privacy' ? 'active' : ''}`}
                >
                    <Shield size={16} /> Privacy & Security
                </button>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* Top Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="glass-card stat-card" style={{ marginBottom: '1rem' }}>
                            <div className="stat-icon primary">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="stat-label">Total Posts</p>
                                <h3 className="stat-value">
                                    {(data.overview?.totalPosts || 0).toLocaleString()}
                                </h3>
                            </div>
                        </div>

                        <div className="glass-card stat-card" style={{ marginBottom: '1rem' }}>
                            <div className="stat-icon success">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="stat-label">Total Engagement</p>
                                <h3 className="stat-value">
                                    {(data.overview?.totalEngagement || 0).toLocaleString()}
                                </h3>
                            </div>
                        </div>

                        <div className="glass-card stat-card" style={{ marginBottom: '1rem' }}>
                            <div className="stat-icon warning">
                                <Star size={24} />
                            </div>
                            <div>
                                <p className="stat-label">Engagement Rate</p>
                                <h3 className="stat-value">
                                    {data.overview?.engagementRate || 0}% <span>avg/post</span>
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Follower Growth Chart Area */}
                        <div className="glass-card chart-card flex flex-col" style={{ marginBottom: '1rem' }}>
                            <div className="chart-header">
                                <h2 className="chart-title text-gray-200">
                                    <TrendingUp className="text-emerald-400" size={20} /> Follower Growth
                                </h2>
                                <span className="chart-badge bg-gray-800 text-gray-400">Last 30 Days</span>
                            </div>

                            <div className="list-container flex-1" style={{ minHeight: '200px' }}>
                                {data.followerGrowth.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-500 py-10">No new followers in the last 30 days.</div>
                                ) : (
                                    <div className="space-y-4 pt-4">
                                        {data.followerGrowth.map((day: any, idx: number) => {
                                            // Visual bar calculation
                                            const maxGrowth = Math.max(...data.followerGrowth.map((d: any) => d.count));
                                            const percent = (day.count / maxGrowth) * 100;

                                            // Formatting date nicely
                                            const dateObj = new Date(day._id);
                                            const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                                            return (
                                                <div key={idx} className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-xs text-gray-400">
                                                        <span>{formattedDate}</span>
                                                        <span className="text-emerald-400 font-medium">+{day.count}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-800 rounded-full h-2">
                                                        <div
                                                            className="bg-emerald-500 h-2 rounded-full"
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Performing Posts Area */}
                        <div className="glass-card chart-card flex flex-col" style={{ marginBottom: '1rem' }}>
                            <div className="chart-header">
                                <h2 className="chart-title text-gray-200">
                                    <Star className="text-yellow-400" size={20} /> Top Performing Posts
                                </h2>
                                <span className="chart-badge bg-gray-800 text-gray-400">By Engagement</span>
                            </div>

                            <div className="list-container flex-1">
                                {data.topPosts.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-500 py-10">You haven't posted anything yet!</div>
                                ) : (
                                    <div className="space-y-3 pt-2">
                                        {data.topPosts.map((post: any, idx: number) => {
                                            const totalInteractions = post.engagementCount.likes + post.engagementCount.comments + post.engagementCount.reposts + post.engagementCount.bookmarks + post.engagementCount.shares;

                                            return (
                                                <div key={post._id} className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between hover:bg-white/10 transition">
                                                    <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30">
                                                            #{idx + 1}
                                                        </div>
                                                        <div className="overflow-hidden min-w-0 flex items-center gap-3">
                                                            {(post.type === 'image' || post.content?.startsWith('data:image') || post.content?.startsWith('http')) && post.content ? (
                                                                <img
                                                                    src={post.content}
                                                                    alt="Post Media"
                                                                    className="w-10 h-10 object-cover rounded border border-white/10 flex-shrink-0 bg-black/20"
                                                                />
                                                            ) : null}
                                                            <div className="overflow-hidden min-w-0">
                                                                <p className="text-sm text-gray-200 truncate">
                                                                    {(post.type === 'image' || post.content?.startsWith('data:image')) && post.content ? '[Media Post (image)]' : (post.content || `Media Post (${post.type})`)}
                                                                </p>
                                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Calendar size={10} /> {new Date(post.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 text-right ml-3">
                                                        <p className="text-indigo-400 font-bold text-sm">{totalInteractions}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase">Interactions</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in print-area">
                    {/* Left Column: Actions */}
                    <div className="space-y-6">
                        {/* Data Export Card */}
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2 mb-2">
                                <Download className="text-indigo-400" size={22} /> Data Export
                            </h2>
                            <p className="text-sm text-gray-400 mb-5">Select datasets and download a copy for offline access.</p>

                            <div className="export-checkbox-list">
                                {Object.entries({
                                    posts: 'All Posts',
                                    comments: 'Comments',
                                    messages: 'Messages',
                                    profile: 'Profile Data',
                                    activity: 'Activity Logs'
                                }).map(([key, label]) => (
                                    <div
                                        key={key}
                                        className="export-checkbox-item"
                                        onClick={() => setExportOptions(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                                    >
                                        <span className={`export-checkbox-icon ${exportOptions[key as keyof typeof exportOptions] ? 'active' : 'inactive'}`}>
                                            {exportOptions[key as keyof typeof exportOptions] ? (
                                                <CheckSquare size={18} />
                                            ) : (
                                                <Square size={18} />
                                            )}
                                        </span>
                                        {label}
                                    </div>
                                ))}
                            </div>

                            <div className="export-btn-container">
                                <button
                                    onClick={() => handleExport('json')}
                                    disabled={exporting}
                                    className="export-action-btn"
                                >
                                    <div className="btn-content">
                                        <FileJson size={18} className="export-checkbox-icon active" />
                                        <span>Send to Email (JSON)</span>
                                    </div>
                                    <Download size={16} className="btn-icon" />
                                </button>

                                <button
                                    onClick={() => handleExport('csv')}
                                    disabled={exporting}
                                    className="export-action-btn csv"
                                >
                                    <div className="btn-content">
                                        <FileText size={18} style={{ color: '#34d399' }} />
                                        <span>Send to Email (CSV)</span>
                                    </div>
                                    <Download size={16} className="btn-icon" />
                                </button>

                                <button
                                    onClick={() => handleExport('pdf')}
                                    disabled={exporting}
                                    className="export-action-btn pdf"
                                >
                                    <div className="btn-content">
                                        <FileIcon size={18} style={{ color: '#fb7185' }} />
                                        <span>Send to Email (PDF)</span>
                                    </div>
                                    <Download size={16} className="btn-icon" />
                                </button>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="danger-zone" style={{ marginBottom: '1rem' }}>
                            <h2 className="danger-title">
                                <ShieldAlert size={22} /> Danger Zone
                            </h2>
                            <p className="danger-text">Permanently delete your account and wipe all associated data. This action cannot be undone.</p>

                            {!showDeleteModal ? (
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="btn btn-danger"
                                >
                                    Request Data Deletion
                                </button>
                            ) : (
                                <div className="space-y-3 animate-fade-in p-4 bg-black/40 rounded-lg border border-red-500/20">
                                    <p className="text-xs text-red-300 font-medium">Please confirm your password to proceed.</p>
                                    <div className="relative my-3">
                                        <Lock className="absolute left-4 top-3.5 text-red-400 opacity-70" size={18} />
                                        <input
                                            type="password"
                                            placeholder="Enter password to confirm"
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            style={{
                                                width: '100%',
                                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: 'var(--text-main)',
                                                borderRadius: '0.75rem',
                                                padding: '0.875rem 1rem 0.875rem 3rem',
                                                fontSize: '0.95rem',
                                                outline: 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#ef4444';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.2)';
                                                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                                e.target.style.boxShadow = 'none';
                                                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                                            }}
                                        />
                                    </div>
                                    <div className="danger-modal-actions">
                                        <button
                                            onClick={() => setShowDeleteModal(false)}
                                            className="btn btn-outline flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={isDeleting}
                                            className="btn btn-danger flex-1"
                                        >
                                            <Trash2 size={16} />
                                            {isDeleting ? 'Erasing...' : 'Erase Account'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Logs */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Audit Logs */}
                        <div className="glass-card" style={{ marginBottom: '1rem' }}>
                            <div className="chart-header" style={{ marginBottom: '1rem' }}>
                                <h2 className="chart-title text-gray-200">
                                    <Shield className="text-indigo-400" size={20} /> Audit Logs
                                </h2>
                            </div>
                            <div className="data-table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th className="data-th">Action</th>
                                            <th className="data-th">Details</th>
                                            <th className="data-th">Date/Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogs.length === 0 ? (
                                            <tr><td colSpan={3} className="data-td text-center" style={{ color: 'var(--text-muted)' }}>No recent audit logs.</td></tr>
                                        ) : (
                                            auditLogs.map((log: any) => (
                                                <tr key={log._id} className="data-tr">
                                                    <td className="data-td" style={{ color: '#a5b4fc', fontWeight: 500 }}>{log.action.replace(/_/g, ' ')}</td>
                                                    <td className="data-td">{log.details || '-'}</td>
                                                    <td className="data-td-muted">{new Date(log.createdAt).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Access History */}
                        <div className="glass-card">
                            <div className="chart-header" style={{ marginBottom: '1rem' }}>
                                <h2 className="chart-title text-gray-200">
                                    <Clock className="text-emerald-400" size={20} /> Access History
                                </h2>
                            </div>
                            <div className="data-table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th className="data-th">Status</th>
                                            <th className="data-th">IP Address</th>
                                            <th className="data-th">Device/Browser</th>
                                            <th className="data-th">Date/Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accessLogs.length === 0 ? (
                                            <tr><td colSpan={4} className="data-td text-center" style={{ color: 'var(--text-muted)' }}>No recent access history.</td></tr>
                                        ) : (
                                            accessLogs.map((log: any) => (
                                                <tr key={log._id} className="data-tr">
                                                    <td className="data-td">
                                                        <span className={`status-badge ${log.status === 'SUCCESS' ? 'status-success' : 'status-error'}`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="data-td" style={{ fontFamily: 'monospace' }}>{log.ipAddress}</td>
                                                    <td className="data-td-muted" style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.userAgent}>
                                                        {log.userAgent}
                                                    </td>
                                                    <td className="data-td-muted">{new Date(log.createdAt).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
