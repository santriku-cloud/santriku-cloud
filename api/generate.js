import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Pastikan Method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Ambil API Key dari Environment Variable Vercel
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key belum dipasang di Vercel Settings' });
  }

  const { subject, level, count } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // PERBAIKAN: Menggunakan model gemini-1.5-flash yang lebih stabil
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Buatkan ${count} soal pilihan ganda tentang ${subject} untuk tingkat ${level} dalam format JSON murni. 
    Struktur JSON harus: {"questions": [{"p": "pertanyaan", "o": ["jawaban benar", "salah1", "salah2", "salah3"]}]}. 
    Pastikan jawaban benar selalu di urutan pertama indeks o. Jangan ada teks penjelasan lain, hanya JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Membersihkan teks jika AI memberikan markdown (seperti ```json ... ```)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const quizData = JSON.parse(text);
    return res.status(200).json(quizData);

  } catch (error) {
    console.error("Error backend:", error);
    return res.status(500).json({ 
      error: "AI sedang sibuk atau konfigurasi salah", 
      details: error.message 
    });
  }
}
