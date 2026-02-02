import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { SocialStackParamList } from '../../../types/navigation';
import { createPost } from '../socialService';
import { colors, spacing, typography } from '../../../theme';
import { User as FirebaseUser } from 'firebase/auth'; 

type CreatePostNavigationProp = NativeStackNavigationProp<SocialStackParamList, 'CreatePost'>;

const CreatePostScreen = () => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<CreatePostNavigationProp>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const firebaseUser = user as FirebaseUser | null;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir imágenes');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Por favor escribe algo en tu publicación');
      return;
    }

    if (!firebaseUser) {
      Alert.alert('Error', 'Debes iniciar sesión para publicar');
      return;
    }

    setLoading(true);
    
    try {
      await createPost({
        content,
        imageUri: image || undefined,
        userId: firebaseUser.uid,
        userName: firebaseUser.displayName || 'Usuario Anónimo',
        userAvatar: firebaseUser.photoURL || undefined,
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'No se pudo publicar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="¿Qué estás pensando?"
        multiline
        value={content}
        onChangeText={setContent}
        placeholderTextColor={colors.textSecondary}
      />
      
      {image && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: image }} 
            style={styles.image} 
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.removeImageButton}
            onPress={() => setImage(null)}
          >
            <Text style={styles.removeImageText}>×</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={pickImage}
        >
          <Text style={styles.buttonText}>📷 Foto</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={[styles.buttonText, styles.submitButtonText]}>
              Publicar
            </Text>
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
    padding: spacing.medium,
  },
  input: {
    ...typography.body1,
    minHeight: 120,
    textAlignVertical: 'top',
    padding: spacing.medium,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: spacing.medium,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: colors.onPrimary,
    fontSize: 20,
    lineHeight: 24,
    marginTop: -2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  buttonText: {
    ...typography.button,
  },
  submitButton: {
    backgroundColor: colors.primary,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.onPrimary,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default CreatePostScreen;
