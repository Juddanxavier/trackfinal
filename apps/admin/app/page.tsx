'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    const token = localStorage.getItem('track_access_token')
    window.location.href = token ? '/dashboard' : '/login'
  }, [])
  
  return null
}