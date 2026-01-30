Explain My Decision (EMD)

Explain My Decision (EMD) is an AI-powered Decision Intelligence Platform that evaluates and improves human reasoning.

Unlike traditional AI tools that only provide answers, EMD analyzes the logic behind a decision, scores reasoning quality, and provides structured feedback to help users think more clearly and critically.

EMD is built for students, professionals, and independent thinkers who want measurable improvement in their reasoning ability.

🎯 Purpose

Most AI tools today:

Provide answers without evaluating logic

Skip assumptions and reasoning structure

Encourage dependency instead of intellectual growth

EMD addresses this gap by focusing on reasoning quality rather than answer generation.

The platform evaluates how well a decision is structured, how clear the reasoning is, and where improvements can be made.

🧠 Core Capabilities
1. Structured Explanation Engine

For any question and answer, EMD generates:

Step-by-step reasoning breakdown

Simple summary explanation

Logical strength score (0–100)

Clarity score (0–100)

Confidence score

Missing assumption detection

Improvement suggestions

All responses are generated using structured AI prompts and returned in validated JSON format.

2. Decision Intelligence Dashboard

Each user receives a personal reasoning profile including:

Average logical strength score

Average clarity score

Overall Decision Intelligence score

Common reasoning weaknesses

Performance trend over time

This enables measurable thinking improvement.

3. Challenge My Thinking Mode

Instead of generating answers, this mode:

Identifies logical flaws

Detects bias or weak assumptions

Asks counter-questions

Suggests stronger reasoning pathways

The goal is to strengthen independent thinking.

4. Explanation History

Users can:

Save explanations

Track historical performance

Review improvement trends

Share selected explanations publicly

5. Multi-Language Support

Supported languages:

English

Hindi

Language preference is passed directly to the AI engine.

🏗 System Architecture

Frontend: Next.js
Backend & Database: Supabase
Authentication: Supabase Auth
AI Engine: Google Gemini API (server-side integration)
Styling: Tailwind CSS
Deployment: Vercel

All AI API calls are executed server-side to protect API keys.

🗄 Database Schema
Table: explanations

id (uuid, primary key)

user_id (uuid, foreign key)

question (text)

answer (text)

explanation (text)

simple_summary (text)

logical_strength_score (integer)

clarity_score (integer)

confidence_score (integer)

missing_assumptions (json)

improvement_suggestions (json)

subject (text)

language (text)

is_public (boolean)

created_at (timestamp)

🔐 Environment Variables

Create a .env.local file in the root directory:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key


Do not expose the Gemini API key on the client side.

🚀 Local Development
npm install
npm run dev


Application runs at:

http://localhost:3000

🔒 Security Notes

Gemini API calls are executed server-side.

Supabase handles authentication and row-level security.

Public explanations are optional and user-controlled.

No sensitive data is stored beyond required inputs.

📌 Vision

Explain My Decision aims to become a structured reasoning evaluation system that helps individuals:

Think clearly

Detect weak logic

Improve explanation quality

Develop measurable decision intelligence

The long-term goal is not to replace thinking — but to improve it.