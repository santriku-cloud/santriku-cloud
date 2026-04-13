export default async function handler(req, res) {
    // Header CORS (Sudah Benar)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { subject, level, count } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY; 

    // Validasi API KEY
    if (!API_KEY) {
        return res.status(500).json({ error: "Konfigurasi API Key di Vercel belum diset." });
    }

    const prompt = `Buatlah ${count} soal pilihan ganda tentang ${subject} untuk tingkat ${level}. 
    Berikan HANYA array JSON tanpa teks penjelasan apapun di luar array. 
    Format: [{"p": "pertanyaan", "o": ["jawaban benar", "salah", "salah", "salah"]}]`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" } // Memaksa output JSON
            })
        });

        const data = await response.json();
        
        // Cek jika ada error dari API Google
        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        
        // Parsing yang lebih aman
        let questions;
        try {
            questions = JSON.parse(rawText.replace(/```json|```/g, "").trim());
        } catch (e) {
            console.error("Gagal parse JSON dari AI:", rawText);
            return res.status(500).json({ error: "Format JSON dari AI tidak valid" });
        }
        
        res.status(200).json({ questions });
    } catch (error) {
        console.error("Error Detail:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
