"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Send, Users, MessageCircle, X, Minimize2 } from "lucide-react"
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

interface FloatingChatProps {
  socket: Socket | null
  participants: Student[]
  isTeacher: boolean
  onKickStudent?: (studentId: string) => void
}

export function FloatingChat({ socket, participants, isTeacher, onKickStudent }: FloatingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [activeTab, setActiveTab] = useState("participants")
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!socket) return

    socket.on("chatMessage", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message])
      if (!isOpen || isMinimized) {
        setUnreadCount((prev) => prev + 1)
      }
    })

    socket.on("chatHistory", (history: ChatMessage[]) => {
      setMessages(history)
    })

    return () => {
      socket.off("chatMessage")
      socket.off("chatHistory")
    }
  }, [socket, isOpen, isMinimized])

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

  const openChat = () => {
    setIsOpen(true)
    setIsMinimized(false)
    setUnreadCount(0)
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const minimizeChat = () => {
    setIsMinimized(true)
  }

  const restoreChat = () => {
    setIsMinimized(false)
    setUnreadCount(0)
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={openChat}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 relative"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          {isMinimized ? (
            <Card className="w-80 cursor-pointer" onClick={restoreChat}>
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-medium">Chat</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">{unreadCount > 99 ? "99+" : unreadCount}</Badge>
                    )}
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 h-6 w-6 p-0">
                      <MessageCircle className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ) : (
            <Card className="w-80 h-96 flex flex-col shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-medium">Live Chat</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={minimizeChat}
                      className="text-white hover:bg-white/20 h-6 w-6 p-0"
                    >
                      <Minimize2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeChat}
                      className="text-white hover:bg-white/20 h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 bg-white/20">
                    <TabsTrigger
                      value="chat"
                      className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-600"
                    >
                      Chat
                    </TabsTrigger>
                    <TabsTrigger
                      value="participants"
                      className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-600"
                    >
                      Participants
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                <Tabs value={activeTab} className="flex-1 flex flex-col">
                  <TabsContent value="chat" className="flex-1 flex flex-col mt-0 p-4">
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4 border rounded-lg p-3 bg-gray-50">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm py-8">
                          No messages yet. Start the conversation!
                        </div>
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

                  <TabsContent value="participants" className="flex-1 mt-0 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <Users className="w-4 h-4" />
                        <span>Online Students: {participants.length}</span>
                      </div>

                      <div className="space-y-1">
                        {participants.length === 0 ? (
                          <div className="text-center text-gray-500 text-sm py-8">No students online</div>
                        ) : (
                          <>
                            {/* Header */}
                            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md text-sm font-medium text-gray-700 border-b-2 border-purple-200">
                              <span>Name</span>
                              <span>Action</span>
                            </div>

                            {/* Student List */}
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {participants.map((participant) => (
                                <div
                                  key={participant.id}
                                  className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded-md"
                                >
                                  <span className="text-sm font-medium text-gray-800">{participant.name}</span>
                                  {isTeacher && onKickStudent && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onKickStudent(participant.id)}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-3 text-sm font-medium"
                                    >
                                      Kick out
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  )
}
