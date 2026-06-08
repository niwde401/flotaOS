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
