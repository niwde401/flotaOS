import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../navigation/AppNavigator'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { expensesApi } from '../../api/expenses'
import { ConceptType } from '@flotaos/shared'

type Props = StackScreenProps<RootStackParams, 'NuevoGasto'>

const CONCEPTS = [
  { label: 'Combustible vehículo', value: ConceptType.vehicle_fuel },
  { label: 'Combustible DG', value: ConceptType.dg_refuel },
  { label: 'Peajes', value: ConceptType.peajes },
  { label: 'Viáticos', value: ConceptType.viaticos },
  { label: 'Consumibles', value: ConceptType.consumibles },
  { label: 'Gastos de vehículo', value: ConceptType.vehicle_expenses },
  { label: 'Gastos de operación', value: ConceptType.operation_expense },
  { label: 'Gastos embarcación', value: ConceptType.boat_expense },
  { label: 'Otros', value: ConceptType.otros },
]

export default function NuevoGastoScreen({ route, navigation }: Props) {
  const { tripId } = route.params
  const { pickAndUpload, uploading } = usePhotoUpload()
  const [concept, setConcept] = useState<ConceptType>(ConceptType.vehicle_fuel)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [voucherNumber, setVoucherNumber] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!amount || isNaN(parseFloat(amount))) { Alert.alert('Requerido', 'Ingresa el monto'); return }

    setSubmitting(true)
    try {
      await expensesApi.create({
        tripId,
        concept,
        amount: parseFloat(amount),
        description: description || undefined,
        voucherNumber: voucherNumber || undefined,
        photoUrl: photoUrl || undefined,
      })
      Alert.alert(
        !photoUrl ? 'Gasto observado' : 'Gasto registrado',
        !photoUrl ? 'Sin comprobante — quedará como observado' : 'Gasto registrado correctamente',
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
      <Text style={styles.label}>Concepto</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={concept} onValueChange={(v) => setConcept(v as ConceptType)}>
          {CONCEPTS.map((c) => <Picker.Item key={c.value} label={c.label} value={c.value} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Monto (S/.)</Text>
      <TextInput style={styles.input} placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

      <Text style={styles.label}>Descripción (opcional)</Text>
      <TextInput style={styles.input} placeholder="Detalle del gasto" value={description} onChangeText={setDescription} />

      <Text style={styles.label}>N° Comprobante</Text>
      <TextInput style={styles.input} placeholder="Número de boleta/factura" value={voucherNumber} onChangeText={setVoucherNumber} />

      <TouchableOpacity style={styles.photoBtn} onPress={async () => { const url = await pickAndUpload(); if (url) setPhotoUrl(url) }} disabled={uploading}>
        <Text style={styles.photoBtnText}>{uploading ? 'Subiendo...' : photoUrl ? 'Comprobante cargado ✓' : 'Foto del comprobante (recomendado)'}</Text>
      </TouchableOpacity>
      {!photoUrl && <Text style={styles.warning}>Sin foto el gasto quedará como "observado"</Text>}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Registrar Gasto</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  pickerWrapper: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 4 },
  photoBtn: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: '#d1d5db' },
  photoBtnText: { color: '#374151' },
  warning: { color: '#d97706', fontSize: 12, marginTop: 6 },
  submitBtn: { backgroundColor: '#0891b2', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
})
