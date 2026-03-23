import axios from 'axios'
import { useEffect, useRef, useState } from 'react'

export interface Message {
  sender: 'user' | 'bot'
  text: string
}

/** Normalize OpenAI `message.content` (string, null, or multimodal parts). */
function assistantContentToText(content: unknown): string {
  if (content == null) return ''
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text?: string }).text ?? '')
        }
        return ''
      })
      .filter(Boolean)
      .join('')
  }
  return String(content)
}

const SYSTEM_PROMPT =
  'You are a helpful, concise assistant in a React chat app.'

const useChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesRef = useRef<Message[]>([])
  const inFlightRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const sendMessage = async (message: string) => {
    const trimmed = message.trim()
    if (!trimmed) return

    // Block overlapping calls (avoids wrong reply order / double "Thinking…")
    if (inFlightRef.current) return
    inFlightRef.current = true

    const userMsg: Message = { text: trimmed, sender: 'user' }
    const conversation = [...messagesRef.current, userMsg]
    setMessages(conversation)
    messagesRef.current = conversation

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
    if (!apiKey?.trim()) {
      const hint: Message = {
        text: 'Missing API key. In the same folder as package.json, edit `.env`: VITE_OPENAI_API_KEY=sk-... then restart `npm run dev`.',
        sender: 'bot',
      }
      setMessages((prev) => {
        const next = [...prev, hint]
        messagesRef.current = next
        return next
      })
      inFlightRef.current = false
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    try {
      const openaiMessages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        ...conversation.map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        })),
      ]

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: openaiMessages,
        },
        {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const choice = response.data?.choices?.[0]
      const raw = choice?.message?.content
      const text = assistantContentToText(raw).trim()
      const botMsg: Message = {
        text: text || 'No reply text from the model.',
        sender: 'bot',
      }

      setMessages((prev) => {
        const next = [...prev, botMsg]
        messagesRef.current = next
        return next
      })
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
        return
      }
      console.error('Error fetching AI response:', error)
      const errText = axios.isAxiosError(error)
        ? String(
            (error.response?.data as { error?: { message?: string } })?.error
              ?.message ?? error.message
          )
        : 'Something went wrong. Check your API key and network.'
      const errMsg: Message = { text: errText, sender: 'bot' }
      setMessages((prev) => {
        const next = [...prev, errMsg]
        messagesRef.current = next
        return next
      })
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
      inFlightRef.current = false
      setIsLoading(false)
    }
  }

  return { messages, sendMessage, isLoading }
}

export default useChatbot
