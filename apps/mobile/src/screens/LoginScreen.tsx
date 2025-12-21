import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert(error.message);
        setLoading(false);
    }

    return (
        <View className="flex-1 justify-center p-4 bg-white">
            <Text className="text-2xl font-bold text-center mb-8 text-blue-600">ClinicFlow Doctor</Text>
            <View className="space-y-4">
                <TextInput
                    className="border border-gray-300 rounded p-3"
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
                <TextInput
                    className="border border-gray-300 rounded p-3"
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <TouchableOpacity
                    className="bg-blue-600 p-4 rounded items-center"
                    onPress={signInWithEmail}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-bold">Sign In</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
