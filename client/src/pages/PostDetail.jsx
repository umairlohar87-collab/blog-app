import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
// import { useAuth } from '../context/AuthContext';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');

  const loadPost = () => api.get(`/posts/${id}`).then(({ data }) => setPost(data));
  useEffect(() => { loadPost(); }, [id]);

  const addComment = async (e) => {
    e.preventDefault();
    await api.post(`/posts/${id}/comments`, { content: comment });
    setComment('');
    loadPost();
  };

  const deleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    await api.delete(`/comments/${commentId}`);
    loadPost();
  };

  if (!post) return <p className="p-4">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <p className="text-gray-500 mb-4">by {post.author_name} · {new Date(post.created_at).toLocaleDateString()}</p>
      {post.cover_image && <img src={post.cover_image} alt="" className="w-full rounded mb-4" />}
      <div className="prose mb-8 whitespace-pre-wrap">{post.content}</div>

      <h2 className="text-xl font-semibold mb-2">Comments ({post.comments?.length || 0})</h2>
      {user && (
        <form onSubmit={addComment} className="mb-4">
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-2 border rounded" placeholder="Write a comment..." required />
          <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Post Comment</button>
        </form>
      )}
      {post.comments?.map((c) => (
        <div key={c.id} className="border-t py-2 flex justify-between">
          <div>
            <strong>{c.author_name}</strong>
            <p>{c.content}</p>
          </div>
          {user?.id === c.user_id && (
            <button onClick={() => deleteComment(c.id)} className="text-red-500 text-sm">Delete</button>
          )}
        </div>
      ))}
    </div>
  );
}