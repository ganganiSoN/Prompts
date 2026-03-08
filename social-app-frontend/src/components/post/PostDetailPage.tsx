import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostById } from '../../api/posts';
import { PostCard } from './PostCard';
import { ArrowLeft } from 'lucide-react';

export const PostDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        const fetchPost = async () => {
            try {
                setLoading(true);
                const data = await getPostById(id);
                setPost(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch post');
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    return (
        <div className="max-w-2xl mx-auto p-4 w-full animate-fade-in">
            <button 
                onClick={() => navigate(-1)}
                className="btn btn-outline flex items-center gap-2 mb-6"
                style={{ padding: '0.5rem 1rem', width: 'auto' }}
            >
                <ArrowLeft size={18} />
                <span>Back</span>
            </button>

            {loading ? (
                <div className="text-center text-gray-400 py-10">Loading post...</div>
            ) : error ? (
                <div className="text-center text-red-400 py-10 glass-card">{error}</div>
            ) : post ? (
                <PostCard post={post} />
            ) : (
                <div className="text-center text-gray-400 py-10">Post not found</div>
            )}
        </div>
    );
};

export default PostDetailPage;
