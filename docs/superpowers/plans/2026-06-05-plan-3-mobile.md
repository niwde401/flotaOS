# FlotaOS — Plan 3: Mobile App (Days 5–7)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React Native offline-first mobile app for field technicians: auth, trip management, event registration (salida, parada con fuerza mayor, taller), expense capture with photo, and a sync queue that uploads local WatermelonDB records to the API when online.

**Architecture:** Expo (managed workflow) → React Navigation (Stack + Tabs) → Zustand (auth state) → WatermelonDB (offline SQLite) → Sync Queue (polls every 30s) → Axios API client. Each screen is its own file. API client in `src/api/`. Local DB models in `src/db/`.

**Tech Stack:** Expo SDK 51, React Navigation 6, WatermelonDB, Zustand, Axios, @tanstack/react-query, expo-camera, expo-location, expo-file-system

**Prerequisite:** Plan 1 complete. Plan 2 API running at `http://localhost:3001` (or EasyPanel URL).

---

### Task 1: Project Structure + Environment Config

**Files:**
- Create: `apps/mobile/src/config.ts`
- Create: `apps/mobile/src/api/client.ts`
- Create: `apps/mobile/src/store/authStore.ts`
- Create: `apps/mobile/babel.config.js`

- [ ] **Step 1: Create babel.config.js with WatermelonDB decorators support**

Write `apps/mobile/babel.config.js`:

```javascript
module.exports = function(api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
    ],
  }
}
```

- [ ] **Step 2: Install WatermelonDB babel plugins**

```bash
cd apps/mobile
npm install @babel/plugin-proposal-decorators @babel/plugin-proposal-class-properties
```

- [ ] **Step 3: Create config.ts**

Write `apps/mobile/src/config.ts`:

```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'
export const SYNC_INTERVAL_MS = 30_000 // 30 seconds
```

- [ ] **Step 4: Create Axios client with JWT interceptor**

Write `apps/mobile/src/api/client.ts`:

```typescript
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../config'

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem('accessToken')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken')
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
        const newToken = res.data.data.accessToken
        await AsyncStorage.setItem('accessToken', newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken'])
      }
    }
    return Promise.reject(error)
  }
)
```

- [ ] **Step 5: Install AsyncStorage**

```bash
npx expo install @react-native-async-storage/async-storage
```

- [ ] **Step 6: Create Zustand auth store**

Write `apps/mobile/src/store/authStore.ts`:

```typescript
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiClient } from '../api/client'

interface AuthUser {
  id: string
  email: string
  role: string
  fullName: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password })
    const { accessToken, refreshToken, user } = res.data.data
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ])
    set({ user, isAuthenticated: true })
  },

  logout: async () => {
    const refreshToken = await AsyncStorage.getItem('refreshToken')
    await apiClient.post('/auth/logout', { refreshToken }).catch(() => {})
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user'])
    set({ user: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const [token, userStr] = await AsyncStorage.multiGet(['accessToken', 'user'])
    if (token[1] && userStr[1]) {
      set({ user: JSON.parse(userStr[1]), isAuthenticated: true, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },
}))
```

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/mobile/src/
git commit -m "feat: mobile api client, auth store, watermelondb babel config"
```

---

### Task 2: WatermelonDB — Local Database Models

**Files:**
- Create: `apps/mobile/src/db/index.ts`
- Create: `apps/mobile/src/db/models/TripModel.ts`
- Create: `apps/mobile/src/db/models/TripEventModel.ts`
- Create: `apps/mobile/src/db/models/ExpenseModel.ts`
- Create: `apps/mobile/src/db/schema.ts`

- [ ] **Step 1: Create TripModel**

Write `apps/mobile/src/db/models/TripModel.ts`:

```typescript
import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class TripModel extends Model {
  static table = 'trips'

  @field('server_id') serverId!: string | null
  @field('team_id') teamId!: string
  @field('vehicle_id') vehicleId!: string
  @field('driver_id') driverId!: string
  @field('origin') origin!: string
  @field('destination') destination!: string
  @field('status') status!: string
  @field('synced') synced!: boolean
  @date('trip_date') tripDate!: Date
  @readonly @date('created_at') createdAt!: Date
}
```

- [ ] **Step 2: Create TripEventModel**

Write `apps/mobile/src/db/models/TripEventModel.ts`:

```typescript
import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators'

function sanitizeStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v) => typeof v === 'string')
  return []
}

export default class TripEventModel extends Model {
  static table = 'trip_events'

  @field('server_id') serverId!: string | null
  @field('trip_id') tripId!: string
  @field('trip_server_id') tripServerId!: string | null
  @field('event_type') eventType!: string
  @field('latitude') latitude!: number
  @field('longitude') longitude!: number
  @field('photo_url') photoUrl!: string | null
  @field('notes') notes!: string | null
  @field('is_force_majeure') isForceMajeure!: boolean
  @field('fm_type') fmType!: string | null
  @json('fm_photos', sanitizeStringArray) fmPhotos!: string[]
  @field('diagnostico') diagnostico!: string | null
  @field('km_entrada') kmEntrada!: number | null
  @field('km_salida') kmSalida!: number | null
  @field('trabajos_realizados') trabajosRealizados!: string | null
  @field('synced') synced!: boolean
  @date('recorded_at') recordedAt!: Date
  @readonly @date('created_at') createdAt!: Date
}
```

- [ ] **Step 3: Create ExpenseModel**

Write `apps/mobile/src/db/models/ExpenseModel.ts`:

```typescript
import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class ExpenseModel extends Model {
  static table = 'expenses'

  @field('server_id') serverId!: string | null
  @field('trip_id') tripId!: string | null
  @field('trip_server_id') tripServerId!: string | null
  @field('concept') concept!: string
  @field('description') description!: string | null
  @field('node_code') nodeCode!: string | null
  @field('vehicle_plate') vehiclePlate!: string | null
  @field('amount') amount!: number
  @field('voucher_type') voucherType!: string | null
  @field('voucher_number') voucherNumber!: string | null
  @field('photo_url') photoUrl!: string | null
  @field('photo_local_path') photoLocalPath!: string | null
  @field('status') status!: string
  @field('synced') synced!: boolean
  @date('transaction_date') transactionDate!: Date
  @readonly @date('created_at') createdAt!: Date
}
```

- [ ] **Step 4: Create schema**

Write `apps/mobile/src/db/schema.ts`:

```typescript
import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'trips',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'team_id', type: 'string' },
        { name: 'vehicle_id', type: 'string' },
        { name: 'driver_id', type: 'string' },
        { name: 'origin', type: 'string' },
        { name: 'destination', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'synced', type: 'boolean' },
        { name: 'trip_date', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'trip_events',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'trip_id', type: 'string' },
        { name: 'trip_server_id', type: 'string', isOptional: true },
        { name: 'event_type', type: 'string' },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'photo_url', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'is_force_majeure', type: 'boolean' },
        { name: 'fm_type', type: 'string', isOptional: true },
        { name: 'fm_photos', type: 'string', isOptional: true },
        { name: 'diagnostico', type: 'string', isOptional: true },
        { name: 'km_entrada', type: 'number', isOptional: true },
        { name: 'km_salida', type: 'number', isOptional: true },
        { name: 'trabajos_realizados', type: 'string', isOptional: true },
        { name: 'synced', type: 'boolean' },
        { name: 'recorded_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'expenses',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'trip_id', type: 'string', isOptional: true },
        { name: 'trip_server_id', type: 'string', isOptional: true },
        { name: 'concept', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'node_code', type: 'string', isOptional: true },
        { name: 'vehicle_plate', type: 'string', isOptional: true },
        { name: 'amount', type: 'number' },
        { name: 'voucher_type', type: 'string', isOptional: true },
        { name: 'voucher_number', type: 'string', isOptional: true },
        { name: 'photo_url', type: 'string', isOptional: true },
        { name: 'photo_local_path', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'synced', type: 'boolean' },
        { name: 'transaction_date', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
})
```

- [ ] **Step 5: Create database instance**

Write `apps/mobile/src/db/index.ts`:

```typescript
import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import schema from './schema'
import TripModel from './models/TripModel'
import TripEventModel from './models/TripEventModel'
import ExpenseModel from './models/ExpenseModel'

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'flotaos',
  jsi: true,
  onSetUpError: (error) => console.error('WatermelonDB setup error:', error),
})

