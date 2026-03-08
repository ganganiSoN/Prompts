import { CreatePost } from './CreatePost';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft } from 'lucide-react';

export const CreatePostPage = () => {
    const navigate = useNavigate();
    const { success } = useToast();

    const handlePostCreated = () => {
        success('Post created successfully!');
        // Navigate back to the home feed after a brief delay
        setTimeout(() => {
            navigate('/');
        }, 500);
    };

    return (
        <div className="page-container animate-fade-in max-w-3xl mx-auto">
            <header className="page-header mt-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="icon-btn group"
                        title="Go back"
                    >
                        <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="page-title text-2xl m-0">Create New Post</h1>
                        <p className="page-subtitle m-0 mt-1">Share something with the community</p>
                    </div>
                </div>
            </header>

            <div className="mt-8">
                {/* We re-use the powerful CreatePost component but now it's in its own dedicated page */}
                <CreatePost onPostCreated={handlePostCreated} />
            </div>
        </div>
    );
};
