# 🌟 Live Polling System

A real-time interactive polling platform built using **Next.js (TypeScript)** on the frontend and **Express.js + Socket.IO** on the backend.

## 👤 Personas

### 👩‍🏫 Teacher

* Create and broadcast questions
* View live results in real-time
* Ask a new question only after all students respond or poll ends
* Set custom timer for polls
* Kick students out
* View poll history

### 🧑‍🏫 Student

* Join the session with a **unique name per tab**
* Submit answers within **60 seconds**
* See live results after submitting or after timeout
* **Session persists on refresh**, but acts like a new student in a new tab

---

## 🛠️ Tech Stack

### Frontend

* [Next.js](https://nextjs.org/)
* TypeScript
* Socket.IO Client
* (Optional) Redux for state management

### Backend

* Express.js
* Socket.IO
* Node.js

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/live-polling-system.git
cd live-polling-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Application

```bash
npm run dev
```

* You should see:

  * `> Ready on http://localhost:3000`
  * `> Socket.io server is running`

---

## 🧪 Step-by-Step Testing Guide

### **Step 1: Open Multiple Tabs**

#### Tab 1 - Teacher:

1. Go to `http://localhost:3000`
2. Click "I'm a Teacher"
3. Click "Continue"

#### Tab 2 - Student 1:

1. Go to `http://localhost:3000` in a **new tab**
2. Click "I'm a Student" → Enter: `Alice` → Click "Continue"

#### Tab 3 - Student 2:

1. Open another **new tab**
2. Click "I'm a Student" → Enter: `Bob` → Click "Continue"

---

### **Step 2: Create and Answer a Poll**

#### Teacher:

1. See **"Online Students: 2"**
2. Create Poll:

   * **Question:** What is 2 + 2?
   * **Options:** 3, 4, 5
   * Click **"Ask Question"**

#### Students:

* See question immediately
* Countdown timer starts
* Select an option and click **Submit**
* View live results once answered or timeout

---

### **Step 3: Ask Another Poll**

1. Teacher ends previous poll or waits for timeout
2. Create Question 2: “What color is the sky?”

   * Options: Blue, Green, Red
3. Ask question

Students will receive it and respond again.

---

### **Step 4: Kick a Student**

1. Teacher clicks **"Kick"** next to Alice
2. Alice sees **“You’ve been kicked out!”**
3. Bob continues as normal

---

### **Step 5: View Poll History**

* Teacher navigates to **"Poll History"** tab
* Sees results for past polls

---

### **Step 6: Test Session Persistence**

* Refresh Bob's tab
* Name should persist (via `sessionStorage`)
* Automatically rejoins if a poll is active

---

## ✅ Success Indicators

* Real-time sync between teacher & students
* Timer is accurate and synced
* Answers & results update instantly
* Kick functionality works
* Poll history persists across questions
* Multiple tabs work independently

---

## 🛠 Troubleshooting

### 1. Browser Console

`F12` → Console → Check for Socket.IO errors

### 2. Server Logs

Look in terminal for:

```bash
Client connected
```

### 3. Network Tab

Check for active **WebSocket connections** in `F12 → Network → WS`

### 4. Try Another Browser

Try Chrome, Firefox, Safari or Incognito Mode

---

## 🧠 Features Overview

| Feature                       | Status      |
| ----------------------------- | ----------- |
| Real-time polling             | ✅ Complete  |
| Multiple students             | ✅ Complete  |
| Question timer (60s)          | ✅ Complete  |
| Unique per-tab identity       | ✅ Complete  |
| Session persistence (refresh) | ✅ Complete  |
| Live result display           | ✅ Complete  |
| Multiple questions            | ✅ Complete  |
| Kick student option           | ✅ Done      |
| Poll history tracking         | ✅ Done      |
| Chat system                   | ✅ Optional |
| Custom timer for polls        | ✅ Optional |

---