export const database = new Database({
  adapter,
  modelClasses: [TripModel, TripEventModel, ExpenseModel],
})

export { TripModel, TripEventModel, ExpenseModel }
```

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/mobile/src/db/
git commit -m "feat: WatermelonDB schema and models for offline trip events and expenses"
```

---

### Task 3: Navigation Setup + App Entry

**Files:**
- Modify: `apps/mobile/App.tsx`
- Create: `apps/mobile/src/navigation/AppNavigator.tsx`
- Create: `apps/mobile/src/navigation/AuthNavigator.tsx`
- Create: `apps/mobile/src/navigation/MainTabs.tsx`

- [ ] **Step 1: Install navigation packages**

```bash
cd apps/mobile
npx expo install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler
```

- [ ] **Step 2: Create AuthNavigator**

Write `apps/mobile/src/navigation/AuthNavigator.tsx`:

```typescript
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import LoginScreen from '../screens/LoginScreen'

export type AuthStackParams = {
  Login: undefined
}

const Stack = createStackNavigator<AuthStackParams>()

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  )
}
```

- [ ] **Step 3: Create MainTabs**

Write `apps/mobile/src/navigation/MainTabs.tsx`:

```typescript
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import InicioScreen from '../screens/InicioScreen'
import GastosListScreen from '../screens/gastos/GastosListScreen'
import PerfilScreen from '../screens/PerfilScreen'

const Tab = createBottomTabNavigator()

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Inicio" component={InicioScreen} options={{ title: 'Viaje Activo' }} />
      <Tab.Screen name="Gastos" component={GastosListScreen} options={{ title: 'Mis Gastos' }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  )
}
```

- [ ] **Step 4: Create AppNavigator**

Write `apps/mobile/src/navigation/AppNavigator.tsx`:

```typescript
import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { useAuthStore } from '../store/authStore'
import { AuthNavigator } from './AuthNavigator'
import { MainTabs } from './MainTabs'
import SalidaScreen from '../screens/eventos/SalidaScreen'
import ParadaScreen from '../screens/eventos/ParadaScreen'
import FinActividadesScreen from '../screens/eventos/FinActividadesScreen'
import IngresoTallerScreen from '../screens/eventos/IngresoTallerScreen'
import SalidaTallerScreen from '../screens/eventos/SalidaTallerScreen'
import NuevoGastoScreen from '../screens/gastos/NuevoGastoScreen'

export type RootStackParams = {
  Auth: undefined
  Main: undefined
  Salida: { tripId: string }
  Parada: { tripId: string }
  FinActividades: { tripId: string }
  IngresoTaller: { tripId: string }
  SalidaTaller: { tripId: string; ordenTrabajoId: string }
  NuevoGasto: { tripId?: string }
}

const Stack = createStackNavigator<RootStackParams>()

export function AppNavigator() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => { checkAuth() }, [])

  if (isLoading) return null

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Salida" component={SalidaScreen} options={{ headerShown: true, title: 'Salida' }} />
            <Stack.Screen name="Parada" component={ParadaScreen} options={{ headerShown: true, title: 'Parada' }} />
            <Stack.Screen name="FinActividades" component={FinActividadesScreen} options={{ headerShown: true, title: 'Fin de Actividades' }} />
            <Stack.Screen name="IngresoTaller" component={IngresoTallerScreen} options={{ headerShown: true, title: 'Ingreso a Taller' }} />
            <Stack.Screen name="SalidaTaller" component={SalidaTallerScreen} options={{ headerShown: true, title: 'Salida de Taller' }} />
            <Stack.Screen name="NuevoGasto" component={NuevoGastoScreen} options={{ headerShown: true, title: 'Nuevo Gasto' }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

- [ ] **Step 5: Update App.tsx**

Write `apps/mobile/App.tsx`:

```typescript
import 'react-native-gesture-handler'
import React from 'react'
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider'
import { database } from './src/db'
import { AppNavigator } from './src/navigation/AppNavigator'

