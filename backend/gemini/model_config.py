from google import genai
from google.genai import types

client = genai.Client()

schema = { 
    "type": "object", 
    "properties": { 
        "analysis": {"type": "string"}, 
        "tags": { 
            "type": "object", 
            "properties": { 
                "color": {"type": "string"}, 
                "style": {"type": "string"}, 
                "occasion": {"type": "string"}, 
                "season": {"type": "string"}
            }, 
            "required": ["color", "style", "occasion", "season"]
        }
    }
}

system_instruction = "You are an expert fashion stylist. Return JSON with analysis (a short style tip) and tags containing color, style, occasion, and season."

ANALYZE_CONFIG = types.GenerateContentConfig(
    system_instruction=system_instruction, 
    thinking_config=types.ThinkingConfig(thinking_level="low"),
    temperature=0.5,
    max_output_tokens=400, 
    response_mime_type="application/json",
    response_schema=schema
)

VALIDATE_CONFIG = types.GenerateContentConfig(
    system_instruction="You are a clothing validator. Answer only 'yes' or 'no'.",
    thinking_config=types.ThinkingConfig(thinking_level="low"),
    temperature=0.5,
    max_output_tokens=10
)


