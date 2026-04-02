import os
from groq import Groq
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from database import get_db

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def get_doctors_context(db: Session) -> str:
    """
    Fetch all approved doctors from database with their schedules
    Returns formatted string context for AI system prompt
    """
    from models import Doctor, User, Schedule
    
    # Get all approved doctors
    doctors = db.query(Doctor).filter(
        Doctor.is_approved == True
    ).all()
    
    if not doctors:
        return "No doctors currently available in the system."
    
    doctors_context = []
    
    for doctor in doctors:
        # Get doctor's user info
        user = db.query(User).filter(User.id == doctor.user_id).first()
        doctor_name = user.name if user else "Unknown"
        
        # Get doctor's schedule (available days)
        schedules = db.query(Schedule).filter(
            Schedule.doctor_id == doctor.id,
            Schedule.is_available == True
        ).all()
        
        available_days = [s.day_of_week for s in schedules]
        available_days_str = ", ".join(available_days) if available_days else "Not specified"
        
        # Build doctor info
        doctor_info = f"""
- Dr. {doctor_name} (ID: {doctor.id})
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


def get_chatbot_reply(conversation_history: list, user_message: str, db: Session) -> str:
    """
    Get AI reply from Groq LLM with real doctors from database
    
    Args:
        conversation_history: List of previous messages [{"role": "user/assistant", "content": "..."}]
        user_message: Current user message
        db: SQLAlchemy database session
    
    Returns:
        AI response string
    """
    # Fetch real doctors from database
    doctors_context = get_doctors_context(db)
    symptom_mapping = get_symptom_doctor_mapping()
    
    # Build system prompt with real doctors
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        DOCTORS_CONTEXT=doctors_context,
        SYMPTOM_MAPPING=symptom_mapping
    )
    
    # Build messages array with system prompt
    messages = [
        {"role": "system", "content": system_prompt}
    ] + conversation_history + [
        {"role": "user", "content": user_message}
    ]

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            max_tokens=600,
            temperature=0.7,
        )

        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {e}")
        return "Sorry, I'm having trouble connecting right now. Please try again later or contact support for assistance."


# For testing without database
def get_chatbot_reply_test(conversation_history: list, user_message: str) -> str:
    """
    Test version without database dependency
    """
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
            model="llama-3.1-8b-instant",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )

        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {e}")
        return "Sorry, I'm having trouble connecting right now."
