import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParams } from '../../navigation/AppNavigator'
import { expensesApi } from '../../api/expenses'
import { ExpenseDTO } from '@flotaos/shared'

type Nav = StackNavigationProp<RootStackParams>

const STATUS_COLORS: Record<string, string> = {
  pendiente: '#d97706',
  rendido: '#16a34a',
  observado: '#dc2626',
  en_reembolso: '#7c3aed',
  depositado: '#0891b2',
}

export default function GastosListScreen() {
  const nav = useNavigation<Nav>()
  const [expenses, setExpenses] = useState<ExpenseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const data = await expensesApi.list()
      setExpenses(data)
    } catch {
      setError('Error cargando gastos')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => nav.navigate('NuevoGasto', {})}>
        <Text style={styles.addText}>+ Nuevo Gasto</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemTop}>
              <Text style={styles.concept}>{item.concept.replace(/_/g, ' ')}</Text>
              <Text style={[styles.status, { color: STATUS_COLORS[item.status] || '#374151' }]}>{item.status}</Text>
            </View>
            <Text style={styles.amount}>S/. {Number(item.amount).toFixed(2)}</Text>
            <Text style={styles.date}>{new Date(item.transactionDate).toLocaleDateString('es-PE')}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Sin gastos registrados</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn: { backgroundColor: '#0891b2', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16 },
  addText: { color: '#fff', fontWeight: '600' },
  item: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between' },
  concept: { fontWeight: '600', color: '#111827', textTransform: 'capitalize' },
  status: { fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 18, color: '#1e40af', marginTop: 4 },
  date: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
  errorText: { color: '#dc2626', textAlign: 'center', marginBottom: 12 },
})
