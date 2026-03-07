import React, { useEffect, useState } from 'react';
import { getAdminAnalytics, type AdminAnalyticsData } from '../../api/analytics';
import { useToast } from '../../context/ToastContext';
import { BarChart2, ShieldAlert, Activity, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import './AnalyticsPage.css';

export const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<AdminAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const { error: showError } = useToast();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const result = await getAdminAnalytics();
                setData(result);
            } catch (err: any) {
                showError(err.message || "Failed to load admin analytics.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [showError]);

    if (loading) {
        return (
            <div className="analytics-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', opacity: 0.5 }}>
                    <BarChart2 size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                    <div>Loading System Analytics...</div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="analytics-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No numeric data available.
            </div>
        );
    }

    return (
        <div className="analytics-page">
            <div className="analytics-container">

                {/* Header */}
                <div className="analytics-header">
                    <div>
                        <h1 className="analytics-title">
                            <BarChart2 /> System Analytics
                        </h1>
                        <p className="analytics-subtitle">
                            Global platform health and moderation engagement metrics.
                        </p>
                    </div>
                </div>

                {/* Top Metrics Row */}
                <div className="stats-grid">
                    <div className="glass-card stat-card">
                        <div className="stat-icon primary">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="stat-label">Active Users (30d)</p>
                            <h3 className="stat-value">
                                {data.activeUsers.toLocaleString()}
                            </h3>
                        </div>
                    </div>

                    <div className="glass-card stat-card">
                        <div className="stat-icon danger">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <p className="stat-label">Flagged Content Ratio</p>
                            <h3 className="stat-value">
                                {data.flaggedContentRatio}%
                            </h3>
                        </div>
                    </div>

                    <div className="glass-card stat-card">
                        <div className="stat-icon warning">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="stat-label">Moderation SLA</p>
                            <h3 className="stat-value">
                                {data.moderationSLAHours} <span>hours avg</span>
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Bottom Charts Row */}
                <div className="charts-grid">

                    {/* Trending Topics (Communities) */}
                    <div className="glass-card chart-card">
                        <div className="chart-header">
                            <h2 className="chart-title">
                                <TrendingUp className="success" size={20} /> Trending Communities
                            </h2>
                            <span className="chart-badge">Last 30 Days</span>
                        </div>

                        <div className="list-container">
                            {data.trendingTopics.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No trending data available</div>
                            ) : (
                                data.trendingTopics.map((topic, idx) => (
                                    <div key={idx} className="list-item">
                                        <div className="item-left">
                                            <div className="rank-badge">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <p className="item-name">{topic._id}</p>
                                                <p className="item-subtext">{topic.postCount} recent posts</p>
                                            </div>
                                        </div>
                                        <div className="item-right">
                                            <p className="item-value">
                                                {topic.totalEngagement.toLocaleString()}
                                            </p>
                                            <p className="item-value-subtext">interactions</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Abuse Metrics */}
                    <div className="glass-card chart-card">
                        <div className="chart-header">
                            <h2 className="chart-title">
                                <AlertTriangle className="danger" size={20} /> Abuse Vectors
                            </h2>
                            <span className="chart-badge">All Time</span>
                        </div>

                        <div className="list-container" style={{ textTransform: 'uppercase' }}>
                            {data.abuseMetrics.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', textTransform: 'none' }}>No abuse reports found!</div>
                            ) : (
                                data.abuseMetrics.map((item, idx) => {
                                    // Calculate simple percentage width for basic bar graph
                                    const maxCount = data.abuseMetrics[0].count; // Array is sorted desc
                                    const percent = (item.count / maxCount) * 100;

                                    return (
                                        <div key={idx} className="progress-item">
                                            <div className="progress-header">
                                                <span>{item._id}</span>
                                                <span>{item.count}</span>
                                            </div>
                                            <div className="progress-track">
                                                <div
                                                    className="progress-bar"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
