import { db, storage } from '../../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Tipos
export interface Post {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  imageUrl?: string;
  likes: string[];
  comments: Comment[];
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
}

// Obtener todos los posts
export const getPosts = async (): Promise<Post[]> => {
  try {
    const q = query(
      collection(db, 'posts'), 
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as Omit<Post, 'id'>;
      return {
        id: doc.id,
        ...data,
        // Convertir Firestore Timestamp a Date
        createdAt: data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : new Date(data.createdAt)
      };
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
};

// Crear un nuevo post
export const createPost = async (
  post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'> & { imageUri?: string }
): Promise<Post> => {
  try {
    let imageUrl = post.imageUrl;
    
    // Subir imagen si existe
    if (post.imageUri) {
      const response = await fetch(post.imageUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `posts/${uuidv4()}`);
      await uploadBytes(storageRef, blob);
      imageUrl = await getDownloadURL(storageRef);
    }

    const newPost = {
      ...post,
      imageUrl,
      likes: [],
      comments: [],
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'posts'), newPost);
    return { id: docRef.id, ...newPost };
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Dar like/quit like a un post
export const toggleLike = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const post = postSnap.data() as DocumentData;
      const currentLikes = post.likes || [];
      
      if (currentLikes.includes(userId)) {
        await updateDoc(postRef, {
          likes: arrayRemove(userId)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(userId)
        });
      }
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// Añadir comentario a un post
export const addComment = async (
  postId: string, 
  comment: Omit<Comment, 'id' | 'createdAt'>
): Promise<Comment> => {
  try {
    const newComment: Comment = {
      ...comment,
      id: uuidv4(),
      createdAt: new Date()
    };

    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments: arrayUnion(newComment)
    });

    return newComment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Obtener un post por su ID
export const getPostById = async (postId: string): Promise<Post> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('El post no existe');
    }
    
    const postData = postDoc.data() as Omit<Post, 'id'>;
    
    // Convertir los timestamps de Firestore a objetos Date
    const post: Post = {
      id: postDoc.id,
      ...postData,
      createdAt: (postData.createdAt as any).toDate(),
      comments: postData.comments.map((comment: any) => ({
        ...comment,
        createdAt: (comment.createdAt as any).toDate(),
      })),
    };
    
    return post;
  } catch (error) {
    console.error('Error getting post by ID:', error);
    throw error;
  }
};

// Eliminar un post
export const deletePost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('El post no existe');
    }
    
    const postData = postDoc.data() as Omit<Post, 'id'>;
    
    if (postData.userId !== userId) {
      throw new Error('No tienes permiso para eliminar este post');
    }
    
    await updateDoc(postRef, { deleted: true });
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};
