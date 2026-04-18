"""
Chatbot utility — Strict deterministic architecture

ARCHITECTURE:
    User Query → Validate → Parse → Filter DB → Validate Results → LLM Format → Response

RULES:
    1. Backend controls ALL logic — LLM NEVER decides
    2. No fallback that changes specialization (Neurologist search → ONLY Neurologist or nothing)
    3. No random doctors on empty result
    4. No duplicate doctors in response
    5. Garbage input → immediate rejection
"""
import os
import re
import logging
from groq import Groq
from sqlalchemy.orm import Session
from typing import Optional

# ── Logging ──────────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)

# ── Groq client ─────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = None

if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY not set — chatbot disabled")
else:
    try:
        client = Groq(api_key=GROQ_API_KEY)
        logger.info("Groq client initialized")
    except Exception as e:
        logger.error(f"Groq init failed: {e}")
        client = None

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_MAX_TOKENS = int(os.getenv("GROQ_MAX_TOKENS", "600"))
GROQ_TEMPERATURE = float(os.getenv("GROQ_TEMPERATURE", "0.3"))  # LOW temperature for deterministic output

# ── Max doctors in prompt ───────────────────────────────────────────────
MAX_DOCTORS_IN_PROMPT = 3


# ════════════════════════════════════════════════════════════════════════
# 1. INPUT VALIDATION — reject garbage before any processing
# ════════════════════════════════════════════════════════════════════════

# Patterns that indicate meaningful medical queries
_MEANINGFUL_PATTERNS = [
    # Medical keywords (English + Roman Urdu)
    r"doctor", r"specialist", r"physician", r"surgeon",
    r"dard", r"bukhaar", r"zukaam", r"khansi", r"bemar",
    r"pain", r"fever", r"cough", r"sick", r"ill", r"disease",
    r"heart", r"skin", r"bone", r"brain", r"eye", r"ear",
    r"kidney", r"stomach", r"liver", r"lung", r"tooth",
    r"checkup", r"appointment", r"book", r"consult",
    r"chahiye", r"chaiye", r"mujhe", r"kahan", r"mila",
    r"fee", r"sasta", "mehenga", r"under", r"below",
    r"city", r"mein", r"me", r"in", r"near",
    # Specialization names (partial match)
    r"cardio", r"derma", r"neuro", r"ortho", r"gynae",
    r"pediatric", r"ent", r"ophthal", r"psych", r"urolog",
    r"gastro", r"pulmo", r"endo", r"nephro", r"dent",
]


def is_meaningful_input(text: str) -> bool:
    """
    Reject gibberish like "asdasd", "aaaa", "xyz", "hjkl".
    Accept real medical queries.
    """
    if not text or len(text.strip()) < 3:
        return False

    text = text.strip()
    no_spaces = text.replace(" ", "").lower()

    # Rule 1: All same character repeated (aaaa, zzzzzz)
    if len(set(no_spaces)) == 1 and len(no_spaces) >= 3:
        return False

    # Rule 2: Only 2 unique chars repeated many times (asas, aaaa)
    if len(set(no_spaces)) <= 2 and len(no_spaces) >= 6:
        return False

    # Rule 3: Pure consonant gibberish (hjkl, qwrtps) — no vowels
    if not re.search(r"[aeiou]", no_spaces) and len(no_spaces) >= 4:
        return False

    # Rule 4: Check for at least one meaningful pattern
    for pattern in _MEANINGFUL_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True

    # Rule 5: Last resort — does it have real-looking words?
    words = text.split()
    for word in words:
        clean = re.sub(r"[^a-zA-Z]", "", word)
        if len(clean) >= 4:
            # 4+ letter words with 3+ unique chars are likely real
            if len(set(clean.lower())) >= 3:
                # Additional check: ratio of unique chars to total should be reasonable
                # "asdasdasd" has 3 unique / 9 total = 0.33 (too repetitive)
                ratio = len(set(clean.lower())) / len(clean)
                if ratio >= 0.4:
                    return True
        elif len(clean) == 3:
            # 3-letter words must have a vowel AND 3 unique chars
            if re.search(r"[aeiou]", clean, re.IGNORECASE) and len(set(clean.lower())) >= 3:
                return True

    return False


