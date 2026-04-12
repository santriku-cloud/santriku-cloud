export default async function handler(req, res) {
    // Pengaturan izin akses (CORS) agar bisa dipanggil dari domain manapun
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { subject, level, count } = req.body;
    
    // Pastikan nama ini sama dengan yang di Vercel Settings
    const API_KEY = process.env.GEMINI_API_KEY; 

    const prompt = `Buatlah ${count} soal pilihan ganda tentang ${subject} untuk tingkat ${level}. Format JSON murni: [{"p": "soal", "o": ["jawaban benar", "salah1", "salah2", "salah3"]}]. Jawaban benar harus selalu di indeks 0.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        // Membersihkan teks dari markdown jika AI mengirimkannya
        const rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json|```/g, "").trim();
        
        res.status(200).json({ questions: JSON.parse(cleanJson) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal menghubungkan ke AI Gemini" });
    }
}
