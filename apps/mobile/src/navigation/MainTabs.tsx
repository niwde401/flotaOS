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
