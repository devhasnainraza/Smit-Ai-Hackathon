import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export async function geminiFallback(prompt) {
  try {
    const res = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    return res.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error('Gemini error:', err.message);
    return 'Sorry, I could not generate a response.';
  }
}
