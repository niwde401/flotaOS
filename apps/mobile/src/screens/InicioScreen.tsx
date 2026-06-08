import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParams } from '../navigation/AppNavigator'
import { tripsApi } from '../api/trips'
import { TripDTO } from '@flotaos/shared'

type Nav = StackNavigationProp<RootStackParams>

export default function InicioScreen() {
  const nav = useNavigation<Nav>()
  const [trip, setTrip] = useState<TripDTO | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchTodayTrip() {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const trips = await tripsApi.list(today)
      const active = trips.find((t) => t.status === 'active') || trips[0] || null
      setTrip(active)
    } catch {
      // offline — show cached state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTodayTrip() }, [])

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>

  if (!trip) {
    return (
      <View style={styles.center}>
        <Text style={styles.noTrip}>Sin viaje asignado hoy</Text>
      </View>
    )
  }

  const actions = [
    { label: 'Llegada a Sitio', screen: 'Salida', color: '#16a34a' },
    { label: 'Parada', screen: 'Parada', color: '#d97706' },
    { label: 'Fin de Actividades', screen: 'FinActividades', color: '#1e40af' },
    { label: 'Ingreso a Taller', screen: 'IngresoTaller', color: '#dc2626' },
    { label: 'Salida de Taller', screen: 'SalidaTaller', color: '#7c3aed' },
    { label: 'Registrar Gasto', screen: 'NuevoGasto', color: '#0891b2' },
  ] as const

  return (
    <ScrollView style={styles.container}>
      <View style={styles.tripCard}>
        <Text style={styles.tripTitle}>{trip.origin} → {trip.destination}</Text>
        <Text style={styles.tripSub}>Vehículo: {(trip as any).vehicle?.plateNumber || '—'}</Text>
        <Text style={styles.status}>{trip.status.toUpperCase()}</Text>
      </View>

      <Text style={styles.sectionTitle}>Acciones</Text>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.screen}
          style={[styles.actionBtn, { backgroundColor: action.color }]}
          onPress={() => nav.navigate(action.screen as any, { tripId: trip.id })}
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noTrip: { color: '#6b7280', fontSize: 16 },
  tripCard: { backgroundColor: '#1e40af', borderRadius: 12, padding: 20, marginBottom: 24 },
  tripTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  tripSub: { color: '#bfdbfe', marginTop: 4 },
  status: { color: '#fbbf24', fontWeight: '600', marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  actionBtn: { borderRadius: 10, padding: 16, marginBottom: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 15 },
})
