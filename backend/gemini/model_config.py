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
                "color": {"type": "array", "items": {"type": "string"}},
                "style": {"type": "array", "items": {"type": "string"}}, 
                "season": {"type": "string"}
            }, 
            "required": ["color", "style", "season"]
        }
    }
}

system_instruction = "You are an expert fashion stylist. Return JSON with analysis (a short style tip) and tags containing color, style, and season."

ANALYZE_CONFIG = types.GenerateContentConfig(
    system_instruction=system_instruction, 
    thinking_config=types.ThinkingConfig(thinking_level="low"),
    temperature=0.5,
    max_output_tokens=800, 
    response_mime_type="application/json",
    response_schema=schema
)

HIGHER_ANALYZE_CONFIG = types.GenerateContentConfig(
    system_instruction=system_instruction, 
    thinking_config=types.ThinkingConfig(thinking_level="low"),
    temperature=0.5,
    max_output_tokens=1200, 
    response_mime_type="application/json",
    response_schema=schema
)

VALIDATE_CONFIG = types.GenerateContentConfig(
    system_instruction="You are a clothing validator. Answer only 'yes' or 'no'.",
    thinking_config=types.ThinkingConfig(thinking_level="low"),
    temperature=0.5,
    max_output_tokens=10
)