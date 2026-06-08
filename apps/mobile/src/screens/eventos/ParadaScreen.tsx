import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Switch, ActivityIndicator, ScrollView } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { Picker } from '@react-native-picker/picker'
import { RootStackParams } from '../../navigation/AppNavigator'
import { useLocation } from '../../hooks/useLocation'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { tripsApi } from '../../api/trips'
import { EventType, ForceMajeureType } from '@flotaos/shared'

type Props = StackScreenProps<RootStackParams, 'Parada'>

const FM_OPTIONS = [
  { label: 'Derrumbe', value: ForceMajeureType.derrumbe },
  { label: 'Inundación', value: ForceMajeureType.inundacion },
  { label: 'Caída de puente', value: ForceMajeureType.caida_puente },
  { label: 'Lluvias', value: ForceMajeureType.lluvias },
  { label: 'Contingencia social', value: ForceMajeureType.contingencia_social },
  { label: 'Otros', value: ForceMajeureType.otros },
]

export default function ParadaScreen({ route, navigation }: Props) {
  const { tripId } = route.params
  const { coords, error } = useLocation()
  const { pickAndUpload, uploading } = usePhotoUpload()
  const [notes, setNotes] = useState('')
  const [isFM, setIsFM] = useState(false)
  const [fmType, setFmType] = useState<ForceMajeureType>(ForceMajeureType.derrumbe)
  const [fmPhotos, setFmPhotos] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function addFMPhoto() {
    if (fmPhotos.length >= 3) { Alert.alert('Máximo 3 fotos'); return }
    const url = await pickAndUpload()
    if (url) setFmPhotos((prev) => [...prev, url])
  }

  async function handleSubmit() {
    if (!coords) { Alert.alert('Error', 'Esperando GPS...'); return }
    if (isFM && fmPhotos.length < 3) { Alert.alert('Requerido', 'Necesitas exactamente 3 fotos de evidencia'); return }
    setSubmitting(true)
    try {
      await tripsApi.createEvent(tripId, {
        eventType: EventType.parada,
        latitude: coords.latitude,
        longitude: coords.longitude,
        notes: notes || undefined,
        isForceMajeure: isFM,
        fmType: isFM ? fmType : undefined,
        fmPhotos: isFM ? fmPhotos : undefined,
      })
      Alert.alert('Registrado', 'Parada registrada', [{ text: 'OK', onPress: () => navigation.goBack() }])
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
        placeholder="Motivo de parada"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />
      <View style={styles.row}>
        <Text style={styles.fmLabel}>Fuerza Mayor</Text>
        <Switch value={isFM} onValueChange={setIsFM} trackColor={{ false: '#d1d5db', true: '#dc2626' }} />
      </View>
      {isFM && (
        <View style={styles.fmSection}>
          <Text style={styles.fmSectionLabel}>Tipo de Fuerza Mayor</Text>
          <Picker selectedValue={fmType} onValueChange={(v) => setFmType(v as ForceMajeureType)}>
            {FM_OPTIONS.map((opt) => (
              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
            ))}
          </Picker>
          <Text style={styles.fmSectionLabel}>Fotos de evidencia ({fmPhotos.length}/3)</Text>
          {fmPhotos.map((_, i) => (
            <Text key={i} style={styles.photoConfirm}>Foto {i + 1} cargada</Text>
          ))}
          {fmPhotos.length < 3 && (
            <TouchableOpacity style={styles.photoBtn} onPress={addFMPhoto} disabled={uploading}>
              <Text style={styles.photoBtnText}>{uploading ? 'Subiendo...' : `Agregar foto ${fmPhotos.length + 1}`}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting || !coords}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Registrar Parada</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { color: '#374151', marginBottom: 16, fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  fmLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  fmSection: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 16, marginBottom: 16 },
  fmSectionLabel: { fontWeight: '600', color: '#374151', marginBottom: 8 },
  photoConfirm: { color: '#16a34a', marginBottom: 4 },
  photoBtn: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', marginTop: 8 },
  photoBtnText: { color: '#374151' },
  submitBtn: { backgroundColor: '#d97706', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  errorText: { color: '#dc2626', marginBottom: 16, fontSize: 14 },
})
