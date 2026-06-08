import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../navigation/AppNavigator'
import { useLocation } from '../../hooks/useLocation'
import { tripsApi } from '../../api/trips'
import { EventType } from '@flotaos/shared'

type Props = StackScreenProps<RootStackParams, 'SalidaTaller'>

export default function SalidaTallerScreen({ route, navigation }: Props) {
  const { tripId } = route.params
  const { coords, error } = useLocation()
  const [trabajos, setTrabajos] = useState('')
  const [kmSalida, setKmSalida] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!coords) { Alert.alert('Error', 'Esperando GPS...'); return }
    if (!trabajos.trim()) { Alert.alert('Requerido', 'Describe los trabajos realizados'); return }
    if (!kmSalida || isNaN(parseInt(kmSalida))) { Alert.alert('Requerido', 'Ingresa el km de salida'); return }
    setSubmitting(true)
    try {
      await tripsApi.createEvent(tripId, {
        eventType: EventType.salida_taller,
        latitude: coords.latitude,
        longitude: coords.longitude,
        kmSalida: parseInt(kmSalida),
        trabajosRealizados: trabajos,
      })
      Alert.alert('Completado', 'Salida de taller registrada', [{ text: 'OK', onPress: () => navigation.goBack() }])
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Error al registrar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Trabajos realizados</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe los trabajos y repuestos"
        value={trabajos}
        onChangeText={setTrabajos}
        multiline
        numberOfLines={5}
      />
      <Text style={styles.sectionTitle}>Km de Salida</Text>
      <TextInput
        style={styles.inputShort}
        placeholder="Ej: 45350"
        value={kmSalida}
        onChangeText={setKmSalida}
        keyboardType="numeric"
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.gpsLabel}>GPS: {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Obteniendo...'}</Text>
      )}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting || !coords}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Registrar Salida de Taller</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  sectionTitle: { fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16, minHeight: 120, textAlignVertical: 'top' },
  inputShort: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16 },
  gpsLabel: { color: '#6b7280', fontSize: 12, marginBottom: 16 },
  submitBtn: { backgroundColor: '#7c3aed', borderRadius: 8, padding: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  errorText: { color: '#dc2626', marginBottom: 16, fontSize: 14 },
})
