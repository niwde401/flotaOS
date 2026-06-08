import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { apiClient } from '../api/client'

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false)

  async function pickAndUpload(): Promise<string | null> {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return null

    // SDK 56 / expo-image-picker v16: mediaTypes takes a string array, not MediaTypeOptions enum
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    })

    if (result.canceled || !result.assets?.[0]) return null

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
