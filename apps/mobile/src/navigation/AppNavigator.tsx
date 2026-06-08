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
  SalidaTaller: { tripId: string; ordenTrabajoId?: string }
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
