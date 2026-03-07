import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Search, TrendingUp, Hash, Flame, Filter, Calendar, Globe, ThumbsUp, X, Clock, Users } from 'lucide-react';
import { PostCard } from '../post/PostCard';
import { getExplore, getFeed } from '../../api/posts';
import { getUserSuggestions } from '../../api/users';

export const ExplorePage = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    
    // Explorable Suggested Content
    const [suggestedPosts, setSuggestedPosts] = useState<any[]>([]);
    const [loadingSuggested, setLoadingSuggested] = useState(false);
    
    // Suggested Profiles Grid
    const [suggestedProfiles, setSuggestedProfiles] = useState<any[]>([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);

    // New Advanced Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [timeRange, setTimeRange] = useState('all');
    const [language, setLanguage] = useState('all');
    const [minEngagement, setMinEngagement] = useState('0');

    // Recent Searches State
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
        const saved = localStorage.getItem('recentSearches');
        return saved ? JSON.parse(saved) : [];
    });

    const observer = useRef<IntersectionObserver | null>(null);
    const lastPostElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // Handle debounce for search and history saving
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setPage(1); // Reset page on new search
            setPosts([]); // Clear posts on new search
            setHasMore(true);

            // Save valid search to history
            const trimmedQuery = searchQuery.trim();
            if (trimmedQuery && !recentSearches.includes(trimmedQuery) && trimmedQuery.length > 2) {
                const updated = [trimmedQuery, ...recentSearches].slice(0, 5);
                setRecentSearches(updated);
                localStorage.setItem('recentSearches', JSON.stringify(updated));
            }
        }, 500);

        return () => clearTimeout(timerId);
    }, [searchQuery]);

    const removeRecentSearch = (search: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = recentSearches.filter(s => s !== search);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const fetchSuggestedPosts = async () => {
        try {
            setLoadingSuggested(true);
            setLoadingProfiles(true);
            const [postData, profileData] = await Promise.all([
                getFeed(1, 4).catch(() => []),
                getUserSuggestions().catch(() => [])
            ]);
            setSuggestedPosts(postData);
            setSuggestedProfiles(profileData.slice(0, 5)); // Grab top 5 profiles
        } catch (error) {
            console.error('Failed to fetch suggested content:', error);
        } finally {
            setLoadingSuggested(false);
            setLoadingProfiles(false);
        }
    };

    const fetchExplorePosts = async (pageNum: number, search: string, tRange: string, lang: string, minEng: string) => {
        try {
            setLoading(true);
            const data = await getExplore(pageNum, 10, {
                search,
                timeRange: tRange,
                language: lang,
                minEngagement: minEng
            });
            
            setPosts(prev => {
                if (pageNum === 1) return data;
                // Append without duplicates
                const existingIds = new Set(prev.map(p => p._id));
                const newPosts = data.filter((p: any) => !existingIds.has(p._id));
                return [...prev, ...newPosts];
            });
            
            setHasMore(data.length === 10);

            // Fetch explorable content if no exact results were found
            if (pageNum === 1 && data.length === 0) {
                fetchSuggestedPosts();
            } else if (pageNum === 1 && data.length > 0) {
                setSuggestedPosts([]); // Clear suggestions if we have genuine results
                setSuggestedProfiles([]);
            }
        } catch (error) {
            console.error('Failed to fetch explore posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExplorePosts(page, debouncedQuery, timeRange, language, minEngagement);
    }, [page, debouncedQuery, timeRange, language, minEngagement]);

    // When filters change, reset back to page 1
    useEffect(() => {
        setPage(1);
        setPosts([]);
        setHasMore(true);
    }, [timeRange, language, minEngagement]);

    return (
        <div className="page-container animate-fade-in pb-12">
            <header className="page-header mb-8">
                <h1 className="page-title m-0 flex items-center gap-3">
                    <TrendingUp size={28} className="text-[#8b5cf6]" />
                    Explore
                </h1>
                <p className="text-gray-400 mt-2">Discover trending discussions and search across all communities</p>
            </header>

            {/* Premium Search Bar */}
            <div 
                className="glass-card" 
                style={{ 
                    padding: '0.75rem 1rem', 
                    marginBottom: '1.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    position: 'relative',
                    zIndex: 40
                }}
            >
                <div style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                    <Search size={22} color="#a78bfa" />
                </div>
                <input 
                    type="text" 
                    placeholder="Search posts, topics..."
                    style={{ 
                        flex: 1, 
                        background: 'transparent', 
                        border: 'none', 
                        outline: 'none', 
                        color: 'white', 
                        fontSize: '1.05rem',
                        fontWeight: 500,
                        width: '100%'
                    }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                />
                {searchQuery && (
                    <div style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        <Flame size={12}/> Searching
                    </div>
                )}
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')} 
                        style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', padding: '0.5rem' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                    >
                        <X size={18} />
                    </button>
                )}
                
                {/* Clean Filter Button */}
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ 
                        background: showFilters ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)', 
                        color: showFilters ? '#c4b5fd' : '#94a3b8',
                        border: showFilters ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '0.6rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Filter size={20} />
                </button>

                {/* Recent Searches Overlay Component */}
                {isSearchFocused && !searchQuery && recentSearches.length > 0 && (
                    <div 
                        className="glass-card"
                        style={{ 
                            position: 'absolute', 
                            top: 'calc(100% + 10px)', 
                            left: 0, 
                            right: 0, 
                            padding: 0, 
                            zIndex: 50,
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a78bfa', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                                <Clock size={14} /> Recent Searches
                            </span>
                            <button 
                                onMouseDown={(e) => { e.preventDefault(); setRecentSearches([]); localStorage.removeItem('recentSearches'); }}
                                style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 'bold', background: 'transparent', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#a78bfa'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#818cf8'}
                            >
                                Clear
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {recentSearches.map(search => (
                                <div 
                                    key={search} 
                                    style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background-color 0.2s' }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setSearchQuery(search);
                                        setIsSearchFocused(false);
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#d1d5db' }}>
                                        <div style={{ padding: '0.4rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex' }}>
                                            <Search size={14} color="#9ca3af" />
                                        </div>
                                        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{search}</span>
                                    </div>
                                    <button 
                                        style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}
                                        onMouseDown={(e) => removeRecentSearch(search, e)}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div 
                    className="glass-card"
                    style={{ 
                        marginBottom: '2rem', 
                        marginTop: '-0.5rem', 
                        zIndex: 10,
                        padding: '1.5rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1.5rem'
                    }}
                >
                        {/* Date Range Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                                <Calendar size={15} color="#a78bfa"/> 
                                DATE RANGE
                            </label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    value={timeRange} 
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    style={{ width: '100%', appearance: 'none', padding: '0.85rem 1rem', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', backgroundColor: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', outline: 'none', colorScheme: 'dark' }}
                                >
                                    <option value="all">🌍 All Time</option>
                                    <option value="24h">⏱️ Past 24 Hours</option>
                                    <option value="7d">📅 Past 7 Days</option>
                                    <option value="30d">📆 Past 30 Days</option>
                                </select>
                                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', color: '#9ca3af' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </div>
                            </div>
                        </div>

                        {/* Language Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                                <Globe size={15} color="#a78bfa"/> 
                                LANGUAGE
                            </label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    value={language} 
                                    onChange={(e) => setLanguage(e.target.value)}
                                    style={{ width: '100%', appearance: 'none', padding: '0.85rem 1rem', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', backgroundColor: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', outline: 'none', colorScheme: 'dark' }}
                                >
                                    <option value="all">🌐 Every Language</option>
                                    <option value="en">🇺🇸 English</option>
                                    <option value="es">🇪🇸 Spanish</option>
                                    <option value="fr">🇫🇷 French</option>
                                </select>
                                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', color: '#9ca3af' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </div>
                            </div>
                        </div>

                        {/* Engagement Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                                <ThumbsUp size={15} color="#a78bfa"/> 
                                ENGAGEMENT
                            </label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    value={minEngagement} 
                                    onChange={(e) => setMinEngagement(e.target.value)}
                                    style={{ width: '100%', appearance: 'none', padding: '0.85rem 1rem', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', backgroundColor: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', outline: 'none', colorScheme: 'dark' }}
                                >
                                    <option value="0">🎯 Any Amount</option>
                                    <option value="10">⚡ 10+ Interactions</option>
                                    <option value="50">🔥 50+ Interactions</option>
                                    <option value="100">🚀 100+ Interactions</option>
                                </select>
                                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', color: '#9ca3af' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </div>
                            </div>
                        </div>
                </div>
            )}

            {/* Trending Tags Section (Visual Polish) */}
            {!debouncedQuery && posts.length > 0 && page === 1 && (
                <div className="mb-8 flex gap-3 overflow-x-auto pb-2 scrollbar-none fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {['technology', 'design', 'development', 'startup', 'web3'].map((tag) => (
                        <button 
                            key={tag}
                            onClick={() => setSearchQuery(tag)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900/40 hover:bg-gray-800/80 rounded-xl text-gray-300 hover:text-white transition-all whitespace-nowrap border border-gray-800 hover:border-gray-700 active:scale-95"
                        >
                            <Hash size={14} className="text-[#c4b5fd]" />
                            <span className="font-medium">{tag}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Posts Feed Grid */}
            <div className="feed-content space-y-6">
                {posts.map((post: any, index: number) => {
                    const isLast = index === posts.length - 1;
                    return (
                        <div key={post._id} ref={isLast ? lastPostElementRef : null} className="fade-in-up" style={{ animationDelay: `${(index % 5) * 0.1}s` }}>
                            <PostCard post={post} />
                        </div>
                    );
                })}

                {loading && (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-[#8b5cf6]" size={32} />
                    </div>
                )}

                {!hasMore && posts.length > 0 && (
                    <div className="text-center p-8 text-gray-500 font-medium">
                        You've reached the end of the explore feed
                    </div>
                )}

                {!loading && posts.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', animation: 'fadeIn 0.4s ease-out' }}>
                        {/* Empty State Message */}
                        <div 
                            className="glass-card" 
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                padding: '4rem 2rem', 
                                textAlign: 'center', 
                                borderStyle: 'dashed',
                                borderColor: 'rgba(255,255,255,0.1)',
                                marginTop: '1rem'
                            }}
                        >
                            <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', backgroundColor: 'rgba(30, 41, 59, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: '#6b7280' }}>
                                <Search size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 0.5rem 0' }}>No results found</h3>
                            <p style={{ color: '#9ca3af', margin: 0, fontSize: '1.05rem' }}>Try adjusting your search terms or explore trending topics below.</p>
                        </div>

                        {/* Explorable Content from Feed */}
                        {loadingSuggested ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                <Loader2 className="animate-spin" style={{ color: '#8b5cf6' }} size={28} />
                            </div>
                        ) : suggestedPosts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.75rem', background: 'linear-gradient(to right, rgba(245, 158, 11, 0.1), rgba(15, 23, 42, 0.4), transparent)', borderRadius: '1rem', borderLeft: '4px solid #f59e0b', marginBottom: '0.5rem' }}>
                                    <div style={{ padding: '0.6rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))', borderRadius: '0.75rem', boxShadow: '0 0 15px rgba(245, 158, 11, 0.15)' }}>
                                        <Flame size={26} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))' }} />
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #ffffff, #fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>Suggested for you</h2>
                                </div>
                                <div className="space-y-6">
                                    {suggestedPosts.map((post: any, i: number) => (
                                        <div key={post._id} style={{ animation: 'fadeIn 0.5s ease-out', animationFillMode: 'both', animationDelay: `${i * 0.1}s` }}>
                                            <PostCard post={post} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Suggested Profiles Grid */}
                        {loadingProfiles ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                <Loader2 className="animate-spin" style={{ color: '#8b5cf6' }} size={28} />
                            </div>
                        ) : suggestedProfiles.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem', paddingBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.75rem', background: 'linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(15, 23, 42, 0.4), transparent)', borderRadius: '1rem', borderLeft: '4px solid #8b5cf6', marginBottom: '0.5rem' }}>
                                    <div style={{ padding: '0.6rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(99, 102, 241, 0.15))', borderRadius: '0.75rem', boxShadow: '0 0 15px rgba(139, 92, 246, 0.15)' }}>
                                        <Users size={26} color="#c4b5fd" style={{ filter: 'drop-shadow(0 0 8px rgba(196, 181, 253, 0.5))' }} />
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #ffffff, #e0e7ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>People to follow</h2>
                                </div>
                                <div style={{ display: 'flex', overflowX: 'auto', gap: '1rem', paddingBottom: '1rem', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }} className="scrollbar-none">
                                    {suggestedProfiles.map((profile: any, i: number) => (
                                        <div 
                                            key={profile._id} 
                                            className="glass-card group"
                                            style={{ 
                                                minWidth: '180px', 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                alignItems: 'center', 
                                                padding: '1.5rem', 
                                                textAlign: 'center', 
                                                gap: '1rem', 
                                                animation: 'fadeIn 0.5s ease-out', 
                                                animationFillMode: 'both', 
                                                animationDelay: `${i * 0.1}s`,
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                                                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
                                            }}
                                        >
                                            <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '1.5rem', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800, color: 'white', boxShadow: '0 8px 20px rgba(139, 92, 246, 0.25)', transition: 'transform 0.3s ease' }} className="group-hover:scale-110">
                                                {profile.email?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                                    {profile.email?.split('@')[0]}
                                                </h4>
                                                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>
                                                    @{profile.email?.split('@')[0]}
                                                </p>
                                            </div>
                                            <button style={{ width: '100%', padding: '0.5rem 0', marginTop: '0.5rem', background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#8b5cf6'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'; e.currentTarget.style.color = '#c4b5fd'; }}>
                                                Follow
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
};
