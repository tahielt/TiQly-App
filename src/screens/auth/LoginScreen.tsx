import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TextInput,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { loginUser } from '../../features/auth/authSlice';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = () => {
    const dispatch = useDispatch<AppDispatch>();
    const [email, setEmail] = useState('demo@tiqly.app');
    const [password, setPassword] = useState('demo123');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await dispatch(loginUser({ email, password })).unwrap();
        } catch (error) {
            console.log('Login error:', error);
        }
        setLoading(false);
    };

    const handleQuickLogin = () => {
        setEmail('demo@tiqly.app');
        setPassword('demo123');
        handleLogin();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../../assets/Tiqly nuevo color marca SINLOGO.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.tagline}>Tu entrada al mundo de la noche</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="#666"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Contraseña"
                                placeholderTextColor="#666"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.forgotBtn}>
                            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
                            )}
                        </TouchableOpacity>

                        {/* Quick Demo Login */}
                        <TouchableOpacity style={styles.demoBtn} onPress={handleQuickLogin}>
                            <Ionicons name="flash" size={18} color="#00D9FF" />
                            <Text style={styles.demoBtnText}>Acceso Rápido Demo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Register Link */}
                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>¿No tenés cuenta? </Text>
                        <TouchableOpacity>
                            <Text style={styles.registerLink}>Registrate</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        height: 60,
        width: 200,
        marginBottom: 16,
    },
    tagline: {
        color: '#666',
        fontSize: 14,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        paddingVertical: 16,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
    },
    forgotText: {
        color: '#00D9FF',
        fontSize: 13,
    },
    loginBtn: {
        backgroundColor: '#00D9FF',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 8,
    },
    loginBtnDisabled: {
        opacity: 0.7,
    },
    loginBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    demoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#00D9FF',
        borderStyle: 'dashed',
    },
    demoBtnText: {
        color: '#00D9FF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    registerText: {
        color: '#666',
        fontSize: 14,
    },
    registerLink: {
        color: '#00D9FF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default LoginScreen;
