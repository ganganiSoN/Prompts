import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, createModerator } from '../../api/users';
import { Search, Shield, User as UserIcon, Calendar, ArrowUpRight, UserPlus, X } from 'lucide-react';
import type { User } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../user/UserSuggestion.css';

const UsersPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('createdAt_desc');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Moderator Creation Modal State
    const [showModeratorModal, setShowModeratorModal] = useState(false);
    const [modEmail, setModEmail] = useState('');
    const [modName, setModName] = useState('');
    const [modPassword, setModPassword] = useState('');
    const [modCreating, setModCreating] = useState(false);

    const observer = useRef<IntersectionObserver | null>(null);
    const { error: showError, success } = useToast();

    const handleCreateModerator = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setModCreating(true);
            await createModerator({ email: modEmail, name: modName, password: modPassword });
            success('Moderator created successfully!');
            setShowModeratorModal(false);
            setModEmail('');
            setModName('');
            setModPassword('');

            // Refresh list
            setPage(1);
            setUsers([]);
        } catch (err: any) {
            showError(err.message || 'Failed to create moderator');
        } finally {
            setModCreating(false);
        }
    };

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(prev => {
                if (prev !== search) {
                    setPage(1);
                    setUsers([]);
                    return search;
                }
                return prev;
            });
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSort(e.target.value);
        setPage(1);
        setUsers([]);
    };

    useEffect(() => {
        let isMounted = true;

        const loadUsers = async () => {
            try {
                setLoading(true);
                const data = await getUsers(page, 15, debouncedSearch, sort);
                if (!isMounted) return;

                setUsers(prev => {
                    if (page === 1) return data.users;
                    const existingEmails = new Set(prev.map(u => u.email));
                    const newUsers = data.users.filter((u: User) => !existingEmails.has(u.email));
                    return [...prev, ...newUsers];
                });
                setHasMore(page < data.totalPages);
            } catch (err: any) {
                if (isMounted) showError(err.message || 'Failed to fetch users');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadUsers();

        return () => {
            isMounted = false;
        };
    }, [page, debouncedSearch, sort, showError]);

    const loadingRef = useRef(loading);
    useEffect(() => { loadingRef.current = loading; }, [loading]);

    const hasMoreRef = useRef(hasMore);
    useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

    const lastUserElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loadingRef.current) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
                setPage(prevPage => prevPage + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, []);

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header mb-6 flex justify-between items-start">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <Shield className="text-indigo-400" size={28} />
                        Admin Directory
                    </h1>
                    <p className="page-subtitle mt-1">Manage platform users and privileges</p>
                </div>
                <button
                    onClick={() => setShowModeratorModal(true)}
                    className="btn btn-primary flex items-center gap-2"
                    style={{ padding: '0.5rem 1rem', width: 'auto', minHeight: 'auto' }}
                >
                    <UserPlus size={18} />
                    <span>Create Moderator</span>
                </button>
            </header>

            <div className="glass-card mb-6 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="input-group m-0 flex-1 w-full relative">
                    <Search className="input-icon" size={18} style={{ top: '1rem' }} />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="input-field"
                        style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-sm text-gray-400 whitespace-nowrap">Sort by:</span>
                    <select
                        className="input-field bg-gray-900 m-0"
                        style={{ padding: '0.6rem 1rem', marginBottom: 0, minWidth: '150px' }}
                        value={sort}
                        onChange={handleSortChange}
                    >
                        <option value="createdAt_desc" className="bg-gray-900 text-white">Newest First</option>
                        <option value="createdAt_asc" className="bg-gray-900 text-white">Oldest First</option>
                        <option value="name_asc" className="bg-gray-900 text-white">Name (A-Z)</option>
                        <option value="name_desc" className="bg-gray-900 text-white">Name (Z-A)</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {users.map((user, index) => {
                    const isLast = index === users.length - 1;
                    return (
                        <div
                            key={user.email + index}
                            ref={isLast ? lastUserElementRef : null}
                            className="suggestion-card hover:bg-white/5"
                        >
                            <div className="suggestion-content">
                                <div className="suggestion-avatar">
                                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div className="suggestion-info">
                                    <h4 className="suggestion-name flex items-center gap-2">
                                        {user.name}
                                        {user.role === 'admin' && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">Admin</span>}
                                        {user.role === 'moderator' && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">Mod</span>}
                                    </h4>
                                    <div className="suggestion-stats text-gray-400 flex items-center gap-2 mt-1">
                                        <span className="truncate">{user.email}</span>
                                        <span>&bull;</span>
                                        <Calendar size={12} className="text-indigo-400" />
                                        <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                    {user.interests && user.interests.length > 0 && (
                                        <div className="flex gap-1 mt-2">
                                            {user.interests.slice(0, 3).map((interest: string, i: number) => (
                                                <span key={i} className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                                    {interest}
                                                </span>
                                            ))}
                                            {user.interests.length > 3 && (
                                                <span className="text-xs px-1 text-gray-500">+{user.interests.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/users/${(user as any)._id}`)}
                                className="btn btn-outline text-xs px-3 py-1 rounded-lg"
                                style={{ width: 'auto', minHeight: 'auto' }}
                            >
                                Manage <ArrowUpRight size={14} />
                            </button>
                        </div>
                    );
                })}

                {loading && (
                    <div className="flex justify-center p-6">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!hasMore && users.length > 0 && (
                    <p className="text-center text-gray-500 text-sm py-4">You've reached the end of the directory.</p>
                )}

                {!loading && users.length === 0 && (
                    <div className="glass-card text-center py-12">
                        <UserIcon size={48} className="mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-300">No users found</h3>
                        <p className="text-gray-500 mt-1">Try adjusting your search criteria</p>
                    </div>
                )}
            </div>
            {showModeratorModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">Create Moderator Account</h3>
                            <button onClick={() => setShowModeratorModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mb-6">Create a new moderator account with advanced privileges to review and manage reported content.</p>

                        <form onSubmit={handleCreateModerator} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    placeholder="Moderator Name"
                                    value={modName}
                                    onChange={(e) => setModName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="input-field"
                                    placeholder="moderator@example.com"
                                    value={modEmail}
                                    onChange={(e) => setModEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Initial Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    className="input-field"
                                    placeholder="Minimum 8 characters"
                                    value={modPassword}
                                    onChange={(e) => setModPassword(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModeratorModal(false)}
                                    className="btn btn-outline"
                                    disabled={modCreating}
                                    style={{ width: 'auto', padding: '0.6rem 1.2rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={modCreating}
                                    style={{ width: 'auto', padding: '0.6rem 1.2rem' }}
                                >
                                    {modCreating ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
