import { useState, useEffect } from 'react'
import type { Announcement, AnnouncementData } from '../types'

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/announcements.json')
      .then(res => res.json())
      .then((data: AnnouncementData) => {
        setAnnouncements(data.announcements)
        setLoading(false)
      })
      .catch(() => {
        setError('방송문 데이터를 불러올 수 없습니다.')
        setLoading(false)
      })
  }, [])

  return { announcements, loading, error }
}
