"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Clock } from "lucide-react"
import { io, type Socket } from "socket.io-client"
import { FloatingChat } from "@/components/floating-chat"

interface Poll {
  id: string
  question: string
  options: string[]
  timeLimit: number
  isActive: boolean
  questionNumber: number
}

interface PollResult {
  option: string
  votes: number
  percentage: number
}

interface Student {
  id: string
  name: string
}

export default function StudentPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [studentName, setStudentName] = useState("")
  const [isNameSet, setIsNameSet] = useState(false)
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null)
  const [selectedOption, setSelectedOption] = useState("")
  const [hasAnswered, setHasAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [pollResults, setPollResults] = useState<PollResult[]>([])
  const [participants, setParticipants] = useState<Student[]>([])
  const [isWaiting, setIsWaiting] = useState(true)
  const [isKicked, setIsKicked] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Connecting...")

  useEffect(() => {
    const storedName = sessionStorage.getItem("studentName")
    if (storedName) {
      setStudentName(storedName)
      setIsNameSet(true)
    }

    const newSocket = io(window.location.origin, {
      transports: ["websocket", "polling"],
    })
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("Connected to server")
      setConnectionStatus("Connected")
      if (storedName) {
        newSocket.emit("joinAsStudent", { name: storedName })
      }
    })

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server")
      setConnectionStatus("Disconnected")
    })

    newSocket.on("pollStarted", (poll: Poll) => {
      console.log("Poll started:", poll)
      setCurrentPoll(poll)
      setTimeLeft(poll.timeLimit)
      setHasAnswered(false)
      setSelectedOption("")
      setIsWaiting(false)
    })

    newSocket.on("pollResults", (results: PollResult[]) => {
      console.log("Poll results:", results)
      setPollResults(results)
      setHasAnswered(true)
    })

    newSocket.on("pollEnded", () => {
      console.log("Poll ended")
      setCurrentPoll(null)
      setIsWaiting(true)
      setHasAnswered(false)
    })

    newSocket.on("participantsUpdate", (participants: Student[]) => {
      console.log("Participants updated:", participants)
      setParticipants(participants)
    })

    newSocket.on("timeUpdate", (time: number) => {
      setTimeLeft(time)
      if (time === 0 && !hasAnswered) {
        setHasAnswered(true)
      }
    })

    newSocket.on("studentKicked", () => {
      setIsKicked(true)
      sessionStorage.removeItem("studentName")
    })

    return () => {
      newSocket.close()
    }
  }, [hasAnswered])

  const handleNameSubmit = () => {
    if (studentName.trim() && socket) {
      sessionStorage.setItem("studentName", studentName)
      setIsNameSet(true)
      socket.emit("joinAsStudent", { name: studentName })
    }
  }

  const handleAnswerSubmit = () => {
    if (selectedOption && socket && currentPoll) {
      socket.emit("submitAnswer", {
        pollId: currentPoll.id,
        answer: selectedOption,
        studentName,
      })
      setHasAnswered(true)
    }
  }

  if (isKicked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center space-y-8">
          <div className="space-y-4">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-sm font-medium">
              INTERACTIVE POLL
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900">You've been Kicked out !</h1>
            <p className="text-gray-600">
              Looks like the teacher had removed you from the poll system. Please Try again sometime.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isNameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center space-y-8">
          <div className="space-y-4">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-sm font-medium">
              INTERACTIVE POLL
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900">Let's Get Started</h1>
            <p className="text-gray-600">
              If you're a student, you'll be able to <strong>submit your answers</strong>, participate in live polls,
              and see how your responses compare with your classmates
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-left">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Enter your Name
              </Label>
              <Input
                id="name"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Rahul Bajaj"
                className="mt-1"
                onKeyPress={(e) => e.key === "Enter" && handleNameSubmit()}
              />
            </div>
            <Button
              onClick={handleNameSubmit}
              disabled={!studentName.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-full font-medium"
            >
              Continue
            </Button>
            <p className="text-xs text-gray-500">Status: {connectionStatus}</p>
          </div>
        </div>
      </div>
    )
  }

  if (isWaiting || !currentPoll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-sm font-medium">
            INTERACTIVE POLL
          </Badge>
          <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
          <h2 className="text-2xl font-bold text-gray-900">Wait for the teacher to ask questions..</h2>
          <p className="text-sm text-gray-500">Status: {connectionStatus}</p>
          <p className="text-sm text-gray-500">Students online: {participants.length}</p>
        </div>
        <FloatingChat socket={socket} participants={participants} isTeacher={false} />
      </div>
    )
  }

  if (hasAnswered || timeLeft === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Question {currentPoll.questionNumber}</h1>
              <div className="flex items-center gap-2 text-red-600">
                <Clock className="w-4 h-4" />
                <span className="font-mono">00:{timeLeft.toString().padStart(2, "0")}</span>
              </div>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader className="bg-gray-700 text-white">
              <CardTitle className="text-lg">{currentPoll.question}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {pollResults.map((result, index) => (
                  <div key={result.option} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-purple-600 text-sm font-bold border-2 border-purple-200">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="font-medium text-gray-800">{result.option}</span>
                      </div>
                      <div className="bg-gray-100 px-3 py-1 rounded-md">
                        <span className="font-bold text-lg text-gray-800">{result.percentage}%</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-8">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-8 rounded-full transition-all duration-500 flex items-center justify-start pl-3"
                          style={{ width: `${result.percentage}%` }}
                        >
                          {result.percentage > 15 && (
                            <span className="text-white text-sm font-medium">{result.option}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-gray-600 text-lg">Wait for the teacher to ask a new question..</p>
          </div>
        </div>
        <FloatingChat socket={socket} participants={participants} isTeacher={false} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Question {currentPoll.questionNumber}</h1>
          <div className="flex items-center gap-2 text-red-600">
            <Clock className="w-4 h-4" />
            <span className="font-mono">00:{timeLeft.toString().padStart(2, "0")}</span>
          </div>
        </div>

        <Card>
          <CardHeader className="bg-gray-700 text-white">
            <CardTitle className="text-lg">{currentPoll.question}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              <div className="space-y-4">
                {currentPoll.options.map((option, index) => (
                  <div
                    key={option}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={option} />
                    <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <Label htmlFor={option} className="flex-1 cursor-pointer font-medium">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button
            onClick={handleAnswerSubmit}
            disabled={!selectedOption}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-full text-lg font-medium disabled:opacity-50"
          >
            Submit
          </Button>
        </div>
      </div>
      <FloatingChat socket={socket} participants={participants} isTeacher={false} />
    </div>
  )
}
