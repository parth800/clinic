import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

export default function PatientDetailScreen({ route, navigation }: any) {
    const { patientId } = route.params || { patientId: '1' };

    // Mock data
    const patient = {
        id: patientId,
        name: 'John Doe',
        age: 45,
        gender: 'Male',
        phone: '+91 98765 43210',
        history: [
            { date: '2023-10-15', diagnosis: 'Viral Fever', prescription: 'Paracetamol 500mg' },
            { date: '2023-09-01', diagnosis: 'Hypertension', prescription: 'Amlodipine 5mg' },
        ]
    };

    return (
        <View className="flex-1 bg-gray-100">
            <View className="bg-white p-6 shadow-sm mb-4">
                <Text className="text-2xl font-bold text-gray-900">{patient.name}</Text>
                <Text className="text-gray-500 mt-1">{patient.age} years • {patient.gender}</Text>
                <Text className="text-blue-600 mt-2 font-medium">{patient.phone}</Text>
            </View>

            <ScrollView className="flex-1 px-4">
                <Text className="text-lg font-bold text-gray-800 mb-3">Visit History</Text>
                {patient.history.map((visit, index) => (
                    <View key={index} className="bg-white p-4 rounded-lg shadow-sm mb-3 border-l-4 border-blue-500">
                        <Text className="text-gray-500 text-xs mb-1">{visit.date}</Text>
                        <Text className="font-bold text-gray-800 mb-1">{visit.diagnosis}</Text>
                        <Text className="text-gray-600">{visit.prescription}</Text>
                    </View>
                ))}
            </ScrollView>

            <View className="p-4 bg-white border-t border-gray-200">
                <TouchableOpacity
                    className="bg-blue-600 p-4 rounded-lg items-center"
                    onPress={() => console.log('Add Note')}
                >
                    <Text className="text-white font-bold">Add Clinical Note</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
