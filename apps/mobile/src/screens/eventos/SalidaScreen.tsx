import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../navigation/AppNavigator'
import { useLocation } from '../../hooks/useLocation'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { tripsApi } from '../../api/trips'
import { EventType } from '@flotaos/shared'

type Props = StackScreenProps<RootStackParams, 'Salida'>

export default function SalidaScreen({ route, navigation }: Props) {
  const { tripId } = route.params
  const { coords } = useLocation()
  const { pickAndUpload, uploading } = usePhotoUpload()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handlePhoto() {
    const url = await pickAndUpload()
    if (url) setPhotoUrl(url)
  }

  async function handleSubmit() {
    if (!coords) { Alert.alert('Error', 'Esperando ubicación GPS...'); return }
    setSubmitting(true)
    try {
      await tripsApi.createEvent(tripId, {
        eventType: EventType.llegada_sitio,
        latitude: coords.latitude,
        longitude: coords.longitude,
        notes: notes || undefined,
        photoUrl: photoUrl || undefined,
      })
      Alert.alert('Registrado', 'Llegada a sitio registrada', [{ text: 'OK', onPress: () => navigation.goBack() }])
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Error al registrar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>GPS: {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Obteniendo...'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Observaciones (opcional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />
      <TouchableOpacity style={styles.photoBtn} onPress={handlePhoto} disabled={uploading}>
        <Text style={styles.photoBtnText}>{uploading ? 'Subiendo...' : photoUrl ? 'Foto cargada ✓' : 'Tomar foto (opcional)'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting || !coords}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Registrar Llegada</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { color: '#374151', marginBottom: 16, fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
  photoBtn: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#d1d5db' },
  photoBtnText: { color: '#374151' },
  submitBtn: { backgroundColor: '#16a34a', borderRadius: 8, padding: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
})
