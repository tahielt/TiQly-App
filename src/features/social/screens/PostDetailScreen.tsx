import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getPostById, addComment, toggleLike } from '../socialService';
import type { Comment, Post } from '../socialService';
import { colors, spacing, typography } from '../../../theme';

type PostDetailRouteProp = {
  key: string;
  name: string;
  params: {
    postId: string;
  };
  path?: string;
};

// Navigation prop type is not needed as we're not using navigation prop directly
const PostDetailScreen = () => {
  const route = useRoute<PostDetailRouteProp>();
  const { postId } = route.params;
  
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);

  const loadPost = async () => {
    try {
      const postData = await getPostById(postId);
      // Ensure all required fields are present
      const safePost: Post = {
        ...postData,
        userId: postData.userId || 'unknown',
        userName: postData.userName || 'Usuario desconocido',
        content: postData.content || '',
        likes: postData.likes || [],
        comments: postData.comments || [],
        createdAt: postData.createdAt || new Date()
      };
      setPost(safePost);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [postId]);

  const handleAddComment = async () => {
    if (!comment.trim() || !post) return;
    
    setSubmitting(true);
    
    try {
      const newComment = await addComment(postId, {
        userId: 'current-user-id', // This should come from your auth context
        userName: 'Usuario Actual', // This should come from your auth context
        content: comment,
      });
      
      setPost({
        ...post,
        comments: [...(post.comments || []), newComment],
      });
      
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async () => {
    if (!post) return;
    
    setLiking(true);
    
    try {
      const userId = 'current-user-id'; // This should come from your auth context
      const currentLikes = post.likes || [];
      const isLiked = currentLikes.includes(userId);
      
      await toggleLike(postId, userId);
      
      setPost({
        ...post,
        likes: isLiked 
          ? currentLikes.filter((id: string) => id !== userId)
          : [...currentLikes, userId],
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLiking(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <Image 
        source={{ uri: item.userAvatar || 'https://via.placeholder.com/32' }} 
        style={styles.commentAvatar} 
      />
      <View style={styles.commentContent}>
        <Text style={styles.commentAuthor}>{item.userName}</Text>
        <Text style={styles.commentText}>{item.content}</Text>
        <Text style={styles.commentTime}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text>No se pudo cargar la publicación</Text>
      </View>
    );
  }

  const isLiked = post.likes?.includes('current-user-id') || false; 

  return (
    <View style={styles.container}>
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          <Image 
            source={{ uri: post.userAvatar || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={styles.userName}>{post.userName}</Text>
            <Text style={styles.postTime}>
              {new Date(post.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>
        
        {post.content && <Text style={styles.postContent}>{post.content}</Text>}
        
        {post.imageUrl && (
          <Image 
            source={{ uri: post.imageUrl }} 
            style={styles.postImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleToggleLike}
            disabled={liking}
          >
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              {isLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.commentsCount}>
            💬 {post.comments?.length || 0} comentarios
          </Text>
        </View>
      </View>
      
      <FlatList
        data={post.comments || []}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.commentsList}
        ListEmptyComponent={
          <View style={styles.emptyComments}>
            <Text style={styles.emptyCommentsText}>No hay comentarios aún</Text>
          </View>
        }
      />
      
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Escribe un comentario..."
          value={comment}
          onChangeText={setComment}
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity 
          style={[styles.commentButton, (!comment.trim() || submitting) && styles.disabledButton]}
          onPress={handleAddComment}
          disabled={!comment.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.commentButtonText}>Enviar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContainer: {
    backgroundColor: colors.surface,
    padding: spacing.medium,
    marginBottom: spacing.small,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.small,
  },
  userName: {
    ...typography.subtitle1,
    fontWeight: 'bold',
  },
  postTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  postContent: {
    ...typography.body1,
    marginBottom: spacing.small,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: spacing.small,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.small,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    marginRight: spacing.large,
  },
  actionText: {
    ...typography.button,
  },
  likedText: {
    color: colors.primary,
  },
  commentsCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  commentsList: {
    flexGrow: 1,
    padding: spacing.medium,
  },
  emptyComments: {
    padding: spacing.large,
    alignItems: 'center',
  },
  emptyCommentsText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.small,
  },
  commentContent: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.small,
    borderRadius: 8,
  },
  commentAuthor: {
    ...typography.subtitle2,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  commentText: {
    ...typography.body2,
    marginBottom: 2,
  },
  commentTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  commentInput: {
    flex: 1,
    ...typography.body1,
    padding: spacing.small,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginRight: spacing.small,
    paddingHorizontal: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentButton: {
    justifyContent: 'center',
    paddingHorizontal: spacing.medium,
  },
  commentButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default PostDetailScreen;
