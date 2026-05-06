import { redirect } from 'next/navigation'

export default function Home() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('track_access_token') : null
  
  if (token) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}