// LLM service for handling fallback responses
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
require('dotenv').config();

// Initialize LLM clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Get response from Gemini
 * @param {string} userMessage - User's message
 * @returns {Promise<string>} - AI response
 */
const getGeminiResponse = async (userMessage) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `You are an e-commerce customer service AI assistant. Respond to: ${userMessage}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw error;
  }
};

/**
 * Get response from OpenAI
 * @param {string} userMessage - User's message
 * @returns {Promise<string>} - AI response
 */
const getOpenAIResponse = async (userMessage) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful e-commerce customer service assistant. Keep responses concise and relevant to shopping."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 150
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error getting OpenAI response:', error);
    throw error;
  }
};

/**
 * Get fallback response from LLM
 * @param {string} userMessage - User's message
 * @param {string} preferredLLM - Preferred LLM service ('openai' or 'gemini')
 * @returns {Promise<string>} - AI response
 */
const getFallbackResponse = async (userMessage, preferredLLM = 'gemini') => {
  try {
    if (preferredLLM === 'openai') {
      return await getOpenAIResponse(userMessage);
    } else {
      return await getGeminiResponse(userMessage);
    }
  } catch (error) {
    // If preferred LLM fails, try the other one
    try {
      if (preferredLLM === 'openai') {
        return await getGeminiResponse(userMessage);
      } else {
        return await getOpenAIResponse(userMessage);
      }
    } catch (fallbackError) {
      console.error('Both LLM services failed:', fallbackError);
      return "I apologize, but I'm having trouble understanding. Could you please rephrase your question or try one of these common options?";
    }
  }
};

module.exports = {
  getFallbackResponse
};