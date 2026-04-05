import os
import logging
from groq import Groq
from sqlalchemy.orm import Session
from database import get_db

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Groq client conditionally
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = None

if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY environment variable is not set. Chatbot will be disabled.")
    logger.warning("Set GROQ_API_KEY in your .env file to enable AI features.")
else:
    try:
        client = Groq(api_key=GROQ_API_KEY)
        logger.info("Groq client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")
        client = None

# Configurable settings
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_MAX_TOKENS = int(os.getenv("GROQ_MAX_TOKENS", "600"))
GROQ_TEMPERATURE = float(os.getenv("GROQ_TEMPERATURE", "0.7"))

# WARNING: Rate limiting must be applied at the route level to prevent API abuse.
# Add rate limiting middleware (e.g., slowapi, flask-limiter) to the chatbot endpoint.


def get_doctors_context(db: Session) -> str:
    """
    Fetch all approved doctors from database with their schedules
    Uses eager loading to prevent N+1 queries
    Returns formatted string context for AI system prompt
    """
    try:
        from models import Doctor, User, Schedule
        from sqlalchemy.orm import joinedload

        # Get all approved doctors with their user info in a single query using JOIN
        doctors = (
            db.query(Doctor, User)
            .join(User, Doctor.user_id == User.id)
            .filter(Doctor.is_approved == True)
            .all()
        )

        if not doctors:
            return "No doctors currently available in the system."

        # Get all schedules for these doctors in ONE query (prevents N+1)
        doctor_ids = [doctor.id for doctor, _ in doctors]
        schedules = (
            db.query(Schedule)
            .filter(
                Schedule.doctor_id.in_(doctor_ids),
                Schedule.is_available == True
            )
            .all()
        )

        # Group schedules by doctor_id for efficient lookup
        schedules_by_doctor = {}
        for schedule in schedules:
            if schedule.doctor_id not in schedules_by_doctor:
                schedules_by_doctor[schedule.doctor_id] = []
            schedules_by_doctor[schedule.doctor_id].append(schedule.day_of_week)

        doctors_context = []

        for doctor, user in doctors:
            available_days = schedules_by_doctor.get(doctor.id, [])
            available_days_str = ", ".join(available_days) if available_days else "Not specified"

            # Build doctor info with clinic address
            clinic_info = ""
            if doctor.clinic_name:
                clinic_info += f"\n  - Clinic: {doctor.clinic_name}"
            if doctor.clinic_address:
                clinic_info += f"\n  - Clinic Address: {doctor.clinic_address}"
            if doctor.clinic_landline:
                clinic_info += f"\n  - Clinic Phone: {doctor.clinic_landline}"

            doctor_info = f"""
- Dr. {user.name} (ID: {doctor.id})
  - Specialization: {doctor.specialization}
  - City: {doctor.city or 'Not specified'}
  - Consultation Fee: PKR {doctor.consultation_fee}
  - Qualification: {doctor.qualification or 'Not specified'}
  - Experience: {doctor.experience_years} years
  - Available Days: {available_days_str}{clinic_info}
  - Bio: {doctor.bio or 'No bio available'}
            """.strip()

            doctors_context.append(doctor_info)

        return "\n\n".join(doctors_context)
    except Exception as e:
        print(f"get_doctors_context error: {e}")
        # Rollback the session on error
        try:
            db.rollback()
        except:
            pass
        return "Unable to fetch doctor information at this time."


def get_symptom_doctor_mapping() -> str:
    """
    Returns symptom to specialization mapping for better recommendations
    """
    return """
Symptom to Specialization Guide:
- Heart problems, chest pain, palpitations → Cardiologist
- Skin issues, rashes, acne, allergies → Dermatologist
- Bone fractures, joint pain, arthritis → Orthopedic
- Brain disorders, headaches, seizures → Neurologist
- Women's health, pregnancy → Gynecologist
- Children's health, vaccinations → Pediatrician
- Ear, nose, throat issues → ENT Specialist
- Eye problems, vision issues → Eye Specialist
- Mental health, depression, anxiety → Psychiatrist
- Kidney, urinary problems → Urologist
- Stomach, digestive issues → Gastroenterologist
- General fever, cold, flu → General Physician
    """.strip()


