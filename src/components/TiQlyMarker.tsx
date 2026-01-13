import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View, Image } from 'react-native';

interface TiQlyMarkerProps {
    width?: number;
    height?: number;
}

const TiQlyMarker: React.FC<TiQlyMarkerProps> = ({ width = 50, height = 60 }) => {
    return (
        <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
            {/* SVG Pin Shape Container */}
            <Svg width={width} height={height} viewBox="0 0 50 60" fill="none" style={{ position: 'absolute' }}>
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="50" y2="60">
                        <Stop offset="0" stopColor="rgba(20,20,20,0.95)" />
                        <Stop offset="1" stopColor="rgba(0,0,0,1)" />
                    </LinearGradient>
                </Defs>

                {/* Pin Shape */}
                <Path
                    d="M25 60C25 60 50 40 50 25C50 11.1929 38.8071 0 25 0C11.1929 0 0 11.1929 0 25C0 40 25 60 25 60Z"
                    fill="url(#grad)"
                    stroke="#00D9FF"
                    strokeWidth="2"
                />
            </Svg>

            {/* Official Logo Overlay */}
            <View style={{
                width: width * 0.64, // ~64% of width
                height: width * 0.64,
                borderRadius: (width * 0.64) / 2,
                overflow: 'hidden',
                marginBottom: height * 0.15, // Lift it up slightly into the circle head
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10
            }}>
                <Image
                    source={require('../../assets/splash-icon.png')}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                />
            </View>
        </View>
    );
};

export default TiQlyMarker;
