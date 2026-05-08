import sys
import re

def update_prompt(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    old_prompt = """      const prompt = `Based ONLY on the user's latest input, suggest exactly 2 follow-up questions or prompts the user could ask next to improve, extend, or deepen their request.
Do not repeat the same idea. Do not generate generic suggestions. Do not include explanations or extra text.
Format your response strictly as a JSON array of objects, with each object having a "title" (maximum 5 words) and a "prompt" (the full follow-up question).
Example: [{"title": "Explain the underlying mechanism", "prompt": "Can you explain the underlying mechanism in more detail?"}]

User Input:
"${userMessage.substring(0, 1000)}"

Return ONLY the JSON array.`;"""

    new_prompt = """      const prompt = `You are responsible for generating intelligent follow-up message suggestions for an AI chat assistant.
Your task is to generate contextual, relevant, concise, and actionable follow-up suggestions based on BOTH:
1. The user's latest message
2. The assistant's latest response

The follow-up suggestions must:
- continue the conversation naturally
- feel useful and proactive
- suggest logical next steps
- avoid repeating what was already answered
- stay aligned with the user's original intent
- be concise and easy to tap/click
- sound natural and human
- avoid generic suggestions

IMPORTANT RULES:
- Analyze the user's intent first
- Analyze what the assistant already solved or explained
- Detect missing implementation details, next actions, improvements, debugging paths, or expansion opportunities
- Generate suggestions that deepen the conversation
- Avoid vague suggestions like: "Tell me more", "Can you explain?", "What next?"
- Avoid repeating the assistant response
- Avoid generating irrelevant or random questions
- Avoid suggesting already completed tasks
- Suggestions should feel like smart continuation prompts

Prioritize:
- implementation steps
- debugging
- optimization
- architecture improvements
- feature expansion
- UI/UX improvements
- deployment
- scalability
- integrations
- edge cases
- performance
- security

Output Requirements:
- Generate 3 follow-up suggestions
- Each suggestion must be short
- Maximum 12 words per suggestion.
- Return plain JSON array only, with each object having a "title" (maximum 5 words) and a "prompt" (the full follow-up question).
Example: [{"title": "Explain the underlying mechanism", "prompt": "Can you explain the underlying mechanism in more detail?"}]

User Input:
"${userMessage.substring(0, 1000)}"

Assistant Response:
"${assistantResponse.substring(0, 2000)}"

Return ONLY the JSON array.`;"""

    new_content = content.replace(old_prompt, new_prompt)

    # We also need to change generateRecommendations signature and call
    new_content = new_content.replace(
        "const generateRecommendations = async (messageId: string, userMessage: string, chatId: string | null) => {",
        "const generateRecommendations = async (messageId: string, userMessage: string, assistantResponse: string, chatId: string | null) => {"
    )

    new_content = new_content.replace(
        "generateRecommendations(finalMessageId, userMessage || (currentImage ? \"Image uploaded\" : \"\"), chatId);",
        "generateRecommendations(finalMessageId, userMessage || (currentImage ? \"Image uploaded\" : \"\"), fullResponse, chatId);"
    )

    new_content = new_content.replace(
        "const finalRecs = recs.slice(0, 2);",
        "const finalRecs = recs.slice(0, 3);"
    )

    with open(filepath, 'w') as f:
        f.write(new_content)

update_prompt('src/components/ChatArea.tsx')
