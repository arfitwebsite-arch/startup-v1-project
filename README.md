# Explain My Decision (EMD)

Explain My Decision (EMD) is an AI-powered web application that helps users understand **why an answer, solution, or decision makes sense** — not just what the answer is.

Instead of giving raw answers, EMD focuses on **clarity, reasoning, and explanation**, making it ideal for students, learners, and professionals who want to truly understand concepts.

---

##  What Problem Does EMD Solve?

Most AI tools today:
- Give answers without reasoning
- Skip assumptions and logic
- Leave users confused or dependent

**EMD fixes this** by turning any question + answer into a **step-by-step, human-friendly explanation** using AI.

---

## 🧠 How It Works (V1)

1. User enters:
   - A **question**
   - An **answer/solution** (their own or AI-generated)
2. EMD uses **Google Gemini AI** to:
   - Analyze the logic
   - Identify assumptions
   - Break down reasoning
3. User receives:
   - A clear explanation
   - Structured steps
   - Simple language summary

---

## ✨ Core Features (V1)

- AI-powered explanation engine (Gemini)
- Simple question + answer input flow
- Clean, distraction-free UI
- Fast responses using serverless architecture
- Secure authentication with Supabase

---

## 🛠 Tech Stack

- **Frontend:** Next.js
- **Backend & Auth:** Supabase
- **AI Engine:** Google Gemini API (custom API key)
- **UI:** Tailwind CSS (via Lovable)
- **Deployment:** Vercel (recommended)

---

## 🔐 Environment Variables

Create a `.env.local` file and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
