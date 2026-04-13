// api/generate.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Atur Header CORS agar file HTML bisa memanggil API ini
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Hanya menerima POST' });
  }

  try {
    const { subject, level, count } = req.body;
    
    // AMBIL API KEY DARI ENVIRONMENT VARIABLE VERCEL
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Buatkan ${count} soal pilihan ganda tentang ${subject} untuk tingkat ${level}. 
    Berikan respon dalam format JSON murni seperti ini: 
    {"questions": [{"p": "Pertanyaan", "o": ["Jawaban Benar", "Salah 1", "Salah 2", "Salah 3"]}]}
    Pastikan jawaban benar selalu di urutan pertama array 'o'.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Membersihkan teks dari markdown jika ada
    const cleanJson = text.replace(/```json|```/g, "");
    const data = JSON.parse(cleanJson);

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Gagal generate soal", details: error.message });
  }
}
