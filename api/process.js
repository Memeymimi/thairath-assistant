export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ ไม่พบ API Key (ระบบ Vercel หากุญแจไม่เจอ)");
        return res.status(500).json({ error: 'ไม่พบ API Key - กรุณาเช็ก Environment Variables ใน Vercel' });
    }

    const { text } = req.body;
    const systemInstruction = `คุณคือผู้ช่วยบรรณาธิการของ "Thairath Plus" มีหน้าที่จัดรูปแบบบทความ ให้ตอบกลับเป็น JSON Format เท่านั้น โครงสร้างดังนี้:
    { "cleanedText": "เนื้อหาต้นฉบับ 100% ห้ามตัดทอน ลบแค่ลิงก์อ้างอิงท้ายบทความออก", "hashtags": "#ThairathPlus #ไทยรัฐพลัส #แท็กภาษาไทย", "references": "Source (YEAR). TOPIC. LINK", "inFocus": "• สรุปข้อ 1\\n• สรุปข้อ 2" }`;

    try {
        // ใช้ Gemini 1.5 Flash (รุ่นเสถียร)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts: [{ text }] }], 
                systemInstruction: { parts: [{ text: systemInstruction }] }, 
                generationConfig: { responseMimeType: "application/json" } 
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error("❌ Google API Error:", data);
            return res.status(500).json({ error: 'Google API ฟ้องว่า: ' + (data.error?.message || 'Unknown Error') });
        }

        let cleaned = data.candidates[0].content.parts[0].text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return res.status(200).json(JSON.parse(cleaned));
    } catch (error) { 
        console.error("❌ System Error:", error);
        return res.status(500).json({ error: 'ระบบหลังบ้านทำงานผิดพลาด: ' + error.message }); 
    }
}