def sanitize_user_input(text: str) -> str:
    """
    Remove prompt injection patterns and cap length.
    """
    if not text:
        return ""

    text = text[:500]

    # Remove prompt injection patterns
    injection_patterns = [
        r"ignore previous", r"ignore all", r"forget all",
        r"system prompt", r"you are now", r"disregard",
        r"new instructions", r"act as", r"jailbreak",
        r"override", r"bypass", r"debug mode",
    ]
    for pattern in injection_patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)

    # Remove excessive special characters
    text = re.sub(r"[#*=_]{3,}", "", text)

    return text.strip()


# ════════════════════════════════════════════════════════════════════════
# 2. QUERY PARSER — extract filters from natural language
# ════════════════════════════════════════════════════════════════════════

SPECIALIZATION_KEYWORDS = {
    "Cardiologist":      ["heart", "cardio", "cardiac", "chest pain", "palpitation", "dil"],
    "Dermatologist":     ["skin", "derma", "acne", "rash", "pimple", "jild", "eczema"],
    "Orthopedic":        ["bone", "joint", "fracture", "arthritis", "haddi", "knee"],
    "Neurologist":       ["brain", "neuro", "migraine", "seizure", "dimaagh", "nerv"],
    "Gynecologist":      ["gynae", "pregnancy", "mahila", "period", "obstetric", "womb"],
    "Pediatrician":      ["child", "baby", "pediatric", "baccha", "vaccin", "infant", "kids"],
    "ENT Specialist":    ["ent", "ear", "nose", "throat", "kan", "naak", "gala", "sinus"],
    "Ophthalmologist":   ["eye", "vision", "aankh", "cataract", "sight", "blind"],
    "Psychiatrist":      ["mental", "depression", "anxiety", "stress", "therapy", "mood"],
    "Urologist":         ["urinary", "urine", "bladder", "gurda", "prostate"],
    "Gastroenterologist":["stomach", "digest", "liver", "gas", "acidity", "maiday"],
    "Pulmonologist":     ["lung", "breath", "asthma", "copd", "respiratory", "saans"],
    "Endocrinologist":   ["hormone", "diabetes", "thyroid", "sugar", "endocrine"],
    "Rheumatologist":    ["autoimmune", "rheuma", "lupus", "gout"],
    "Nephrologist":      ["dialysis", "nephro"],
    "General Physician": ["fever", "cold", "flu", "checkup", "bukhaar", "zukaam", "general physician"],
    "Dentist":           ["dent", "tooth", "dental", "daant", "cavity"],
    "Allergist":         ["allergy", "allergist", "sneeze"],
    "General Surgeon":   ["surgeon", "surgery", "laparoscopic", "operation"],
    "Physiotherapist":   ["physio", "rehab", "pain management", "exercise"],
}

KNOWN_CITIES = [
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
    "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
    "Hyderabad", "Abbottabad", "Sargodha", "Bahawalpur", "Sukkur",
    "Larkana", "Nawabshah", "Mirpur", "Gujrat", "Sahiwal",
]


