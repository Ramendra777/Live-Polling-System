"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | null>(null)
  const router = useRouter()

  const handleContinue = () => {
    if (selectedRole === "student") {
      router.push("/student")
    } else if (selectedRole === "teacher") {
      router.push("/teacher")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-sm font-medium">
            INTERACTIVE POLL
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900">Welcome to the Live Polling System</h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Please select the role that best describes you to begin using the live polling system
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedRole === "student" ? "ring-2 ring-purple-500 bg-purple-50" : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedRole("student")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">I'm a Student</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Lorem ipsum is simply dummy text of the printing and typesetting industry
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedRole === "teacher" ? "ring-2 ring-purple-500 bg-purple-50" : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedRole("teacher")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">I'm a Teacher</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Submit answers and view live poll results in real-time
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedRole}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-full text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