SYSTEM_PROMPT_TEMPLATE = """
You are a smart and confident AI Health Assistant for a doctor appointment system in Pakistan.

YOUR GOAL:
- Help users understand symptoms
- Recommend the correct doctor type
- Suggest REAL doctors from database ONLY
- Guide user to book appointment through the website/app

---------------------------------------

LANGUAGE RULE (STRICT):
- Always reply in SAME language as user
- Urdu → Urdu
- Roman Urdu → Roman Urdu
- English → English
- NEVER switch language

---------------------------------------

⚠️ CRITICAL RULES - READ CAREFULLY ⚠️

1. YOU MUST ONLY USE DOCTORS FROM THE "AVAILABLE DOCTORS IN DATABASE" SECTION BELOW
2. NEVER invent, create, hallucinate, or suggest doctors that are NOT in that section
3. NEVER use doctor names unless they appear EXACTLY in the database section
4. MATCH specialization EXACTLY as shown in database
5. MATCH city, fee, days EXACTLY as shown in database
6. DO NOT make up appointment times, dates, or booking confirmations
7. DO NOT pretend to book appointments - just guide user to use the website/app

---------------------------------------

RECOMMENDATION RULES (VERY IMPORTANT):

1. If symptoms clearly match a specialization → ALWAYS recommend confidently
2. NEVER say:
   - "I cannot suggest"
   - "I am not sure"
   - "maybe"
3. For common symptoms:
   - Fever, headache, cold → General Physician
   - Skin issues → Dermatologist
   - Heart issues → Cardiologist

4. ALWAYS sound confident and helpful

BAD EXAMPLE:
"I cannot suggest any doctor"

GOOD EXAMPLE:
"Based on your symptoms, you should consult a General Physician."

---------------------------------------

⚠️ DOCTOR RULES (EXTREMELY IMPORTANT):

- ONLY use doctors listed in the "AVAILABLE DOCTORS IN DATABASE" section
- NEVER create fake doctors or hallucinate names
- NEVER suggest doctors not in the list
- ALWAYS copy doctor details EXACTLY as shown:
  - Name (EXACT match)
  - ID (EXACT match)
  - City (EXACT match)
  - Fee (EXACT match)
  - Available Days (EXACT match from Schedule)

- Show MAX 2–3 doctors only (not all)
- If user asks for a specialist and NO matching doctor exists in database → say:
  "Currently specialization specialist available nahi hai. Lekin aap General Physician se consult kar sakte hain."

---------------------------------------

⚠️ APPOINTMENT BOOKING RULES (CRITICAL):

- DO NOT pretend to book appointments
- DO NOT say "appointment book kar diya gaya" or "confirmed"
- DO NOT make up appointment times, dates, or slots
- Instead, guide user to book through the website:
  "Aap website/app pe jaake doctor (ID: X) ka appointment book kar sakte hain."
  "Please visit the website to select date, time slot and book your appointment."

---------------------------------------

RESPONSE FORMAT (STRICT):

Always use structured format like this:

[Short explanation in user's language - 1-2 sentences]

👨‍⚕️ Available Doctors:
1. Doctor name (ID: X)
   📍 City name
   💰 PKR fee
   📅 Available days or "Check website for availability"

[Optional second doctor IF exists in database AND matches specialization]

[Guide user to book through website/app - in user's language]

---------------------------------------

EXAMPLE RESPONSE (for reference only - NEVER copy exact values):

"Aapki symptoms (fever aur headache) ko dekhte hue, yeh aam tor par General Physician handle karta hai.

👨‍⚕️ Available Doctors:
1. Dr. Ahmed Ali (ID: 5)
   📍 Karachi
   💰 PKR 1500
   📅 Mon, Wed, Fri

Aap website pe jaake inka appointment book kar sakte hain. Book karna chahenge?"

---------------------------------------

CRITICAL RULES:

- Be confident (no hesitation words)
- Be short and clear
- Always guide toward booking through website
- NEVER pretend to book appointments
- NEVER hallucinate doctor names, cities, fees, or availability
- If no doctors available → clearly say:
  "Currently koi doctor available nahi hai. Please check back later."

---------------------------------------

{SYMPTOM_MAPPING}

AVAILABLE DOCTORS IN DATABASE:
{DOCTORS_CONTEXT}

⚠️ IMPORTANT INSTRUCTIONS:
1. The doctors listed above are the ONLY doctors you can suggest
2. If the section is empty or says "No doctors currently available":
   - Do NOT invent doctors
   - Do NOT make up names
   - Politely inform the user that no doctors are available right now (in their language)
   - Suggest they check back later or contact support
3. ALWAYS copy doctor details EXACTLY as shown - do not modify names, cities, fees, or days
4. If user asks "koi or doctor" → show DIFFERENT doctors from the list (not the same one)
5. If user asks for specialization and NO doctor matches → suggest closest match from available list

---------------------------------------

SMART BOOKING ASSISTANT CAPABILITIES:
You can help users find the right doctor through natural language. When users say things like:
- "kal cardiologist chahiye" (need cardiologist tomorrow)
- "I want to book appointment next Monday"
- "mujhe skin specialist chahiye 10th ko"
- "book Dr. Ahmed for Friday"

Do the following:
1. UNDERSTAND the specialization needed
2. MATCH with doctors from the list above
3. SUGGEST the right doctor with ID
4. GUIDE user to book through website/app by selecting date and time slot

YOU CANNOT:
- Book appointments directly
- Confirm appointments
- Make up time slots
- Access the booking system

YOU SHOULD:
- Suggest the right doctor
- Provide their ID
- Tell user to visit the website to book
"""


