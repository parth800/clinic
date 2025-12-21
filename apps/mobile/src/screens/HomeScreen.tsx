import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '../lib/supabase';

// Mock data
const mockAppointments = [
    { id: '1', patient: 'John Doe', time: '09:00 AM', status: 'confirmed' },
    { id: '2', patient: 'Jane Smith', time: '09:30 AM', status: 'pending' },
    { id: '3', patient: 'Mike Johnson', time: '10:00 AM', status: 'confirmed' },
];

export default function HomeScreen({ navigation }: any) {
    const [appointments, setAppointments] = useState(mockAppointments);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        // Fetch data here
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const renderItem = ({ item }: any) => (
        <TouchableOpacity
            className="bg-white p-4 mb-2 rounded shadow-sm flex-row justify-between items-center"
            onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}
        >
            <View>
                <Text className="text-lg font-bold text-gray-800">{item.patient}</Text>
                <Text className="text-gray-500">{item.time}</Text>
            </View>
            <View className={`px-2 py-1 rounded ${item.status === 'confirmed' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <Text className={`text-xs ${item.status === 'confirmed' ? 'text-green-800' : 'text-yellow-800'}`}>
                    {item.status}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-100 p-4">
            <View className="flex-row justify-between items-center mb-4 mt-2">
                <Text className="text-2xl font-bold text-gray-900">Today's Schedule</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <Text className="text-blue-600 font-medium">Logout</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={appointments}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <Text className="text-center text-gray-500 mt-10">No appointments today</Text>
                }
            />
        </View>
    );
}
