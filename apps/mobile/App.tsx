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