export default function App() {
  return (
    <DatabaseProvider database={database}>
      <AppNavigator />
    </DatabaseProvider>
  )
}
```

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/mobile/
git commit -m "feat: navigation structure with auth guard and screen stacks"
```

---

### Task 4: Login Screen

**Files:**
- Create: `apps/mobile/src/screens/LoginScreen.tsx`

- [ ] **Step 1: Create LoginScreen**

Write `apps/mobile/src/screens/LoginScreen.tsx`:

```typescript
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useAuthStore } from '../store/authStore'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Email y contraseña requeridos')
      return
    }
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Error al iniciar sesión'
      Alert.alert('Error de acceso', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.title}>FlotaOS</Text>
      <Text style={styles.subtitle}>YOFC Perú</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Ingresar</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, backgroundColor: '#f5f5f5' },
  title: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', color: '#1e40af', marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#6b7280', marginBottom: 40 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, marginBottom: 16,
  },
  button: {
    backgroundColor: '#1e40af', borderRadius: 8, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
```

- [ ] **Step 2: Create placeholder screens (so navigation doesn't crash)**

Create these minimal screens:

`apps/mobile/src/screens/PerfilScreen.tsx`:
```typescript
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
```

- [ ] **Step 3: Start app and verify login works**

```bash
cd apps/mobile
npx expo start
```

On simulator/device: enter `coord@yofc.pe` / `Admin1234!` → should navigate to main tabs.

- [ ] **Step 4: Commit**

```bash
cd ../..
git add apps/mobile/src/screens/
git commit -m "feat: login screen with JWT auth and session persistence"
```

---

### Task 5: Inicio Screen — Active Trip

**Files:**
- Create: `apps/mobile/src/screens/InicioScreen.tsx`
- Create: `apps/mobile/src/api/trips.ts`

- [ ] **Step 1: Create trips API module**

Write `apps/mobile/src/api/trips.ts`:

```typescript
import { apiClient } from './client'
import { TripDTO, CreateTripDTO, CreateEventDTO, TripEventDTO } from '@flotaos/shared'

export const tripsApi = {
  list: async (date?: string) => {
    const res = await apiClient.get('/api/trips', { params: { date } })
    return res.data.data as TripDTO[]
  },

  create: async (dto: CreateTripDTO) => {
    const res = await apiClient.post('/api/trips', dto)
    return res.data.data as TripDTO
  },

  get: async (id: string) => {
    const res = await apiClient.get(`/api/trips/${id}`)
    return res.data.data as TripDTO
  },

  createEvent: async (tripId: string, dto: CreateEventDTO) => {
    const res = await apiClient.post(`/api/trips/${tripId}/events`, dto)
    return res.data.data
  },

  getEvents: async (tripId: string) => {
    const res = await apiClient.get(`/api/trips/${tripId}/events`)
    return res.data.data as TripEventDTO[]
  },
}
```

- [ ] **Step 2: Create InicioScreen**

Write `apps/mobile/src/screens/InicioScreen.tsx`:

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
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
```

- [ ] **Step 3: Commit**

```bash
cd ../..
git add apps/mobile/src/screens/InicioScreen.tsx apps/mobile/src/api/trips.ts
git commit -m "feat: inicio screen with today trip and action buttons"
```

---

### Task 6: Event Screens (Salida, Parada/FM, Fin, Taller)

**Files:**
- Create: `apps/mobile/src/screens/eventos/SalidaScreen.tsx`
- Create: `apps/mobile/src/screens/eventos/ParadaScreen.tsx`
- Create: `apps/mobile/src/screens/eventos/FinActividadesScreen.tsx`
- Create: `apps/mobile/src/screens/eventos/IngresoTallerScreen.tsx`
- Create: `apps/mobile/src/screens/eventos/SalidaTallerScreen.tsx`
- Create: `apps/mobile/src/hooks/useLocation.ts`
- Create: `apps/mobile/src/hooks/usePhotoUpload.ts`

- [ ] **Step 1: Create useLocation hook**

Write `apps/mobile/src/hooks/useLocation.ts`:

```typescript
import { useState, useEffect } from 'react'
import * as Location from 'expo-location'

export function useLocation() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado')
        return
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
      } catch {
        setError('Error obteniendo ubicación')
      }
    })()
  }, [])

  return { coords, error }
}
```

- [ ] **Step 2: Install expo-location**

```bash
cd apps/mobile && npx expo install expo-location expo-image-picker
```

- [ ] **Step 3: Create usePhotoUpload hook**

Write `apps/mobile/src/hooks/usePhotoUpload.ts`:

```typescript
import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { apiClient } from '../api/client'

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false)

  async function pickAndUpload(): Promise<string | null> {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return null

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    })

    if (result.canceled || !result.assets[0]) return null

    const asset = result.assets[0]
    const formData = new FormData()
    formData.append('photo', {
      uri: asset.uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any)

    setUploading(true)
    try {
      const res = await apiClient.post('/api/uploads/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data.data.url as string
    } catch {
      return null
    } finally {
      setUploading(false)
    }
  }

  return { pickAndUpload, uploading }
}
```

- [ ] **Step 4: Create SalidaScreen (llegada_sitio event)**

Write `apps/mobile/src/screens/eventos/SalidaScreen.tsx`:

```typescript
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
    if (!coords) {
      Alert.alert('Error', 'Esperando ubicación GPS...')
      return
    }
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
```

- [ ] **Step 5: Create ParadaScreen (with Force Majeure)**

Write `apps/mobile/src/screens/eventos/ParadaScreen.tsx`:

```typescript
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
  const { coords } = useLocation()
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
      <Text style={styles.label}>GPS: {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Obteniendo...'}</Text>

      <TextInput style={styles.input} placeholder="Motivo de parada" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

      <View style={styles.row}>
        <Text style={styles.fmLabel}>Fuerza Mayor</Text>
        <Switch value={isFM} onValueChange={setIsFM} trackColor={{ true: '#dc2626' }} />
      </View>

      {isFM && (
        <View style={styles.fmSection}>
          <Text style={styles.fmSectionLabel}>Tipo de Fuerza Mayor</Text>
          <Picker selectedValue={fmType} onValueChange={(v) => setFmType(v as ForceMajeureType)}>
            {FM_OPTIONS.map((opt) => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
          </Picker>

          <Text style={styles.fmSectionLabel}>Fotos de evidencia ({fmPhotos.length}/3)</Text>
          {fmPhotos.map((_, i) => (
            <Text key={i} style={styles.photoConfirm}>✓ Foto {i + 1} cargada</Text>
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
})
```

- [ ] **Step 6: Install Picker**

```bash
cd apps/mobile && npx expo install @react-native-picker/picker
```

- [ ] **Step 7: Create FinActividadesScreen**

Write `apps/mobile/src/screens/eventos/FinActividadesScreen.tsx`:

```typescript
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../navigation/AppNavigator'
import { useLocation } from '../../hooks/useLocation'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { tripsApi } from '../../api/trips'
import { EventType } from '@flotaos/shared'

type Props = StackScreenProps<RootStackParams, 'FinActividades'>

export default function FinActividadesScreen({ route, navigation }: Props) {
  const { tripId } = route.params
  const { coords } = useLocation()
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
    <View style={styles.container}>
      <Text style={styles.label}>GPS: {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Obteniendo...'}</Text>
      <TextInput style={styles.input} placeholder="Observaciones finales" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
      <TouchableOpacity style={styles.photoBtn} onPress={async () => { const url = await pickAndUpload(); if (url) setPhotoUrl(url) }} disabled={uploading}>
        <Text style={styles.photoBtnText}>{uploading ? 'Subiendo...' : photoUrl ? 'Foto cargada ✓' : 'Foto final (opcional)'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting || !coords}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Finalizar Actividades</Text>}
      </TouchableOpacity>
    </View>
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
})
```

- [ ] **Step 8: Create IngresoTallerScreen**

Write `apps/mobile/src/screens/eventos/IngresoTallerScreen.tsx`:

```typescript
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
      Alert.alert('Registrado', `OT creada: ${result.ordenTrabajo?.numeroOt}`, [{ text: 'OK', onPress: () => navigation.goBack() }])
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Error al registrar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Diagnóstico</Text>
      <TextInput style={styles.input} placeholder="Describe el problema" value={diagnostico} onChangeText={setDiagnostico} multiline numberOfLines={4} />

      <Text style={styles.sectionTitle}>Km de Entrada</Text>
      <TextInput style={styles.inputShort} placeholder="Ej: 45200" value={kmEntrada} onChangeText={setKmEntrada} keyboardType="numeric" />

      <TouchableOpacity style={styles.photoBtn} onPress={async () => { const url = await pickAndUpload(); if (url) setPhotoUrl(url) }} disabled={uploading}>
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
```

- [ ] **Step 9: Create SalidaTallerScreen**

Write `apps/mobile/src/screens/eventos/SalidaTallerScreen.tsx`:

```typescript
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
  const { coords } = useLocation()
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
      <TextInput style={styles.input} placeholder="Describe los trabajos y repuestos" value={trabajos} onChangeText={setTrabajos} multiline numberOfLines={5} />

      <Text style={styles.sectionTitle}>Km de Salida</Text>
      <TextInput style={styles.inputShort} placeholder="Ej: 45350" value={kmSalida} onChangeText={setKmSalida} keyboardType="numeric" />

      <Text style={styles.gpsLabel}>GPS: {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Obteniendo...'}</Text>

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
})
```

- [ ] **Step 10: Commit**

```bash
cd ../..
git add apps/mobile/src/screens/eventos/ apps/mobile/src/hooks/
git commit -m "feat: all trip event screens - salida, parada/FM, fin, ingreso/salida taller"
```

---

### Task 7: Expense Screens + Offline Sync Queue

**Files:**
- Create: `apps/mobile/src/screens/gastos/GastosListScreen.tsx`
- Create: `apps/mobile/src/screens/gastos/NuevoGastoScreen.tsx`
- Create: `apps/mobile/src/sync/syncQueue.ts`
- Create: `apps/mobile/src/api/expenses.ts`

- [ ] **Step 1: Create expenses API module**

Write `apps/mobile/src/api/expenses.ts`:

```typescript
import { apiClient } from './client'
import { CreateExpenseDTO, ExpenseDTO } from '@flotaos/shared'

export const expensesApi = {
  list: async (month?: string) => {
    const res = await apiClient.get('/api/expenses', { params: { month } })
    return res.data.data as ExpenseDTO[]
  },

  create: async (dto: CreateExpenseDTO) => {
    const res = await apiClient.post('/api/expenses', dto)
    return res.data.data as ExpenseDTO
  },
}
```

- [ ] **Step 2: Create NuevoGastoScreen**

Write `apps/mobile/src/screens/gastos/NuevoGastoScreen.tsx`:

```typescript
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
        transactionDate: new Date().toISOString().split('T')[0],
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
```

- [ ] **Step 3: Create GastosListScreen**

Write `apps/mobile/src/screens/gastos/GastosListScreen.tsx`:

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
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

  useEffect(() => {
    expensesApi.list().then(setExpenses).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => nav.navigate('NuevoGasto', {})}>
        <Text style={styles.addText}>+ Nuevo Gasto</Text>
      </TouchableOpacity>

      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemTop}>
              <Text style={styles.concept}>{item.concept.replace('_', ' ')}</Text>
              <Text style={[styles.status, { color: STATUS_COLORS[item.status] || '#374151' }]}>{item.status}</Text>
            </View>
            <Text style={styles.amount}>S/. {Number(item.amount).toFixed(2)}</Text>
            <Text style={styles.date}>{new Date(item.transactionDate).toLocaleDateString('es-PE')}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Sin gastos este mes</Text>}
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
})
```

- [ ] **Step 4: Create sync queue**

Write `apps/mobile/src/sync/syncQueue.ts`:

```typescript
import { database, TripEventModel, ExpenseModel } from '../db'
import { Q } from '@nozbe/watermelondb'
import { tripsApi } from '../api/trips'
import { expensesApi } from '../api/expenses'
import { ConceptType, EventType } from '@flotaos/shared'

let syncRunning = false

export async function runSync(): Promise<void> {
  if (syncRunning) return
  syncRunning = true

  try {
    // Sync unsynced trip events
    const unsyncedEvents = await database.get<TripEventModel>('trip_events')
      .query(Q.where('synced', false))
      .fetch()

    for (const ev of unsyncedEvents) {
      if (!ev.tripServerId) continue // Need server trip ID
      try {
        await tripsApi.createEvent(ev.tripServerId, {
          eventType: ev.eventType as EventType,
          latitude: ev.latitude,
          longitude: ev.longitude,
          notes: ev.notes ?? undefined,
          photoUrl: ev.photoUrl ?? undefined,
          isForceMajeure: ev.isForceMajeure,
          fmType: ev.fmType as any ?? undefined,
          fmPhotos: ev.fmPhotos?.length ? ev.fmPhotos : undefined,
          diagnostico: ev.diagnostico ?? undefined,
          kmEntrada: ev.kmEntrada ?? undefined,
          kmSalida: ev.kmSalida ?? undefined,
          trabajosRealizados: ev.trabajosRealizados ?? undefined,
        })
        await database.write(async () => {
          await ev.update((e) => { e.synced = true })
        })
      } catch (err) {
        console.warn('Sync event failed:', err)
      }
    }

    // Sync unsynced expenses
    const unsyncedExpenses = await database.get<ExpenseModel>('expenses')
      .query(Q.where('synced', false))
      .fetch()

    for (const exp of unsyncedExpenses) {
      try {
        await expensesApi.create({
          tripId: exp.tripServerId ?? undefined,
          concept: exp.concept as ConceptType,
          description: exp.description ?? undefined,
          amount: exp.amount,
          photoUrl: exp.photoUrl ?? undefined,
          transactionDate: new Date(exp.transactionDate).toISOString().split('T')[0],
        })
        await database.write(async () => {
          await exp.update((e) => { e.synced = true })
        })
      } catch (err) {
        console.warn('Sync expense failed:', err)
      }
    }
  } finally {
    syncRunning = false
  }
}

export function startSyncInterval(intervalMs = 30000): () => void {
  const id = setInterval(runSync, intervalMs)
  return () => clearInterval(id)
}
```

- [ ] **Step 5: Start sync interval in App.tsx**

Edit `apps/mobile/App.tsx`:

```typescript
import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider'
import { database } from './src/db'
import { AppNavigator } from './src/navigation/AppNavigator'
import { startSyncInterval } from './src/sync/syncQueue'

export default function App() {
  useEffect(() => {
    const stop = startSyncInterval(30000)
    return stop
  }, [])

  return (
    <DatabaseProvider database={database}>
      <AppNavigator />
    </DatabaseProvider>
  )
}
```

- [ ] **Step 6: Final mobile test**

```bash
cd apps/mobile && npx expo start
```

Test flow:
1. Login with `driver@yofc.pe` / `Admin1234!`
2. View inicio screen with active trip
3. Navigate to Salida → register arrival
4. Navigate to Parada → toggle FM → add 3 photos → register
5. Navigate to Nuevo Gasto → add amount → add receipt photo → submit
6. View gastos list

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/mobile/src/screens/gastos/ apps/mobile/src/sync/ apps/mobile/App.tsx
git commit -m "feat: expense screens and offline sync queue — mobile MVP complete"
```

---

**Plan 3 complete. Mobile MVP is functional. Plan 4 (Web) can now proceed.**
