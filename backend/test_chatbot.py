"""
Test script to verify chatbot is fetching real doctors from database
"""
from database import get_db
from utils.chatbot import get_doctors_context, get_chatbot_reply

# Get database session
db = next(get_db())

print("=" * 60)
print("TEST 1: get_doctors_context()")
print("=" * 60)

doctors_context = get_doctors_context(db)
print(doctors_context)

print("\n" + "=" * 60)
print("TEST 2: Chatbot Response (when NO doctors in DB)")
print("=" * 60)

# Test conversation - asking for doctor when none exist
history = []
user_message = "Mujhe heart specialist chahiye Karachi mein"

reply = get_chatbot_reply(history, user_message, db)
print(f"\nUser: {user_message}")
print(f"\nBot: {reply}")

print("\n" + "=" * 60)
print("TEST 3: Chatbot Response (general health question)")
print("=" * 60)

user_message2 = "Bukhaar mein kya karein?"
reply2 = get_chatbot_reply(history, user_message2, db)
print(f"\nUser: {user_message2}")
print(f"\nBot: {reply2}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
