from datetime import datetime
import uuid
from fastapi import BackgroundTasks
from utils.success import error, result,success
from models.schemas import KnowledgeBot, User
from dotenv import load_dotenv
from bson import ObjectId
from fastapi.responses import StreamingResponse
from utils.pdf_generator import generate_pdf_bytes
load_dotenv()

 

class ChatBot:
    
    def __init__(self,pineconeService):
        self.pineconeService = pineconeService

    async def create(self,data,request,backgroundTasks:BackgroundTasks):
        id = request.state.user['id']
        user = User.objects(id = ObjectId(id)).first()
        if not user:
             return error('User Not Found')
        namespace_id = str(uuid.uuid4())  
        data_dict = data.dict()  
        data_dict['namespace_id'] = namespace_id
        data_dict['user_id'] = id 

        botData = KnowledgeBot(**data_dict)      
        botData.save()
        
        return result({"namespace_id": namespace_id}, "Congratulations, your created your bot")
    
    async def getBotByUserId(self,request):  
         id = request.query_params.get('id') if request.query_params.get('id') else request.state.user['id']
         user_id_obj = ObjectId(id)
         
         # Try to find existing skitsmith bot
         items = KnowledgeBot.objects(user_id=user_id_obj, bot_name="skitsmith")
         
         # If no bot exists, create default skitsmith bot for the user
         if not items:
            namespace_id = str(uuid.uuid4())
            default_bot = KnowledgeBot(
                user_id=user_id_obj,
                bot_name="skitsmith",
                namespace_id=namespace_id,
                description="Default SkitSmith Chatbot"
            )
            default_bot.save()
            items = KnowledgeBot.objects(user_id=user_id_obj, bot_name="skitsmith")

         return result([item.to_mongo().to_dict() for item in items])
        
    
    async def getBotById(self,id): 
         cursor = KnowledgeBot.objects(id = ObjectId(id))  
         return result(cursor.first().to_mongo().to_dict())
      
    
    async def chat_conversation(self, data):  
        """
        Handles chat conversations with proper error handling.
        Returns a streaming response with the AI's reply.
        """
        try:
            question = data.question
            namespace_id = data.namespace_id 
            
            # Validate inputs
            if not question or not question.strip():
                async def error_gen():
                    yield "Error: Please enter a question"
                return StreamingResponse(error_gen(), media_type="text/plain")
            
            if not namespace_id or not namespace_id.strip():
                async def error_gen():
                    yield "Error: Namespace ID is missing. Please select a chatbot first."
                return StreamingResponse(error_gen(), media_type="text/plain")
            
            # Build chat history
            chatHistory = ""
            if data.chatHistory:
                for chat in data.chatHistory:
                    chatHistory += f"User: {chat.question}\nAI: {chat.Ai_response}\n"
            
            return StreamingResponse(
                self.pineconeService.chain_resp(namespace_id, question, chatHistory), 
                media_type="text/plain"
            )
        except Exception as e:
            print(f"Error in chat_conversation: {str(e)}")
            import traceback
            traceback.print_exc()
            return StreamingResponse(self._error_generator(str(e)), media_type="text/plain")
    
    async def _error_generator(self, error_msg: str):
        """Generator for error responses"""
        yield f"Error: {error_msg}"

    async def generate_pdf(self, text: str, title: str = "SkitSmith Export"):
        buf = generate_pdf_bytes(text, title)
        return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=\"{title}.pdf\""})
    




    


