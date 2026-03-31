import re
import os

filepath = 'backend/routers/auth.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Patch the login signature
content = content.replace(
    '@router.post("/login", response_model=TokenResponse)\nasync def login(user_data: UserLogin, request: Request):',
    '@router.post("/login")\nasync def login(user_data: UserLogin, request: Request, background_tasks: BackgroundTasks):'
)

# 2. Patch the return of the login method
old_return = """        # Record successful attempt
        auth_rate_limiter.record_attempt(client_ip, "login", success=True)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=auth_service.access_token_expire_minutes * 60,
            user=user_response
        )"""

new_return = """        # Record successful attempt
        auth_rate_limiter.record_attempt(client_ip, "login", success=True)
        
        # --- LOGIN OTP INTEGRATION ---
        import random
        from datetime import timedelta
        otp = str(random.randint(100000, 999999))
        
        # Invalidate old OTPs for this email
        await db.login_otps.delete_many({"email": user["email"]})
        
        # Store new OTP
        await db.login_otps.insert_one({
            "email": user["email"],
            "otp_hash": auth_service.hash_password(otp),
            "expires_at": datetime.utcnow() + timedelta(minutes=5),
            "created_at": datetime.utcnow()
        })
        
        # Send OTP email via background task
        background_tasks.add_task(
            send_login_otp_email,
            user["email"],
            otp,
            user["name"]
        )
        
        # Return requires_otp flag instead of tokens
        return {
            "requires_otp": True,
            "email": user["email"],
            "message": "OTP sent to your email"
        }"""

content = content.replace(old_return, new_return)

# 3. Inject VerifyLoginOTP endpoint
verify_endpoint_code = """

class VerifyLoginOTP(BaseModel):
    email: EmailStr
    otp: str

@router.post("/verify-login-otp", response_model=TokenResponse)
async def verify_login_otp(otp_data: VerifyLoginOTP, request: Request):
    \"\"\"Verify login OTP and return actual tokens\"\"\"
    try:
        client_ip = get_client_ip(request)
        db = await get_database()
        
        otp_record = await db.login_otps.find_one({"email": otp_data.email})
        if not otp_record:
            raise HTTPException(status_code=400, detail="OTP expired or invalid")
            
        if datetime.utcnow() > otp_record["expires_at"]:
            raise HTTPException(status_code=400, detail="OTP expired")
            
        if not auth_service.verify_password(otp_data.otp, otp_record["otp_hash"]):
            raise HTTPException(status_code=400, detail="Invalid OTP")
            
        await db.login_otps.delete_one({"_id": otp_record["_id"]})
        
        user = await db.users.find_one({"email": otp_data.email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "last_login": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "last_login_ip": client_ip
                },
                "$inc": {"login_count": 1}
            }
        )
        
        access_payload = {
            "sub": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "role_track": user["role_track"]
        }
        
        access_token = auth_service.create_access_token(access_payload)
        refresh_token = auth_service.create_refresh_token(access_payload)
        
        user_response = {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "role_track": user["role_track"],
            "is_verified": user.get("is_verified", False),
            "points": user.get("points", 0),
            "level": user.get("level", 1),
            "badges": user.get("badges", []),
            "login_streak": user.get("login_streak", 0),
            "created_at": user["created_at"]
        }
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=auth_service.access_token_expire_minutes * 60,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP verification error: {e}")
        raise HTTPException(status_code=500, detail="OTP verification failed")

@router.post("/refresh", response_model=TokenResponse)"""

content = content.replace('@router.post("/refresh", response_model=TokenResponse)', verify_endpoint_code)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully.")
