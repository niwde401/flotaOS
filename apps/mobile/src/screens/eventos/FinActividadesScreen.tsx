import React, { useState } from 'react'
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../navigation/AppNavigator'
import { useLocation } from '../../hooks/useLocation'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { tripsApi } from '../../api/trips'
import { EventType } from '@flotaos/shared'

type Props = StackScreenProps<RootStackParams, 'FinActividades'>

export default function FinActividadesScreen({ route, navigation }: Props) {
  const { tripId } = route.params
  const { coords, error } = useLocation()
  const { pickAndUpload, uploading } = usePhotoUpload()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!coords) { Alert.alert('Error', 'Esperando GPS...'); return }
    setSubmitting(true)
    try {
      await tripsApi.createEvent(tripId, {
        eventType: EventType.llegada_destino,
        latitude: coords.latitude,
        longitude: coords.longitude,
        notes: notes || undefined,
        photoUrl: photoUrl || undefined,
      })
      Alert.alert('Completado', 'Actividades del día finalizadas', [{ text: 'OK', onPress: () => navigation.navigate('Main') }])
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Error al registrar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.label}>GPS: {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Obteniendo...'}</Text>
      )}
      <TextInput
        style={styles.input}
        placeholder="Observaciones finales"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />
      <TouchableOpacity
        style={styles.photoBtn}
        onPress={async () => { const url = await pickAndUpload(); if (url) setPhotoUrl(url) }}
        disabled={uploading}
      >
        <Text style={styles.photoBtnText}>{uploading ? 'Subiendo...' : photoUrl ? 'Foto cargada ✓' : 'Foto final (opcional)'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting || !coords}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Finalizar Actividades</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { color: '#374151', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
  photoBtn: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#d1d5db' },
  photoBtnText: { color: '#374151' },
  submitBtn: { backgroundColor: '#1e40af', borderRadius: 8, padding: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  errorText: { color: '#dc2626', marginBottom: 16, fontSize: 14 },
})
