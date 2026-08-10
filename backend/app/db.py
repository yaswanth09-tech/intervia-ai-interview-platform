import certifi
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

client: AsyncIOMotorClient = AsyncIOMotorClient(
    settings.mongo_uri,
    tlsCAFile=certifi.where(),
)
db = client[settings.mongo_db_name]

users_collection = db["users"]
resumes_collection = db["resumes"]
sessions_collection = db["interview_sessions"]