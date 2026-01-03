import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PlaceholderScreen = ({ route }: any) => {
    const title = route?.name || 'TiQly Mobile';
    return (
        <View style={styles.container}>
            <Text style={styles.logo}>Ti<Text style={{ color: '#D4FF00' }}>Q</Text>ly</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.text}>Esta sección móvil está en construcción.</Text>
            <Text style={styles.subtext}>Usá la versión Web para ver el Mock completo.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        color: '#fff',
        fontSize: 40,
        fontWeight: '900',
        marginBottom: 40,
    },
    title: {
        color: '#D4FF00',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    text: {
        color: '#fff',
        textAlign: 'center',
        marginBottom: 5,
    },
    subtext: {
        color: '#666',
        textAlign: 'center',
        fontSize: 12,
    }
});
