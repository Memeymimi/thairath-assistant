module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'ไม่พบ API Key' });
    }
    const { text } = req.body;
    const systemInstruction = `คุณคือผู้ช่วยบรรณาธิการของ "Thairath Plus" มีหน้าที่จัดรูปแบบบทความ
    ตอบกลับเป็น JSON Format เท่านั้น:
    {
      "cleanedText": "เนื้อหาต้นฉบับทั้งหมด 100% ห้ามตัดทอน ลบแค่ลิงก์อ้างอิงท้ายบทความออก",
      "hashtags": "#ThairathPlus #ไทยรัฐพลัส #แท็กภาษาไทย #EnglishTag",
      "references": "Source (YEAR). TOPIC. LINK",
      "inFocus": "• สรุปข้อ 1\\n• สรุปข้อ 2\\n• สรุปข้อ 3"
    }`;
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text }] }],
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    generationConfig: { responseMimeType: "application/json" }
                })
            }
        );
        const data = await response.json();
        if (!response.ok) {
            return res.status(500).json({ error: 'Google API Error: ' + (data.error?.message || 'Unknown Error') });
        }
        const rawText = data.candidates[0].content.parts[0].text;
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return res.status(200).json(JSON.parse(cleaned));
    } catch (error) {
        return res.status(500).json({ error: 'ระบบหลังบ้านทำงานผิดพลาด: ' + error.message });
    }
};
