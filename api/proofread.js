module.exports = async function (req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'ไม่พบ API Key - กรุณาเช็ก Environment Variables ใน Vercel' });
    }

    const { text } = req.body;
    const systemInstruction = `คุณคือผู้เชี่ยวชาญด้านการพิสูจน์อักษรของ "Thairath Plus" หน้าที่ของคุณคือจับผิดคำในบทความอย่างละเอียดที่สุด ตอบกลับเป็น JSON Format เท่านั้น โครงสร้างดังนี้:
    { "spellIssues": [{ "wrong": "คำที่พิมพ์ผิด", "correct": "คำที่ถูกต้อง", "reason": "สะกดผิด หรือ ไม้ยมกผิด" }], "contextIssues": [{ "wrong": "ประโยคที่ผิดบริบท/พิมพ์ตก", "correct": "คำแนะนำการแก้", "reason": "ประโยคแปลก/พิมพ์ตก" }] }
    ห้ามเอาคำเชื่อม (เช่น เพราะ จึง และ หรือ) มาเป็นคำผิดเด็ดขาด ข้อมูล wrong ต้องดึงมาจากต้นฉบับเป๊ะๆ`;

    try {
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
            return res.status(500).json({ error: 'Google API ฟ้องว่า: ' + (data.error?.message || 'Unknown Error') });
        }

        let cleaned = data.candidates[0].content.parts[0].text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return res.status(200).json(JSON.parse(cleaned));
    } catch (error) { 
        return res.status(500).json({ error: 'ระบบหลังบ้านทำงานผิดพลาด: ' + error.message }); 
    }
};
