export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API Key missing' });
    const { text } = req.body;

    const systemInstruction = `คุณคือผู้เชี่ยวชาญด้านการพิสูจน์อักษรของ "Thairath Plus" หน้าที่ของคุณคือจับผิดคำในบทความอย่างละเอียดที่สุด ตอบกลับเป็น JSON Format เท่านั้น โครงสร้างดังนี้:
    { "spellIssues": [{ "wrong": "คำที่พิมพ์ผิด", "correct": "คำที่ถูกต้อง", "reason": "สะกดผิด หรือ ไม้ยมกผิด" }], "contextIssues": [{ "wrong": "ประโยคที่ผิดบริบท/พิมพ์ตก", "correct": "คำแนะนำการแก้", "reason": "ประโยคแปลก/พิมพ์ตก" }] }
    ห้ามเอาคำเชื่อม (เช่น เพราะ จึง และ หรือ) มาเป็นคำผิดเด็ดขาด ข้อมูล wrong ต้องดึงมาจากต้นฉบับเป๊ะๆ`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
        });
        const data = await response.json();
        let cleaned = data.candidates[0].content.parts[0].text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return res.status(200).json(JSON.parse(cleaned));
    } catch (error) { return res.status(500).json({ error: 'AI Error' }); }
}