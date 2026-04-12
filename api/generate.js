export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { subject, level, count } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY; 

    const prompt = `Buatlah ${count} soal pilihan ganda tentang ${subject} untuk tingkat ${level}. Format JSON: [{"p": "soal", "o": ["benar", "salah1", "salah2", "salah3"]}]. Jawaban benar indeks 0.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        res.status(200).json({ questions: JSON.parse(text) });
    } catch (error) {
        res.status(500).json({ error: "AI sedang sibuk" });
    }
}
