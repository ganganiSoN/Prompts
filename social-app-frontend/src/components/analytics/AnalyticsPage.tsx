import { useState, useEffect } from 'react';
import { getCreatorAnalytics } from '../../api/analytics';
import { Loader2, Users, Heart, MessageCircle, Share2, Bookmark, BarChart2, MousePointerClick, ArrowUpRight, ChevronDown, Check, LayoutDashboard, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

type Tab = 'account' | 'post';

export const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('account');
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [isPostSelectorOpen, setIsPostSelectorOpen] = useState(false);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const result = await getCreatorAnalytics();
                setData(result);
            } catch (err: any) {
                console.error('Failed to load analytics', err);
                setErrorMsg(err?.message || 'Unknown network error');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem 0' }}>
                <Loader2 style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} size={48} />
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: '#f87171' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Failed to load analytics data</h2>
                <code style={{ background: '#0f172a', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem', display: 'block', margin: '1rem auto', maxWidth: '600px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{errorMsg}</code>
            </div>
        );
    }

    // --- MACRO VIEW (ACCOUNT) DATA ---
    const totalEngagement = data.overview?.totalEngagement || 0;
    const avgEngagementRate = data.overview?.engagementRate || 0;
    
    const followerGrowthTotal = data.followerGrowth?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0;
    const globalReach = Math.floor(totalEngagement * 3.8);

    const followerGrowthData = data.followerGrowth?.map((item: any) => ({
        date: item._id,
        followers: item.count
    })) || [{date: 'N/A', followers: 0}];

    // Mock Demographics
    const demographicsData = [
        { name: '18-24', value: 35, color: '#8b5cf6' },
        { name: '25-34', value: 45, color: '#ec4899' },
        { name: '35-44', value: 15, color: '#3b82f6' },
        { name: '45+', value: 5, color: '#14b8a6' },
    ];

    // Heatmap formatting
    const heatmapFormatted = Array.from({ length: 7 }, (_, d) => 
        Array.from({ length: 24 }, (_, h) => {
            const found = data.heatmapData?.find((item: any) => item.day === d + 1 && item.hour === h);
            return found ? found.totalEngagement : 0;
        })
    );
    const maxHeat = Math.max(...heatmapFormatted.flat(), 1);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // --- MICRO VIEW (POST) DATA GEN ---
    const generatePostData = (post: any) => {
        const seed = post ? (post.engagementCount?.likes + post.engagementCount?.comments + post.engagementCount?.shares) : 1500;
        const uReach = Math.max(Math.floor(seed * 4.2), 1);
        const fViews = Math.floor(uReach * 0.6);
        const nfViews = uReach - fViews;
        
        return {
            reach: uReach,
            likes: post?.engagementCount?.likes || Math.floor(seed * 0.65),
            comments: post?.engagementCount?.comments || Math.floor(seed * 0.15),
            shares: post?.engagementCount?.shares || Math.floor(seed * 0.12),
            saves: post?.engagementCount?.bookmarks || Math.floor(seed * 0.08),
            followersReached: fViews,
            nonFollowersReached: nfViews,
            discoveryData: [
                { name: 'Reach', Followers: fViews, 'Non-Followers': nfViews }
            ],
            retention: [
                { sec: '0s', val: 100 }, { sec: '3s', val: 65 }, { sec: '5s', val: 55 },
                { sec: '10s', val: 40 }, { sec: '15s', val: 32 }, { sec: '30s', val: 20 }
            ],
            conversions: {
                profile: Math.floor(uReach * 0.045),
                follows: Math.floor(uReach * 0.012),
                clicks: Math.floor(uReach * 0.008)
            }
        };
    };

    const currentPostData = selectedPost ? generatePostData(selectedPost) : null;
    const topPostsList = data.topPosts || [];

    // Sparkline Component
    const Sparkline = ({ dataKey }: { dataKey: string }) => (
        <div style={{ width: '100%', height: '40px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={followerGrowthData}>
                    <Line type="monotone" dataKey={dataKey} stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    // Custom Tooltip for Charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', padding: '0.75rem', borderRadius: '0.5rem', color: '#fff', fontSize: '0.875rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{label || payload[0].name}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }}></div>
                            <span style={{ color: '#cbd5e1' }}>{entry.name}:</span>
                            <span style={{ fontWeight: 'bold' }}>{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem', animation: 'fadeIn 0.4s ease-out' }}>
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '2rem', fontWeight: 700 }}>
                            <BarChart2 size={28} color="#8b5cf6" />
                            Analytics Dashboard
                        </h1>
                        <p style={{ color: '#9ca3af', marginTop: '0.5rem', margin: 0 }}>Understand your account growth and post performance.</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #1e293b' }}>
                    <button 
                        onClick={() => setActiveTab('account')}
                        style={{ 
                            background: 'transparent', border: 'none', borderBottom: activeTab === 'account' ? '2px solid #8b5cf6' : '2px solid transparent',
                            color: activeTab === 'account' ? '#fff' : '#9ca3af', padding: '0.75rem 1rem', fontSize: '1rem', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                        }}
                    >
                        <LayoutDashboard size={18} /> Account Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('post')}
                        style={{ 
                            background: 'transparent', border: 'none', borderBottom: activeTab === 'post' ? '2px solid #8b5cf6' : '2px solid transparent',
                            color: activeTab === 'post' ? '#fff' : '#9ca3af', padding: '0.75rem 1rem', fontSize: '1rem', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                        }}
                    >
                        <FileText size={18} /> Post Analysis
                    </button>
                </div>
            </header>

            {activeTab === 'account' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease' }}>
                    {/* Growth Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>30-Day Follower Growth</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginTop: '0.5rem' }}>+{followerGrowthTotal.toLocaleString()}</div>
                            <Sparkline dataKey="followers" />
                        </div>
                        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Reach (Est.)</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginTop: '0.5rem' }}>{globalReach.toLocaleString()}</div>
                            <Sparkline dataKey="followers" />
                        </div>
                        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Engagement Rate</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginTop: '0.5rem' }}>{avgEngagementRate}%</div>
                            <Sparkline dataKey="followers" />
                        </div>
                    </div>

                    {/* Audience Insights */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1rem', padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>Follower Demographics</h3>
                            <div style={{ width: '100%', height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={demographicsData} innerRadius={80} outerRadius={110} paddingAngle={2} dataKey="value">
                                            {demographicsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1rem', padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>Most Active Hours</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {days.map((day, dIdx) => (
                                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '30px', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'right' }}>{day}</div>
                                        <div style={{ display: 'flex', flex: 1, gap: '2px' }}>
                                            {heatmapFormatted[dIdx].map((val, hIdx) => {
                                                const opacity = val / maxHeat;
                                                return (
                                                    <div key={hIdx} title={`${day} ${hIdx}:00 - ${val} engagements`} style={{
                                                        flex: 1, height: '24px', borderRadius: '2px',
                                                        background: `rgba(139, 92, 246, ${Math.max(opacity, 0.05)})`,
                                                        cursor: 'pointer'
                                                    }} />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', paddingLeft: '38px', gap: '2px', marginTop: '4px' }}>
                                    {[0, 6, 12, 18, 23].map((h, i) => (
                                        <div key={h} style={{ flex: i === 0 || i === 4 ? 0 : 1, fontSize: '0.65rem', color: '#6b7280', textAlign: i === 0 ? 'left' : (i === 4 ? 'right' : 'center') }}>
                                            {h}h
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Content Feed */}
                    <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1rem', padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>Top Performing Posts</h3>
                        
                        {topPostsList.length === 0 ? (
                            <div style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>Not enough post data yet.</div>
                        ) : (
                            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                                {topPostsList.map((post: any, i: number) => (
                                    <div key={post._id} onClick={() => { setSelectedPost(post); setActiveTab('post'); }} style={{ minWidth: '250px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '0.75rem', border: '1px solid #1e293b', padding: '1rem', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.transform='translateY(-4px)'} onMouseOut={(e)=>e.currentTarget.style.transform='none'}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 'bold' }}>#{i + 1}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                <Heart size={12} /> {post.engagementCount?.likes || 0}
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.875rem', color: '#cbd5e1', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {post.content || 'Video/Image Post'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'post' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease' }}>
                    {/* Post Selector */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setIsPostSelectorOpen(!isPostSelectorOpen)} style={{ width: '100%', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '1rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', cursor: 'pointer', outline: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {selectedPost ? (
                                    <><div style={{ background: '#1e293b', padding: '0.5rem', borderRadius: '0.5rem' }}><FileText size={20} color="#8b5cf6" /></div>
                                    <span style={{ fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textAlign: 'left' }}>{selectedPost.content || `Post ID: ${selectedPost._id}`}</span></>
                                ) : (
                                    <span style={{ color: '#9ca3af', fontWeight: 500 }}>Select a post to analyze...</span>
                                )}
                            </div>
                            <ChevronDown size={20} style={{ transform: isPostSelectorOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#9ca3af' }} />
                        </button>

                        {isPostSelectorOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', background: '#0f172a', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '1rem', zIndex: 50, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                                {topPostsList.map((post: any) => (
                                    <div key={post._id} onClick={() => { setSelectedPost(post); setIsPostSelectorOpen(false); }} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }} className="hover:bg-gray-800">
                                        <div style={{ color: selectedPost?._id === post._id ? '#8b5cf6' : 'transparent' }}><Check size={18} /></div>
                                        <span style={{ color: '#cbd5e1', fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content || `Post from ${new Date(post.createdAt).toLocaleDateString()}`}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {!selectedPost ? (
                        <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px dashed #334155', borderRadius: '1rem', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                            <MousePointerClick size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <h3 style={{ fontSize: '1.25rem', color: 'white', margin: '0 0 0.5rem 0' }}>Select a post to see its impact</h3>
                            <p style={{ margin: 0 }}>Use the dropdown above to choose from your recent top-performing posts.</p>
                        </div>
                    ) : (
                        <>
                            {/* Discovery & Engagement */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                                {/* Discovery Stacked Bar */}
                                <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1rem', padding: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>Discovery (Reach: {currentPostData?.reach.toLocaleString()})</h3>
                                    <div style={{ width: '100%', height: '150px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={currentPostData?.discoveryData} layout="vertical" barSize={40}>
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" hide />
                                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}}/>
                                                <Legend verticalAlign="bottom"/>
                                                <Bar dataKey="Followers" stackId="a" fill="#3b82f6" radius={[4, 0, 0, 4]} />
                                                <Bar dataKey="Non-Followers" stackId="a" fill="#ec4899" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Engagement Grid */}
                                <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1rem', padding: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem', margin: '0 0 1.5rem 0' }}>Interactions</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <Heart size={24} color="#ef4444" />
                                            <div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>{currentPostData?.likes.toLocaleString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Likes</div>
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <MessageCircle size={24} color="#3b82f6" />
                                            <div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>{currentPostData?.comments.toLocaleString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Comments</div>
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <Share2 size={24} color="#22c55e" />
                                            <div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>{currentPostData?.shares.toLocaleString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Shares</div>
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <Bookmark size={24} color="#eab308" />
                                            <div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>{currentPostData?.saves.toLocaleString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Saves</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Viewer Retention Line Graph */}
                            <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1rem', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', margin: 0 }}>Viewer Retention (Watch Time)</h3>
                                    <div style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '9999px', fontWeight: 600 }}>
                                        3s Drop-off Marker
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={currentPostData?.retention} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <XAxis dataKey="sec" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line type="monotone" dataKey="val" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#1e293b', stroke: '#8b5cf6', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#8b5cf6' }} name="Retention %" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Conversion Actions Table */}
                            <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1rem', padding: '1.5rem', overflow: 'hidden' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>Conversion Actions</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid #1e293b' }}>
                                                <th style={{ padding: '0.75rem 0' }}>Action Metric</th>
                                                <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Total Clicks</th>
                                                <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Conv. Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e5e7eb', fontWeight: 500 }}><MousePointerClick size={16} color="#3b82f6"/> Profile Visits</td>
                                                <td style={{ padding: '1rem 0', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>{currentPostData?.conversions.profile.toLocaleString()}</td>
                                                <td style={{ padding: '1rem 0', textAlign: 'right', color: '#9ca3af' }}>{(((currentPostData?.conversions.profile || 0) / (currentPostData?.reach || 1)) * 100).toFixed(1)}%</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e5e7eb', fontWeight: 500 }}><Users size={16} color="#22c55e"/> New Follows</td>
                                                <td style={{ padding: '1rem 0', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>{currentPostData?.conversions.follows.toLocaleString()}</td>
                                                <td style={{ padding: '1rem 0', textAlign: 'right', color: '#9ca3af' }}>{(((currentPostData?.conversions.follows || 0) / (currentPostData?.reach || 1)) * 100).toFixed(1)}%</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e5e7eb', fontWeight: 500 }}><ArrowUpRight size={16} color="#ec4899"/> Link Clicks</td>
                                                <td style={{ padding: '1rem 0', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>{currentPostData?.conversions.clicks.toLocaleString()}</td>
                                                <td style={{ padding: '1rem 0', textAlign: 'right', color: '#9ca3af' }}>{(((currentPostData?.conversions.clicks || 0) / (currentPostData?.reach || 1)) * 100).toFixed(1)}%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