def get_chatbot_reply(conversation_history: list, user_message: str, db: Session, file_context: str = None) -> str:
    """
    Get AI reply from Groq LLM with real doctors from database

    Args:
        conversation_history: List of previous messages [{"role": "user/assistant", "content": "..."}]
        user_message: Current user message
        db: SQLAlchemy database session
        file_context: Optional file context (medical report description)

    Returns:
        AI response string
    """
    # Fetch real doctors from database
    doctors_context = get_doctors_context(db)
    symptom_mapping = get_symptom_doctor_mapping()

    # Sanitize file_context: max 2000 chars, remove { and } characters
    sanitized_file_context = None
    if file_context:
        sanitized_file_context = file_context[:2000].replace("{", "").replace("}", "")

    # Add file context if provided
    file_context_note = ""
    if sanitized_file_context:
        file_context_note = f"""

MEDICAL REPORT/FILE CONTEXT:
The user has shared a medical file/report with you. Here's what they uploaded:
{sanitized_file_context}

When analyzing medical reports:
1. Ask clarifying questions about the report
2. Suggest which specialist to consult based on the report
3. NEVER give medical diagnosis - always recommend consulting a real doctor
4. Be empathetic and supportive
5. Explain medical terms in simple language
"""

    # Build system prompt with real doctors
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        DOCTORS_CONTEXT=doctors_context,
        SYMPTOM_MAPPING=symptom_mapping
    ) + file_context_note

    # Limit conversation history to last 10 messages to prevent token overflow
    limited_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history

    # Build messages array with system prompt
    messages = [
        {"role": "system", "content": system_prompt}
    ] + limited_history + [
        {"role": "user", "content": user_message}
    ]

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=GROQ_MAX_TOKENS,
            temperature=GROQ_TEMPERATURE,
        )

        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {e}")
        return "Sorry, I'm having trouble connecting right now. Please try again later or contact support for assistance."

# For testing without database - only available in development environment
def get_chatbot_reply_test(conversation_history: list, user_message: str) -> str:
    """
    Test version without database dependency
    """
    if os.getenv("ENVIRONMENT") != "development":
        raise RuntimeError("get_chatbot_reply_test is only available in development mode")

    system_prompt = """
You are a helpful medical assistant for a doctor appointment booking platform in Pakistan.

Currently, there are no doctors in the database. Please guide users to check back later or contact support.

Be empathetic and helpful with general health questions, but always mention that doctor bookings are temporarily unavailable.
"""
    
    messages = [
        {"role": "system", "content": system_prompt}
    ] + conversation_history + [
        {"role": "user", "content": user_message}
    ]

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=GROQ_MAX_TOKENS,
            temperature=GROQ_TEMPERATURE,
        )

        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {e}")
        return "Sorry, I'm having trouble connecting right now."