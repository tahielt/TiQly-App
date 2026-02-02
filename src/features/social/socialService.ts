import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content?: string;
  imageUrl?: string;
  eventId?: string;
  eventTitle?: string;
  likes: string[];
  comments: Comment[];
  createdAt: Date;
}

const POSTS_KEY = '@tiqly_posts';

const getStoredPosts = async (): Promise<Post[]> => {
  try {
    const stored = await AsyncStorage.getItem(POSTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading posts:', error);
  }
  return getMockPosts();
};

const savePosts = async (posts: Post[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  } catch (error) {
    console.error('Error saving posts:', error);
  }
};

const getMockPosts = (): Post[] => [
  {
    id: 'post_1',
    userId: 'user_1',
    userName: 'María García',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    content: '¡Increíble noche en Lollapalooza! 🎤🔥',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600',
    eventId: 'event_1',
    eventTitle: 'Lollapalooza 2026',
    likes: ['user_2', 'user_3'],
    comments: [
      {
        id: 'comm_1',
        userId: 'user_2',
        userName: 'Juan Pérez',
        content: '¡Estuvo genial! 🙌',
        createdAt: new Date(Date.now() - 3600000),
      }
    ],
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'post_2',
    userId: 'user_2',
    userName: 'Juan Pérez',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    content: 'Ya tengo mi entrada para el festival de este finde! 🎟️',
    likes: ['user_1'],
    comments: [],
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'post_3',
    userId: 'user_3',
    userName: 'Ana López',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    content: 'Vendí mi ticket en 5 minutos, TiQly es increíble 💸',
    imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600',
    likes: ['user_1', 'user_2', 'user_4'],
    comments: [],
    createdAt: new Date(Date.now() - 172800000),
  },
];

export const getPosts = async (): Promise<Post[]> => {
  return await getStoredPosts();
};

export const getPostById = async (postId: string): Promise<Post> => {
  const posts = await getStoredPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) {
    throw new Error('Post not found');
  }
  return post;
};

export const createPost = async (postData: Partial<Post>): Promise<Post> => {
  const posts = await getStoredPosts();

  const newPost: Post = {
    id: `post_${Date.now()}`,
    userId: postData.userId || 'current_user',
    userName: postData.userName || 'Usuario',
    userAvatar: postData.userAvatar,
    content: postData.content,
    imageUrl: postData.imageUrl,
    eventId: postData.eventId,
    eventTitle: postData.eventTitle,
    likes: [],
    comments: [],
    createdAt: new Date(),
  };

  posts.unshift(newPost);
  await savePosts(posts);

  return newPost;
};

export const toggleLike = async (postId: string, userId: string): Promise<void> => {
  const posts = await getStoredPosts();
  const postIndex = posts.findIndex(p => p.id === postId);

  if (postIndex === -1) return;

  const post = posts[postIndex];
  const likeIndex = post.likes.indexOf(userId);

  if (likeIndex === -1) {
    post.likes.push(userId);
  } else {
    post.likes.splice(likeIndex, 1);
  }

  posts[postIndex] = post;
  await savePosts(posts);
};

export const addComment = async (postId: string, commentData: Partial<Comment>): Promise<Comment> => {
  const posts = await getStoredPosts();
  const postIndex = posts.findIndex(p => p.id === postId);

  if (postIndex === -1) {
    throw new Error('Post not found');
  }

  const newComment: Comment = {
    id: `comm_${Date.now()}`,
    userId: commentData.userId || 'current_user',
    userName: commentData.userName || 'Usuario',
    userAvatar: commentData.userAvatar,
    content: commentData.content || '',
    createdAt: new Date(),
  };

  posts[postIndex].comments.push(newComment);
  await savePosts(posts);

  return newComment;
};

export const deletePost = async (postId: string): Promise<void> => {
  const posts = await getStoredPosts();
  const filtered = posts.filter(p => p.id !== postId);
  await savePosts(filtered);
};

export default {
  getPosts,
  getPostById,
  createPost,
  toggleLike,
  addComment,
  deletePost,
};
