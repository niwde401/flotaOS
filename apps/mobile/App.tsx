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
