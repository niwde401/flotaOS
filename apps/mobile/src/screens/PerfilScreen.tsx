import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuthStore } from '../store/authStore'

export default function PerfilScreen() {
  const { user, logout } = useAuthStore()
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user?.fullName}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.role}>{user?.role}</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  email: { color: '#6b7280', marginTop: 4 },
  role: { color: '#1e40af', marginTop: 4, fontWeight: '600' },
  logoutBtn: { marginTop: 32, backgroundColor: '#dc2626', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600' },
})
