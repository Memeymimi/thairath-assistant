module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'ไม่พบ API Key - กรุณาเช็ก Environment Variables ใน Vercel' });
    }

    const { text } = req.body;

    const systemInstruction = `คุณคือผู้เชี่ยวชาญด้านการพิสูจน์อักษรของ "Thairath Plus"
    
    [กฎการพิสูจน์อักษรและหมวดหมู่]
    1. หมวด "คำสะกดผิด" (spellIssues):
       - ค้นหาคำที่สะกดผิดตามพจนานุกรมราชบัณฑิตยสถานเท่านั้น
       - ข้อยกเว้นเด็ดขาด: คำเชื่อมหรือคำทั่วไปที่ถูกต้องอยู่แล้ว (เช่น "เพราะ", "จึง", "และ", "หรือ", "แต่") ห้ามจับผิดเด็ดขาด
       - เรื่องไม้ยมก (ๆ): ต้องพิมพ์ติดกับตัวอักษรด้านหน้า ห้ามเว้นวรรค (ผิด: "เด็ก ๆ", ถูก: "เด็กๆ")
    
    2. หมวด "คำพิมพ์ตก / ผิดบริบท" (contextIssues):
       - ค้นหากลุ่มคำที่อ่านแล้วแปลกประหลาด หรือน่าจะพิมพ์ตกหล่น
    
    * ข้อควรระวัง: ต้องดึงคำที่ผิด (wrong) มาจากข้อความต้นฉบับแบบเป๊ะๆ 100%

    ตอบกลับเป็น JSON Format เท่านั้น:
    {
      "spellIssues": [
        { "wrong": "คำที่พิมพ์ผิด", "correct": "คำที่ถูกต้อง", "reason": "เหตุผล" }
      ],
      "contextIssues": [
        { "wrong": "ประโยคที่ผิดบริบท", "correct": "คำแนะนำ", "reason": "เหตุผล" }
      ]
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

        // ✅ แก้ไขบรรทัดนี้ (เดิมมี . และ [] ผิด)
        const rawText = data.candidates[0].content.parts[0].text;
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

        return res.status(200).json(JSON.parse(cleaned));

    } catch (error) {
        return res.status(500).json({ error: 'ระบบหลังบ้านทำงานผิดพลาด: ' + error.message });
    }
}
