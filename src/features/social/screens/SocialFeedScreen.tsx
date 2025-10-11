import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { toggleLike } from '../socialService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SocialStackParamList } from '../../../types/navigation';
import { getPosts, Post } from '../socialService';
import { colors, spacing, typography } from '../../../theme';

type SocialFeedNavigationProp = NativeStackNavigationProp<SocialStackParamList, 'SocialFeed'>;

const SocialFeedScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<SocialFeedNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const isFocused = useIsFocused();

  const loadPosts = async () => {
    try {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadPosts();
    }
  }, [isFocused]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    // Optimistic UI update
    const originalPosts = [...posts];
    const updatedPosts = posts.map(p => {
      if (p.id === postId) {
        const isLiked = p.likes.includes(user.uid);
        const newLikes = isLiked
          ? p.likes.filter(uid => uid !== user.uid)
          : [...p.likes, user.uid];
        return { ...p, likes: newLikes };
      }
      return p;
    });
    setPosts(updatedPosts);

    // Call the service
    try {
      await toggleLike(postId, user.uid);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert UI on error
      setPosts(originalPosts);
      Alert.alert('Error', 'No se pudo procesar el "me gusta".');
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Image 
          source={{ uri: item.userAvatar || 'https://via.placeholder.com/40' }} 
          style={styles.avatar} 
        />
        <View>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.postTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      
      {item.content && <Text style={styles.postContent}>{item.content}</Text>}
      
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id!)}
        >
          <Text style={item.likes.includes(user?.uid || '') ? styles.liked : {}}>❤️ {item.likes.length}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            navigation.navigate('PostDetail', { postId: item.id || '' });
          }}
        >
          <Text>💬 {item.comments.length}</Text>
        </TouchableOpacity>
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

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No hay publicaciones aún</Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.medium,
  },
  postContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  liked: {
    color: colors.primary,
    fontWeight: 'bold',
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
    height: 200,
    borderRadius: 4,
    marginBottom: spacing.small,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.small,
    marginTop: spacing.small,
  },
  actionButton: {
    marginRight: spacing.large,
    flexDirection: 'row',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: {
    color: colors.onPrimary,
    fontSize: 24,
    lineHeight: 30,
  },
});

export default SocialFeedScreen;
