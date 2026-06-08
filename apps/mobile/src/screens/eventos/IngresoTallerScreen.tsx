import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../navigation/AppNavigator'
import { useLocation } from '../../hooks/useLocation'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { tripsApi } from '../../api/trips'
import { EventType } from '@flotaos/shared'

type Props = StackScreenProps<RootStackParams, 'IngresoTaller'>

export default function IngresoTallerScreen({ route, navigation }: Props) {
  const { tripId } = route.params
  const { coords } = useLocation()
  const { pickAndUpload, uploading } = usePhotoUpload()
  const [diagnostico, setDiagnostico] = useState('')
  const [kmEntrada, setKmEntrada] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!coords) { Alert.alert('Error', 'Esperando GPS...'); return }
    if (!diagnostico.trim()) { Alert.alert('Requerido', 'Ingresa el diagnóstico'); return }
    if (!kmEntrada || isNaN(parseInt(kmEntrada))) { Alert.alert('Requerido', 'Ingresa el km de entrada'); return }
    setSubmitting(true)
    try {
      const result = await tripsApi.createEvent(tripId, {
        eventType: EventType.ingreso_taller,
        latitude: coords.latitude,
        longitude: coords.longitude,
        diagnostico,
        kmEntrada: parseInt(kmEntrada),
        photoUrl: photoUrl || undefined,
      })
      Alert.alert(
        'Registrado',
        `OT creada: ${result.ordenTrabajo?.numeroOt}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Error al registrar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Diagnóstico</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe el problema"
        value={diagnostico}
        onChangeText={setDiagnostico}
        multiline
        numberOfLines={4}
      />
      <Text style={styles.sectionTitle}>Km de Entrada</Text>
      <TextInput
        style={styles.inputShort}
        placeholder="Ej: 45200"
        value={kmEntrada}
        onChangeText={setKmEntrada}
        keyboardType="numeric"
      />
      <TouchableOpacity
        style={styles.photoBtn}
        onPress={async () => { const url = await pickAndUpload(); if (url) setPhotoUrl(url) }}
        disabled={uploading}
      >
        <Text style={styles.photoBtnText}>{uploading ? 'Subiendo...' : photoUrl ? 'Foto daño cargada ✓' : 'Foto del daño (recomendado)'}</Text>
      </TouchableOpacity>
      <Text style={styles.gpsLabel}>GPS: {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Obteniendo...'}</Text>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting || !coords}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Registrar Ingreso a Taller</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  sectionTitle: { fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16, minHeight: 100, textAlignVertical: 'top' },
  inputShort: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16 },
  photoBtn: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#d1d5db' },
  photoBtnText: { color: '#374151' },
  gpsLabel: { color: '#6b7280', fontSize: 12, marginBottom: 16 },
  submitBtn: { backgroundColor: '#dc2626', borderRadius: 8, padding: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
})
