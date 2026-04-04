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

            # Build doctor info
            doctor_info = f"""
- Dr. {user.name} (ID: {doctor.id})
  - Specialization: {doctor.specialization}
  - City: {doctor.city or 'Not specified'}
  - Consultation Fee: PKR {doctor.consultation_fee}
  - Qualification: {doctor.qualification or 'Not specified'}
  - Experience: {doctor.experience_years} years
  - Available Days: {available_days_str}
  - Bio: {doctor.bio or 'No bio available'}
            """.strip()

            doctors_context.append(doctor_info)

        return "\n\n".join(doctors_context)
    except Exception as e:
        print(f"get_doctors_context error: {e}")
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
You are a Pakistani health assistant for a doctor appointment booking platform.

LANGUAGE DETECTION - CRITICAL RULES:
1. Detect the user's language automatically from their message
2. ALWAYS reply in the EXACT same language the user is using
3. NEVER switch languages unless the user switches first
4. If user mixes languages, reply in their dominant language
5. NEVER reply in English if user wrote in Urdu script
6. NEVER reply in Urdu script if user wrote in Roman Urdu or English

SUPPORTED LANGUAGES (ONLY 3):

1. URDU (اردو) - Arabic Script
   User: "مجھے ڈاکٹر چاہیے"
   You: "آپ کو کس قسم کے ڈاکٹر کی ضرورت ہے؟ ہمارے پاس کارڈیولوجسٹ، ڈرمیٹولوجسٹ، اور جنرل فزیشن موجود ہیں۔"
   
2. ROMAN URDU - Latin Script (Urdu words in English letters)
   User: "mujhe doctor chahiye"
   You: "Aapko kis type ka doctor chahiye? Hamare paas cardiologist, dermatologist, aur general physician maujood hain."
   
3. ENGLISH - Latin Script
   User: "I need a doctor"
   You: "What type of doctor do you need? We have cardiologists, dermatologists, and general physicians available."

LANGUAGE DETECTION TIPS:
- Urdu uses Arabic script with letters like: چ، ڈ، ڑ، ژ، گ، ں، ھ، ی
- Roman Urdu uses Latin alphabet (a-z) with Urdu/Hindi words (e.g., "chahiye", "doctor", "meri")
- English uses Latin alphabet (a-z) with English words (e.g., "need", "want", "please")

YOUR JOB:
1. Help patients understand their symptoms and suggest which type of doctor they should see
2. Answer general health questions in the user's language
3. Guide users on how to use the platform (booking, cancelling appointments)
4. Recommend doctors from the database based on symptoms, city, and availability

CRITICAL RULES - READ CAREFULLY:
- ONLY recommend doctors that are listed in "AVAILABLE DOCTORS IN DATABASE" section below
- If the database shows "No doctors currently available", say the appropriate message in user's language
- NEVER create fake doctor names, IDs, or information
- NEVER say "Dr. [Name]" if that doctor is not in the database
- Always mention the doctor's EXACT ID from the database when recommending
- If you're not sure, ask the user to check the doctors list on the website

{SYMPTOM_MAPPING}

AVAILABLE DOCTORS IN DATABASE:
{DOCTORS_CONTEXT}

IMPORTANT: If the "AVAILABLE DOCTORS IN DATABASE" section is empty or says "No doctors currently available":
- Do NOT invent doctors
- Do NOT make up names like "Dr. Ahmed", "Dr. Khan", etc.
- Politely inform the user that no doctors are available right now (in their language)
- Suggest they check back later or contact support

SMART BOOKING ASSISTANT CAPABILITIES:
You can help users book appointments through natural language. When users say things like:
- "kal cardiologist chahiye" (need cardiologist tomorrow)
- "I want to book appointment next Monday"
- "mujhe skin specialist chahiye 10th ko"
- "book Dr. Ahmed for Friday"

Do the following:
1. UNDERSTAND the date: Parse relative dates like "kal" (tomorrow), "aaj" (today), "parson" (day after), days of week, or specific dates
2. UNDERSTAND the specialization: Map symptoms or doctor type to specialization
3. CHECK availability: Look at the available doctors list and match
4. SUGGEST ACTION: Tell the user exactly which doctor to book with doctor ID and guide them

DATE PARSING RULES:
- "aaj" / "today" = current date
- "kal" / "tomorrow" = next day
- "parson" / "day after tomorrow" = 2 days from now
- Days of week (Monday, Tuesday, etc.) = next occurrence of that day
- Specific dates (10th, 15 March, etc.) = parse accordingly
- Always convert to YYYY-MM-DD format when suggesting

BOOKING RESPONSE FORMAT:
When user wants to book, respond in this format:

URDU:
"میں نے آپ کے لیے ڈاکٹر [نام] (ID: [X]) کو [تاریخ] کو [وقت] کے لیے دیکھا ہے۔
📅 تاریخ: [تاریخ]
⏰ دستیاب اوقات: [اوقات]
💰 فیس: PKR [فیس]

براہ کرم بکنگ کے لیے یہ لنک استعمال کریں: /patient/book/[ID]"

ROMAN URDU:
"Maine aapke liye Dr. [Name] (ID: [X]) ko check kiya hai [Date] ke liye.
📅 Date: [Date]
⏰ Available times: [Times]
💰 Fee: PKR [Fee]

Booking ke liye ye link use karein: /patient/book/[ID]"

ENGLISH:
"I've checked Dr. [Name] (ID: [X]) for you on [Date].
📅 Date: [Date]
⏰ Available times: [Times]
💰 Fee: PKR [Fee]

Click here to book: /patient/book/[ID]"

PLATFORM FEATURES:
- Search doctors by specialization and city
- Book appointment slots (15/30/60 minutes)
- View appointment history
- Leave reviews after completed appointments
- AI-powered health assistant (that's me!)

When recommending doctors (ONLY if doctors exist in database):
1. Match the specialization based on symptoms
2. Consider the city if user mentions location
3. Mention consultation fee if relevant
4. Always include the doctor's ID for booking reference
5. Reply in the SAME language the user is using

Example response formats:

URDU:
"آپ کی علامات کو دیکھتے ہوئے، میں ڈاکٹر [نام] (ID: [X]) کی تجویز کرتا ہوں، جو [شہر] میں [تخصص] ہیں۔ فیس: PKR [فیس]"

ROMAN URDU:
"Aapki symptoms ko dekhte hue, main Dr. [Name] (ID: [X]) ki recommendation karta hoon, jo [City] mein [Specialization] hain. Fee: PKR [Fee]"

ENGLISH:
"Based on your symptoms, I recommend Dr. [Name] (ID: [X]), a [Specialization] in [City]. Fee: PKR [Fee]"
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