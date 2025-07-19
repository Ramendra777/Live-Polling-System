"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Plus, History, Trophy, Medal, Award } from "lucide-react"
import { io, type Socket } from "socket.io-client"
import { FloatingChat } from "@/components/floating-chat"

interface Poll {
  id: string
  question: string
  options: string[]
  timeLimit: number
  isActive: boolean
  createdAt: Date
  questionNumber: number
  correctAnswer?: string | null
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

interface StudentRanking {
  id: string
  name: string
  score: number
  correctAnswers: number
  totalAnswers: number
  accuracy: number
  rank: number
}

interface PollHistory {
  id: string
  question: string
  options: string[]
  results: PollResult[]
  createdAt: Date
  questionNumber: number
  correctAnswer?: string
}

export default function TeacherPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["Option A", "Option B"])
  const [timeLimit, setTimeLimit] = useState(60)
  const [correctAnswer, setCorrectAnswer] = useState("none")
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null)
  const [pollResults, setPollResults] = useState<PollResult[]>([])
  const [participants, setParticipants] = useState<Student[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [pollHistory, setPollHistory] = useState<PollHistory[]>([])
  const [studentRankings, setStudentRankings] = useState<StudentRanking[]>([])
  const [activeTab, setActiveTab] = useState("create")
  const [connectionStatus, setConnectionStatus] = useState("Connecting...")

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ["websocket", "polling"],
    })
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("Teacher connected to server")
      setConnectionStatus("Connected")
      newSocket.emit("joinAsTeacher")
    })

    newSocket.on("disconnect", () => {
      console.log("Teacher disconnected from server")
      setConnectionStatus("Disconnected")
    })

    newSocket.on("pollResults", (results: PollResult[]) => {
      console.log("Poll results received:", results)
      setPollResults(results)
    })

    newSocket.on("participantsUpdate", (participants: Student[]) => {
      console.log("Participants updated:", participants)
      setParticipants(participants)
    })

    newSocket.on("studentRankings", (rankings: StudentRanking[]) => {
      console.log("Student rankings updated:", rankings)
      setStudentRankings(rankings)
    })

    newSocket.on("timeUpdate", (time: number) => {
      setTimeLeft(time)
    })

    newSocket.on("pollEnded", (poll: Poll, results: PollResult[]) => {
      console.log("Poll ended:", poll, results)
      setCurrentPoll(null)
      setPollHistory((prev) => [
        ...prev,
        {
          id: poll.id,
          question: poll.question,
          options: poll.options,
          results,
          createdAt: poll.createdAt,
          questionNumber: poll.questionNumber,
          correctAnswer: poll.correctAnswer,
        },
      ])
      setActiveTab("create")
    })

    return () => {
      newSocket.close()
    }
  }, [])

  const addOption = () => {
    setOptions([...options, "Option " + (options.length + 1)])
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const startPoll = () => {
    if (question.trim() && options.every((opt) => opt.trim()) && socket) {
      // End current poll if one exists
      if (currentPoll) {
        socket.emit("endPoll", currentPoll.id)
      }

      const poll = {
        question: question.trim(),
        options: options.filter((opt) => opt.trim()),
        timeLimit,
        correctAnswer: correctAnswer === "none" || !correctAnswer.trim() ? null : correctAnswer.trim(),
      }

      console.log("Starting poll:", poll)
      socket.emit("startPoll", poll)

      setCurrentPoll({
        id: Date.now().toString(),
        question: poll.question,
        options: poll.options,
        timeLimit: poll.timeLimit,
        correctAnswer: poll.correctAnswer,
        isActive: true,
        createdAt: new Date(),
        questionNumber: pollHistory.length + 1,
      })
      setTimeLeft(timeLimit)

      setQuestion("")
      setOptions(["Option A", "Option B"])
      setCorrectAnswer("none")
      setActiveTab("results")
    }
  }

  const endPoll = () => {
    if (socket && currentPoll) {
      socket.emit("endPoll", currentPoll.id)
      setCurrentPoll(null)
    }
  }

  const kickStudent = (studentId: string) => {
    if (socket) {
      socket.emit("kickStudent", studentId)
      setParticipants(participants.filter((p) => p.id !== studentId))
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
      default:
        return "bg-gradient-to-r from-blue-400 to-blue-600 text-white"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-sm font-medium">
              INTERACTIVE POLL
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <span className="text-sm text-gray-500">Status: {connectionStatus}</span>
          </div>
          <Button
            onClick={() => setActiveTab("history")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            👁️ View Poll history
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">Create Poll</TabsTrigger>
            <TabsTrigger value="results">Live Results</TabsTrigger>
            <TabsTrigger value="rankings">Live Rankings</TabsTrigger>
            <TabsTrigger value="history">Poll History</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Let's Get Started
                </CardTitle>
                <p className="text-gray-600">
                  You'll have the ability to create and manage polls, ask questions, and monitor your students'
                  responses in real-time
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="question">Enter your question</Label>
                    <Select
                      value={timeLimit.toString()}
                      onValueChange={(value) => setTimeLimit(Number.parseInt(value))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                        <SelectItem value="90">90 seconds</SelectItem>
                        <SelectItem value="120">120 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Which planet is known as the Red Planet?"
                    className="min-h-20"
                  />
                  <div className="text-right text-sm text-gray-500">{question.length}/100</div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label>Edit Options</Label>
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1"
                        />
                        {options.length > 2 && (
                          <Button variant="outline" size="sm" onClick={() => removeOption(index)}>
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" onClick={addOption} className="w-full bg-transparent">
                      + Add More option
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Set Correct Answer (Optional)</Label>
                      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="correctAnswer" className="text-sm">
                            Correct Answer (for scoring)
                          </Label>
                          <Select value={correctAnswer || "none"} onValueChange={setCorrectAnswer}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select correct answer (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No correct answer</SelectItem>
                              {options.map((option, index) => (
                                <SelectItem key={index} value={option} disabled={!option.trim()}>
                                  {String.fromCharCode(65 + index)} - {option || `Option ${index + 1}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="text-xs text-gray-600">
                          Setting a correct answer will enable student scoring and rankings
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={startPoll}
                    disabled={!question.trim() || !options.every((opt) => opt.trim())}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-full text-lg font-medium"
                  >
                    {currentPoll ? "Ask New Question" : "Ask Question"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {currentPoll && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Starting a new poll will automatically end the current one.
                </p>
              </div>
            )}
            {currentPoll ? (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Question {currentPoll.questionNumber}</h2>
                    <div className="flex items-center gap-2 text-red-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono">00:{timeLeft.toString().padStart(2, "0")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={endPoll}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                    >
                      End Poll
                    </Button>
                    <Button
                      onClick={() => setActiveTab("create")}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      + Ask a new question
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardHeader className="bg-gray-700 text-white">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{currentPoll.question}</span>
                      {currentPoll.correctAnswer && (
                        <Badge className="bg-green-600 text-white">Correct: {currentPoll.correctAnswer}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {pollResults.map((result, index) => (
                        <div key={result.option} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                                  currentPoll.correctAnswer === result.option
                                    ? "bg-green-500 text-white border-green-500"
                                    : "bg-white text-purple-600 border-purple-200"
                                }`}
                              >
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="font-medium text-gray-800">{result.option}</span>
                              {currentPoll.correctAnswer === result.option && (
                                <Badge className="bg-green-100 text-green-800 text-xs">Correct</Badge>
                              )}
                            </div>
                            <div className="bg-gray-100 px-3 py-1 rounded-md">
                              <span className="font-bold text-lg text-gray-800">{result.percentage}%</span>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-8">
                              <div
                                className={`h-8 rounded-full transition-all duration-500 flex items-center justify-start pl-3 ${
                                  currentPoll.correctAnswer === result.option
                                    ? "bg-gradient-to-r from-green-500 to-green-600"
                                    : "bg-gradient-to-r from-purple-500 to-blue-500"
                                }`}
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
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <h3 className="text-xl font-semibold mb-2">No Active Poll</h3>
                  <p className="text-gray-600 mb-4">Create a new poll to see live results here</p>
                  <Button
                    onClick={() => setActiveTab("create")}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    Create New Poll
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rankings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Live Student Rankings
                </CardTitle>
                <p className="text-gray-600">
                  Real-time leaderboard showing student performance based on correct answers
                </p>
              </CardHeader>
              <CardContent>
                {studentRankings.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Rankings Yet</h3>
                    <p className="text-gray-500">
                      Rankings will appear after students answer polls with correct answers set
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-600 pb-2 border-b">
                      <span>Rank</span>
                      <span className="col-span-2">Student Name</span>
                      <span>Score</span>
                      <span>Accuracy</span>
                      <span>Answered</span>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {studentRankings.map((student, index) => (
                        <div
                          key={student.id}
                          className={`grid grid-cols-6 gap-4 items-center p-3 rounded-lg transition-all ${
                            student.rank <= 3
                              ? "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {getRankIcon(student.rank)}
                            <Badge className={`text-xs ${getRankBadgeColor(student.rank)}`}>#{student.rank}</Badge>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium text-gray-800">{student.name}</span>
                          </div>
                          <div className="text-center">
                            <span className="font-bold text-lg text-purple-600">{student.score}</span>
                          </div>
                          <div className="text-center">
                            <span
                              className={`font-medium ${
                                student.accuracy >= 80
                                  ? "text-green-600"
                                  : student.accuracy >= 60
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {student.accuracy}%
                            </span>
                          </div>
                          <div className="text-center text-sm text-gray-600">
                            {student.correctAnswers}/{student.totalAnswers}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  View Poll History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pollHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No poll history available yet</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {pollHistory.map((poll, pollIndex) => (
                      <div key={poll.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Question {poll.questionNumber}</h3>
                          {poll.correctAnswer && (
                            <Badge className="bg-green-100 text-green-800">Correct Answer: {poll.correctAnswer}</Badge>
                          )}
                        </div>
                        <Card>
                          <CardHeader className="bg-gray-700 text-white">
                            <CardTitle className="text-base">{poll.question}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {poll.results.map((result, index) => (
                                <div key={result.option} className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                                          poll.correctAnswer === result.option
                                            ? "bg-green-500 text-white border-green-500"
                                            : "bg-white text-purple-600 border-purple-200"
                                        }`}
                                      >
                                        {String.fromCharCode(65 + index)}
                                      </div>
                                      <span className="font-medium text-gray-800">{result.option}</span>
                                      {poll.correctAnswer === result.option && (
                                        <Badge className="bg-green-100 text-green-800 text-xs">Correct</Badge>
                                      )}
                                    </div>
                                    <div className="bg-gray-100 px-2 py-1 rounded-md">
                                      <span className="font-semibold text-gray-800">{result.percentage}%</span>
                                    </div>
                                  </div>
                                  <div className="relative">
                                    <div className="w-full bg-gray-200 rounded-full h-6">
                                      <div
                                        className={`h-6 rounded-full transition-all duration-300 ${
                                          poll.correctAnswer === result.option
                                            ? "bg-gradient-to-r from-green-500 to-green-600"
                                            : "bg-gradient-to-r from-purple-500 to-blue-500"
                                        }`}
                                        style={{ width: `${result.percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Chat */}
      <FloatingChat socket={socket} participants={participants} isTeacher={true} onKickStudent={kickStudent} />
    </div>
  )
}
