from mongoengine import connect
import os

def init_db():
    # Connection with optimal settings for performance
    client = connect(
        host=os.getenv("MONGODB_URL"),
        db=os.getenv("DB"),
        serverSelectionTimeoutMS=5000,  # Fail fast if no server available
        connectTimeoutMS=10000,
        socketTimeoutMS=10000,
        retryWrites=True,
        maxPoolSize=50  # Connection pool size for better concurrency
    )
    

    