def parse_user_query(message: str) -> dict:
    """
    Parse natural language message into structured filters.

    Returns:
        {
            "specialization": str | None,    # Exact DB specialization name
            "city": str | None,              # Title-cased city
            "max_fee": int | None,           # Upper fee bound
            "show_all": bool,                # User wants full list
            "is_vague": bool,                # Query too vague ("sasta doctor")
            "is_gibberish": bool,            # Meaningless input
        }
    """
    if not message:
        return {"is_gibberish": True}

    text = message.lower().strip()
    result: dict = {
        "specialization": None,
        "city": None,
        "max_fee": None,
        "show_all": False,
        "is_vague": False,
    }

    # ── Detect "show all" intent ────────────────────────────────────
    all_keywords = [
        "all doctors", "all doctors list", "doctor list",
        "list of doctors", "show all", "sab doctors",
        "puri list", "complete list", "saaray doctor",
    ]
    for kw in all_keywords:
        if kw in text:
            result["show_all"] = True
            return result

    # ── Detect specialization (EXACT match only) ────────────────────
    # Priority: longer/more specific keywords first
    matched_specs = []
    for spec, keywords in SPECIALIZATION_KEYWORDS.items():
        for kw in sorted(keywords, key=len, reverse=True):
            if kw in text:
                matched_specs.append(spec)
                break

    # If multiple specs matched, pick the most specific one
    if matched_specs:
        # Prefer exact specialization name mentions
        for spec in matched_specs:
            if spec.lower() in text:
                result["specialization"] = spec
                break
        # Otherwise use first keyword match
        if not result["specialization"]:
            result["specialization"] = matched_specs[0]

    # ── Detect city ─────────────────────────────────────────────────
    for city in KNOWN_CITIES:
        if city.lower() in text:
            result["city"] = city
            break

    # ── Detect max fee ──────────────────────────────────────────────
    fee_patterns = [
        r"under\s*(\d+)", r"below\s*(\d+)", r"less than\s*(\d+)",
        r"<\s*(\d+)", r"(\d+)\s*rs", r"(\d+)\s*pkrs?",
        r"fee\s*(?:of\s*)?(\d+)", r"(\d+)\s*fee",
    ]
    for pattern in fee_patterns:
        match = re.search(pattern, text)
        if match:
            result["max_fee"] = int(match.group(1))
            break

    # ── Detect vague queries ────────────────────────────────────────
    vague_patterns = [
        r"\bsasta\b", r"\bsasti\b", r"cheap doctor",
        r"koi doctor", r"koi achha", r"achha doctor",
        r"mujhe doctor", r"doctor do", r"doctor bata",
    ]
    for pattern in vague_patterns:
        if re.search(pattern, text):
            result["is_vague"] = True
            break

    return result


# ════════════════════════════════════════════════════════════════════════
# 3. DB FILTER — strict SQLAlchemy filtering, NO creative fallbacks
# ════════════════════════════════════════════════════════════════════════

def get_filtered_doctors(
    db: Session,
    filters: dict,
    limit: int = MAX_DOCTORS_IN_PROMPT,
) -> list:
    """
    Fetch doctors using STRICT backend-controlled filters.

    Returns: list of (doctor, user, days_str) tuples

    RULES:
        - Exact specialization match (if specified)
        - Exact city match (if specified)
        - Fee <= max_fee (if specified)
        - NO fallback that changes specialization
        - NO random doctors on empty result
    """
    from models import Doctor, User, Schedule

    # ── Show ALL doctors ────────────────────────────────────────────
    if filters.get("show_all"):
        doctors = (
            db.query(Doctor, User)
            .join(User, Doctor.user_id == User.id)
            .filter(Doctor.is_approved == True)
            .all()
        )
        return _enrich_with_schedules(db, doctors, limit=None)

    # ── Build strict query ──────────────────────────────────────────
    query = (
        db.query(Doctor, User)
        .join(User, Doctor.user_id == User.id)
        .filter(Doctor.is_approved == True)
    )

    specialization = filters.get("specialization")
    city = filters.get("city")
    max_fee = filters.get("max_fee")

    # Apply specialization filter (EXACT match)
    if specialization:
        query = query.filter(Doctor.specialization == specialization)

    # Apply city filter (EXACT match)
    if city:
        query = query.filter(Doctor.city == city)

    # Apply fee filter
    if max_fee:
        query = query.filter(Doctor.consultation_fee <= max_fee)

    doctors = query.all()

    # ── FALLBACK: If no results, ONLY relax fee or city ─────────────
    # NEVER change specialization. If user asked for Neurologist,
    # only show Neurologists (or nothing).
    if not doctors:
        # Try relaxing fee first (increase by 50%)
        if max_fee:
            relaxed_fee = int(max_fee * 1.5)
            query = (
                db.query(Doctor, User)
                .join(User, Doctor.user_id == User.id)
                .filter(Doctor.is_approved == True)
            )
            if specialization:
                query = query.filter(Doctor.specialization == specialization)
            if city:
                query = query.filter(Doctor.city == city)
            query = query.filter(Doctor.consultation_fee <= relaxed_fee)
            doctors = query.all()
            if doctors:
                filters["_fee_relaxed"] = True
                filters["_original_max_fee"] = max_fee
                filters["max_fee"] = relaxed_fee
                logger.info(
                    f"Fee relaxed: {max_fee} → {relaxed_fee} "
                    f"(spec={specialization}, city={city})"
                )

        # If still no results, try removing city (keep specialization)
        if not doctors and city and specialization:
            query = (
                db.query(Doctor, User)
                .join(User, Doctor.user_id == User.id)
                .filter(Doctor.is_approved == True)
                .filter(Doctor.specialization == specialization)
            )
            doctors = query.all()
            if doctors:
                filters["_city_removed"] = True
                filters["_original_city"] = city
                del filters["city"]
                logger.info(
                    f"City removed: searched {specialization} in all cities"
                )

        # CRITICAL: If STILL no doctors, return empty list
        # DO NOT suggest General Physician or random doctors
        if not doctors:
            logger.info(
                f"No doctors found: spec={specialization}, city={city}, "
                f"max_fee={max_fee}. Returning empty."
            )
            return []

    return _enrich_with_schedules(db, doctors, limit=limit)


