from fastapi import Header, HTTPException 
import jwt 
import os 
from jwt.algorithms import ECAlgorithm
import json 
from logger import get_logger
logger = get_logger(__name__)

#jwt secret not needed, using public key 
#SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

jwk = {
  "x": "zk1SVeGWUj2GbNehXNnwZ_8VuCLp9AHW6HYntlcdcTg",
  "y": "pD5NRly2otiMKs0_HgNB5udRyaQHBr57yIGeNOihGiM",
  "alg": "ES256",
  "crv": "P-256",
  "ext": True,
  "kid": "2e7d3df0-4144-474a-a97e-b81cf8984db1",
  "kty": "EC",
  "key_ops": [
    "verify"
  ]
}                                                   
public_key = ECAlgorithm.from_jwk(json.dumps(jwk))

#dependency to authenticate user request using JWT 
async def get_current_user(authorization: str = Header(...)): 
    try: 
        token = authorization.removeprefix("Bearer ")
        print(jwt.get_unverified_header(token))

        decoded = jwt.decode(token, public_key, algorithms=["ES256"], audience="authenticated")
        user_id = decoded["sub"] 
        return user_id 

    except Exception as e: 
        logger.error(f"User not authenticated: {e}") 
        raise HTTPException(status_code=401, detail="Invalid or missing token") 