
// Mock Social Feature Service

export interface Post {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content?: string;
  imageUrl?: string;
  likes: string[];
  comments: any[];
  createdAt: Date;
}

export const getPosts = async (): Promise<Post[]> => {
  return [];
};

export const createPost = async (post: any): Promise<any> => {
  return { ...post, id: `post_${Date.now()}`, createdAt: new Date() };
};

export const toggleLike = async (postId: string, userId: string): Promise<void> => {
  console.log('Mock: Toggling like', { postId, userId });
};

export const addComment = async (postId: string, comment: any): Promise<any> => {
  return { ...comment, id: `comm_${Date.now()}`, createdAt: new Date() };
};

export default {
  getPosts,
  createPost,
  toggleLike,
  addComment
};
