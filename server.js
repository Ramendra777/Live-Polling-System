const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { Server } = require("socket.io")

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Global state
let currentPoll = null
let students = []
let answers = []
let pollTimer = null
let questionCounter = 0
let chatMessages = []
const studentScores = {} // Track student scores

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    socket.on("joinAsStudent", ({ name }) => {
      console.log("Student joining:", name)
      const existingStudent = students.find((s) => s.name === name)
      if (existingStudent) {
        existingStudent.socketId = socket.id
      } else {
        students.push({
          id: socket.id,
          name,
          socketId: socket.id,
        })

        // Initialize student score if not exists
        if (!studentScores[name]) {
          studentScores[name] = {
            id: socket.id,
            name,
            score: 0,
            correctAnswers: 0,
            totalAnswers: 0,
            accuracy: 0,
          }
        }
      }

      socket.studentName = name
      socket.isTeacher = false

      io.emit("participantsUpdate", students)
      socket.emit("chatHistory", chatMessages)
      updateStudentRankings()
      console.log("Current students:", students.length)

      if (currentPoll && currentPoll.isActive) {
        socket.emit("pollStarted", currentPoll)
      }
    })

    socket.on("joinAsTeacher", () => {
      console.log("Teacher joined")
      socket.isTeacher = true
      socket.studentName = "Teacher"

      socket.emit("participantsUpdate", students)
      socket.emit("chatHistory", chatMessages)
      updateStudentRankings()

      if (currentPoll && currentPoll.isActive) {
        const results = calculateResults()
        socket.emit("pollResults", results)
      }
    })

    socket.on("sendChatMessage", ({ message, isTeacher }) => {
      const chatMessage = {
        id: Date.now().toString(),
        sender: socket.studentName || "Unknown",
        message,
        timestamp: new Date(),
        isTeacher,
      }

      chatMessages.push(chatMessage)

      // Keep only last 50 messages
      if (chatMessages.length > 50) {
        chatMessages = chatMessages.slice(-50)
      }

      io.emit("chatMessage", chatMessage)
      console.log("Chat message:", chatMessage)
    })

    socket.on("startPoll", (pollData) => {
      console.log("Starting poll:", pollData)

      // End current poll if one exists
      if (currentPoll && currentPoll.isActive) {
        endCurrentPoll()
      }

      answers = []
      questionCounter++

      currentPoll = {
        id: Date.now().toString(),
        question: pollData.question,
        options: pollData.options,
        timeLimit: pollData.timeLimit,
        correctAnswer: pollData.correctAnswer,
        isActive: true,
        createdAt: new Date(),
        questionNumber: questionCounter,
      }

      io.emit("pollStarted", currentPoll)
      console.log("Poll started, sent to all clients")

      let timeLeft = pollData.timeLimit
      if (pollTimer) {
        clearInterval(pollTimer)
      }

      pollTimer = setInterval(() => {
        timeLeft--
        io.emit("timeUpdate", timeLeft)

        if (timeLeft <= 0) {
          endCurrentPoll()
        }
      }, 1000)
    })

    socket.on("submitAnswer", ({ pollId, answer, studentName }) => {
      console.log("Answer submitted:", { pollId, answer, studentName })
      if (currentPoll && currentPoll.id === pollId && currentPoll.isActive) {
        answers = answers.filter((a) => !(a.studentName === studentName && a.pollId === pollId))

        answers.push({
          studentId: socket.id,
          studentName,
          answer,
          pollId,
        })

        // Update student score if correct answer is set
        if (currentPoll.correctAnswer && studentScores[studentName]) {
          const isCorrect = answer === currentPoll.correctAnswer
          studentScores[studentName].totalAnswers++

          if (isCorrect) {
            studentScores[studentName].correctAnswers++
            studentScores[studentName].score += 10 // 10 points per correct answer
          }

          studentScores[studentName].accuracy = Math.round(
            (studentScores[studentName].correctAnswers / studentScores[studentName].totalAnswers) * 100,
          )
        }

        const results = calculateResults()
        io.emit("pollResults", results)
        updateStudentRankings()
        console.log("Results updated:", results)

        const activeStudents = students.length
        const answeredStudents = answers.filter((a) => a.pollId === pollId).length

        if (answeredStudents === activeStudents && activeStudents > 0) {
          setTimeout(() => {
            endCurrentPoll()
          }, 2000)
        }
      }
    })

    socket.on("endPoll", (pollId) => {
      console.log("Ending poll:", pollId)
      if (currentPoll && currentPoll.id === pollId) {
        endCurrentPoll()
      }
    })

    socket.on("kickStudent", (studentId) => {
      console.log("Kicking student:", studentId)
      const studentToKick = students.find((s) => s.id === studentId)

      students = students.filter((s) => s.id !== studentId)
      answers = answers.filter((a) => a.studentId !== studentId)

      // Remove from scores but keep history
      if (studentToKick && studentScores[studentToKick.name]) {
        delete studentScores[studentToKick.name]
      }

      io.to(studentId).emit("studentKicked")
      io.emit("participantsUpdate", students)
      updateStudentRankings()

      if (currentPoll && currentPoll.isActive) {
        const results = calculateResults()
        io.emit("pollResults", results)
      }
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)
      students = students.filter((s) => s.socketId !== socket.id)
      io.emit("participantsUpdate", students)
      updateStudentRankings()
    })
  })

  function calculateResults() {
    if (!currentPoll) return []

    const results = currentPoll.options.map((option) => ({
      option,
      votes: 0,
      percentage: 0,
    }))

    const currentPollAnswers = answers.filter((a) => a.pollId === currentPoll.id)
    const totalAnswers = currentPollAnswers.length

    currentPollAnswers.forEach((answer) => {
      const resultIndex = results.findIndex((r) => r.option === answer.answer)
      if (resultIndex !== -1) {
        results[resultIndex].votes++
      }
    })

    results.forEach((result) => {
      result.percentage = totalAnswers > 0 ? Math.round((result.votes / totalAnswers) * 100) : 0
    })

    return results
  }

  function updateStudentRankings() {
    const rankings = Object.values(studentScores)
      .filter((student) => student.totalAnswers > 0)
      .sort((a, b) => {
        // Sort by score first, then by accuracy
        if (b.score !== a.score) {
          return b.score - a.score
        }
        return b.accuracy - a.accuracy
      })
      .map((student, index) => ({
        ...student,
        rank: index + 1,
      }))

    io.emit("studentRankings", rankings)
    console.log("Student rankings updated:", rankings)
  }

  function endCurrentPoll() {
    if (currentPoll && pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null

      const results = calculateResults()
      const pollToEnd = { ...currentPoll }

      currentPoll = null

      io.emit("pollEnded", pollToEnd, results)
      updateStudentRankings()
      console.log("Poll ended")
    }
  }

  httpServer
    .once("error", (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.io server is running`)
    })
})
