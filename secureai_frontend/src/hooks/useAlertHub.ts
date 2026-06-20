import { useEffect, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import type { AlertDto } from '../types'

export function useAlertHub(onNewAlert?: (alert: AlertDto) => void) {
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const [connected, setConnected] = useState(false)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    let stopped = false

    const connect = () => {
      if (stopped) return

      const connection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/alerts', {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect([2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Error)   // bỏ Warning spam
        .build()

      connection.on('NewAlert', (alert: AlertDto) => {
        onNewAlert?.(alert)
      })

      connection.onclose(() => {
        setConnected(false)
        // Thử lại sau 15s nếu chưa unmount
        if (!stopped) {
          retryRef.current = setTimeout(connect, 15000)
        }
      })

      connection.onreconnected(() => setConnected(true))
      connection.onreconnecting(() => setConnected(false))

      connection.start()
        .then(() => setConnected(true))
        .catch(() => {
          // Backend chưa chạy — thử lại sau 10s, không log lên console
          if (!stopped) {
            retryRef.current = setTimeout(connect, 10000)
          }
        })

      connectionRef.current = connection
    }

    connect()

    return () => {
      stopped = true
      if (retryRef.current) clearTimeout(retryRef.current)
      connectionRef.current?.stop().catch(() => {})
    }
  }, [])

  return { connected }
}
