import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SocialStackParamList } from '../../../types/navigation';
import SocialFeedScreen from '../screens/SocialFeedScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import PostDetailScreen from '../screens/PostDetailScreen';

const Stack = createNativeStackNavigator<SocialStackParamList>();

const SocialNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SocialFeed" component={SocialFeedScreen} />
      <Stack.Screen 
        name="CreatePost" 
        component={CreatePostScreen} 
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Nueva Publicación',
        }}
      />
      <Stack.Screen 
        name="PostDetail" 
        component={PostDetailScreen}
        options={{
          headerShown: true,
          title: 'Publicación',
        }}
      />
    </Stack.Navigator>
  );
};

export default SocialNavigator;