def _enrich_with_schedules(
    db: Session,
    doctors: list,
    limit: Optional[int] = MAX_DOCTORS_IN_PROMPT,
) -> list:
    """
    Fetch schedules for doctors in ONE query.
    Returns deduplicated list of (doctor, user, days_str) tuples.
    """
    from models import Schedule

    if not doctors:
        return []

    # ── Deduplicate by doctor ID ────────────────────────────────────
    seen_ids = set()
    unique_doctors = []
    for doctor, user in doctors:
        if doctor.id not in seen_ids:
            seen_ids.add(doctor.id)
            unique_doctors.append((doctor, user))

    # ── Fetch schedules ─────────────────────────────────────────────
    doctor_ids = [d.id for d, _ in unique_doctors]
    schedules = (
        db.query(Schedule)
        .filter(
            Schedule.doctor_id.in_(doctor_ids),
            Schedule.is_available == True,
        )
        .all()
    )

    schedules_map: dict[int, list] = {}
    for s in schedules:
        schedules_map.setdefault(s.doctor_id, []).append(s.day_of_week)

    result = []
    iterable = unique_doctors[:limit] if limit else unique_doctors
    for doctor, user in iterable:
        days = schedules_map.get(doctor.id, [])
        days_str = ", ".join(days) if days else "Not specified"
        result.append((doctor, user, days_str))

    return result


def validate_doctor_matches(
    doctors: list,
    filters: dict,
) -> tuple[list, list]:
    """
    Validate that returned doctors actually match the requested filters.
    Returns: (valid_doctors, invalid_doctors)
    """
    if not doctors or not filters.get("specialization"):
        return doctors, []

    valid = []
    invalid = []
    for doctor, user, days_str in doctors:
        if doctor.specialization == filters["specialization"]:
            valid.append((doctor, user, days_str))
        else:
            invalid.append((doctor, user, days_str))
            logger.warning(
                f"Doctor ID {doctor.id} has spec '{doctor.specialization}' "
                f"but user requested '{filters['specialization']}'"
            )

    return valid, invalid


# ════════════════════════════════════════════════════════════════════════
# 4. DOCTOR FORMATTER — compact, deduplicated text for LLM
# ════════════════════════════════════════════════════════════════════════

def format_doctors_for_prompt(doctors: list) -> str:
    """
    Format (doctor, user, days_str) tuples into compact prompt text.
    Deduplicated, ~4 lines per doctor.
    """
    if not doctors:
        return ""

    seen_ids = set()
    lines = []

    for doctor, user, days_str in doctors:
        # Skip duplicates
        if doctor.id in seen_ids:
            continue
        seen_ids.add(doctor.id)

        # Handle Dr. prefix (case-insensitive)
        name = user.name.strip()
        if not name.lower().startswith("dr.") and not name.lower().startswith("dr "):
            name = f"Dr. {name}"

        parts = [
            f"- {name} (ID: {doctor.id}) | {doctor.specialization}",
            f"  📍 {doctor.city or 'N/A'}  |  💰 PKR {doctor.consultation_fee}",
            f"  📅 {days_str}",
        ]
        if doctor.qualification:
            parts.append(f"  🎓 {doctor.qualification}")
        lines.append("\n".join(parts))

    return "\n\n".join(lines)


