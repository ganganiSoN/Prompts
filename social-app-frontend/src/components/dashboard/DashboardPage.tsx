import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Activity, CreditCard, ArrowUpRight } from 'lucide-react';

const DashboardPage = () => {
    const { user } = useAuth();

    const stats = [
        { title: 'Total Users', value: '1,234', change: '+12%', icon: <Users size={24} /> },
        { title: 'Active Sessions', value: '891', change: '+5%', icon: <Activity size={24} /> },
        { title: 'Server Load', value: '34%', change: '-2%', icon: <CreditCard size={24} /> },
    ];

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Welcome back, {user?.name}!</h1>
                    <p className="page-subtitle">Here's what's happening today.</p>
                </div>
                <button className="btn btn-primary create-btn">
                    <span>Create New</span>
                    <ArrowUpRight size={18} />
                </button>
            </header>

            <div className="stats-grid mt-6">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card glass-card">
                        <div className="stat-header">
                            <span className="stat-title">{stat.title}</span>
                            <div className="icon-wrapper">{stat.icon}</div>
                        </div>
                        <div className="stat-body mt-4">
                            <span className="stat-value">{stat.value}</span>
                            <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 glass-card dashboard-main">
                <h2>Recent Activity</h2>
                <div className="divider"></div>
                <div className="empty-state">
                    <Activity size={48} className="empty-icon" />
                    <p>No recent activity to display.</p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
