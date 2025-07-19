"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Send, Users, MessageCircle } from "lucide-react"
import type { Socket } from "socket.io-client"

interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: Date
  isTeacher: boolean
}

interface Student {
  id: string
  name: string
}

interface ChatPanelProps {
  socket: Socket | null
  participants: Student[]
  isTeacher: boolean
  onKickStudent?: (studentId: string) => void
}

export function ChatPanel({ socket, participants, isTeacher, onKickStudent }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [activeTab, setActiveTab] = useState("participants")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!socket) return

    socket.on("chatMessage", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message])
    })

    socket.on("chatHistory", (history: ChatMessage[]) => {
      setMessages(history)
    })

    return () => {
      socket.off("chatMessage")
      socket.off("chatHistory")
    }
  }, [socket])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.emit("sendChatMessage", {
        message: newMessage.trim(),
        isTeacher,
      })
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  return (
    <Card className="w-80 h-96 flex flex-col">
      <CardHeader className="pb-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participants
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <Tabs value={activeTab} className="flex-1 flex flex-col">
          <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 border rounded-lg p-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={msg.isTeacher ? "default" : "secondary"} className="text-xs">
                        {msg.isTeacher ? "Teacher" : "Student"}
                      </Badge>
                      <span className="text-xs font-medium">{msg.sender}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-sm bg-white p-2 rounded border">{msg.message}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim()} size="sm">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="participants" className="flex-1 mt-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Users className="w-4 h-4" />
                <span>Online Students: {participants.length}</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {participants.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">No students online</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-600 pb-2 border-b">
                      <span>Name</span>
                      <span>Action</span>
                    </div>
                    {participants.map((participant) => (
                      <div key={participant.id} className="grid grid-cols-2 gap-2 items-center py-1">
                        <span className="text-sm truncate">{participant.name}</span>
                        {isTeacher && onKickStudent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onKickStudent(participant.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 px-2 text-xs"
                          >
                            Kick out
                          </Button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