# ════════════════════════════════════════════════════════════════════════
# 5. SYSTEM PROMPT — LLM is ONLY a formatter
# ════════════════════════════════════════════════════════════════════════

SYSTEM_PROMPT_TEMPLATE = """\
You are an AI Health Assistant for a doctor appointment booking platform in Pakistan.

YOUR ONLY JOB:
Format the provided doctor list into a clean, natural response.
You must NOT filter, decide, suggest alternatives, or invent anything.

STRICT RULES:
1. Reply in SAME language as the user's message
2. ONLY use doctors listed below — NEVER add, remove, or modify
3. Copy details EXACTLY: name, ID, specialization, city, fee, days
4. Show MAX 3 doctors
5. NEVER pretend to book appointments
6. NEVER suggest alternatives not in the list
7. NEVER say "no data found" if doctors ARE provided

RESPONSE FORMAT:
👨‍⚕️ Available Doctors:

1. Name (ID: X)
   📍 City
   💰 PKR fee
   📅 Days

[1 line: guide user to book via website/app]

If the doctor list below is EMPTY, reply EXACTLY with:
"Is criteria ke mutabiq koi doctor available nahi hai. Aap fee range increase karein ya dusri city try karein."

DO NOT add anything else when the list is empty.
"""


# ════════════════════════════════════════════════════════════════════════
# 6. PRE-BUILT RESPONSES — bypass LLM for empty/error cases
# ════════════════════════════════════════════════════════════════════════

RESPONSE_NO_DOCTORS = (
    "Is criteria ke mutabiq koi doctor available nahi hai. "
    "Aap fee range increase karein ya dusri city try karein."
)

RESPONSE_GIBBERISH = "Please enter a valid medical query."

RESPONSE_VAGUE = (
    "Please be more specific. Tell me what type of doctor you need "
    "(e.g., heart, skin, bone, children, women's health) "
    "or which city you're in."
)

RESPONSE_NO_GROQ = (
    "AI chatbot is currently unavailable. "
    "Please browse doctors directly on the website."
)


# ════════════════════════════════════════════════════════════════════════
# 7. MAIN ENTRY — full pipeline
# ════════════════════════════════════════════════════════════════════════

