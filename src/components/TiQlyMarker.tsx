import React from 'react';
import { View, Image } from 'react-native';

interface TiQlyMarkerProps {
    width?: number;
    height?: number;
}

const TiQlyMarker: React.FC<TiQlyMarkerProps> = ({ width = 50, height = 60 }) => {
    return (
        <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
            <Image
                source={require('../../assets/color 3.png')}
                style={{ width, height }}
                resizeMode="contain"
            />
        </View>
    );
};

export default TiQlyMarker;