def get_chatbot_reply(
    conversation_history: list,
    user_message: str,
    db: Session,
    file_context: str = None,
) -> str:
    """
    Full pipeline:
        1. Sanitize input (remove injection)
        2. Validate input (reject gibberish)
        3. Parse query → extract filters
        4. Filter DB (strict, no creative fallbacks)
        5. Validate results (ensure specialization matches)
        6. LLM formats response (ONLY if doctors found)
        7. Return — bypass LLM for empty results

    Returns: deterministic, user-friendly string
    """
    if not client:
        return RESPONSE_NO_GROQ

    try:
        # ── Step 1: Sanitize ────────────────────────────────────────
        clean_message = sanitize_user_input(user_message)

        if not clean_message or len(clean_message) < 2:
            return RESPONSE_GIBBERISH

        # ── Step 2: Validate input quality ──────────────────────────
        if not is_meaningful_input(clean_message):
            logger.info(f"Gibberish input rejected: '{user_message}'")
            return RESPONSE_GIBBERISH

        # ── Step 3: Parse query ─────────────────────────────────────
        filters = parse_user_query(clean_message)

        # Handle vague queries ("sasta doctor", "koi doctor batao")
        if filters.get("is_vague") and not filters.get("specialization") and not filters.get("city"):
            logger.info(f"Vague query: '{clean_message}'")
            return RESPONSE_VAGUE

        logger.info(f"Parsed filters: {filters}")

        # ── Step 4: Filter DB ───────────────────────────────────────
        doctors = get_filtered_doctors(db, filters)

        # ── Step 5: Validate results ────────────────────────────────
        valid_doctors, invalid_doctors = validate_doctor_matches(doctors, filters)

        if invalid_doctors:
            logger.warning(
                f"{len(invalid_doctors)} doctors had wrong specialization — removed"
            )

        doctors = valid_doctors

        # ── Step 6a: NO doctors → bypass LLM entirely ──────────────
        if not doctors:
            logger.info("No doctors found — returning pre-built response")
            return RESPONSE_NO_DOCTORS

        # ── Step 6b: Doctors found → LLM formats ───────────────────
        doctors_text = format_doctors_for_prompt(doctors)

        # Build minimal prompt
        system_prompt = SYSTEM_PROMPT_TEMPLATE
        final_prompt = system_prompt + "\n\nDOCTORS TO FORMAT:\n" + doctors_text

        # Limit history
        if conversation_history is None:
            conversation_history = []
        limited_history = conversation_history[-8:]

        messages = (
            [{"role": "system", "content": final_prompt}]
            + limited_history
            + [{"role": "user", "content": clean_message}]
        )

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=GROQ_MAX_TOKENS,
            temperature=GROQ_TEMPERATURE,
        )

        reply = response.choices[0].message.content

        # ── Step 7: Validate LLM output ─────────────────────────────
        # Ensure LLM didn't hallucinate doctor names
        for doctor, user, _ in doctors:
            name = user.name.strip()
            if name.lower().startswith("dr.") or name.lower().startswith("dr "):
                display_name = name
            else:
                display_name = f"Dr. {name}"

            # If LLM removed the doctor name entirely, fix it
            if display_name.split()[0] not in reply and "Dr." not in reply:
                logger.warning("LLM may have hallucinated — using fallback format")
                return _fallback_format(doctors, clean_message)

        return reply

    except Exception as e:
        logger.error(f"get_chatbot_reply failed: {e}", exc_info=True)
        try:
            db.rollback()
        except Exception:
            pass
        return "I'm experiencing technical difficulties. Please try again or browse doctors on the website."


def _fallback_format(doctors: list, user_message: str) -> str:
    """
    If LLM output is invalid, format response ourselves (no LLM).
    Pure deterministic fallback.
    """
    if not doctors:
        return RESPONSE_NO_DOCTORS

    lines = ["👨‍⚕️ Available Doctors:"]

    for i, (doctor, user, days_str) in enumerate(doctors[:3], 1):
        name = user.name.strip()
        if not name.lower().startswith("dr.") and not name.lower().startswith("dr "):
            name = f"Dr. {name}"

        lines.append(f"\n{i}. {name} (ID: {doctor.id})")
        lines.append(f"   📍 {doctor.city or 'N/A'}")
        lines.append(f"   💰 PKR {doctor.consultation_fee}")
        lines.append(f"   📅 {days_str}")

    lines.append("\nPlease visit the website to book your appointment.")
    return "\n".join(lines)


# ════════════════════════════════════════════════════════════════════════
# 8. TEST MODE — dev only
# ════════════════════════════════════════════════════════════════════════

def get_chatbot_reply_test(conversation_history: list, user_message: str) -> str:
    """Development-only — uses parsed filters without DB."""
    if os.getenv("ENVIRONMENT") != "development":
        raise RuntimeError("Only available in development mode")

    if not client:
        return RESPONSE_NO_GROQ

    clean = sanitize_user_input(user_message)
    if not is_meaningful_input(clean):
        return RESPONSE_GIBBERISH

    filters = parse_user_query(clean)

    system_prompt = (
        f"Test mode. Parsed query: {filters}. "
        "No doctors in DB. Tell user to check back later."
    )

    messages = [
        {"role": "system", "content": system_prompt}
    ] + (conversation_history or [])[-8:] + [
        {"role": "user", "content": clean}
    ]

    try:
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=GROQ_MAX_TOKENS,
            temperature=GROQ_TEMPERATURE,
        )
        return resp.choices[0].message.content
    except Exception as e:
        logger.error(f"Test mode error: {e}")
        return f"Test mode — Parsed: {filters}. Error: {e}"
