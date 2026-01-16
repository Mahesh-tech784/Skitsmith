from fastapi import APIRouter,UploadFile,File,BackgroundTasks,Form,Request,Depends
from models.dto import DeleteFileDTO,ChatRequest,CreateBot,DeleteFilesDTO
from services.chat_bot_service import ChatBot
from typing import List
from services.pinecone_service import PineconeService
from utils.helper import get_current_token 
from pydantic import BaseModel
router = APIRouter() 

pineconeService = PineconeService()
chatBotService = ChatBot(pineconeService)

 
# Bot creation is disabled - users get a default "skitsmith" bot on registration
# @router.post("",dependencies=[Depends(get_current_token)])
# async def create(data:CreateBot,request: Request,backgroundTasks: BackgroundTasks = None):
#     return await chatBotService.create(data,request,backgroundTasks)

@router.get("/all",dependencies=[Depends(get_current_token)])
async def getBotByUserId(request: Request):
    return await chatBotService.getBotByUserId(request)


@router.post("/chat")
async def chatConversation(data: ChatRequest, token: str = Depends(get_current_token)):
    return await chatBotService.chat_conversation(data)

@router.get("/{id}",dependencies=[Depends(get_current_token)])
async def getBotById(id: str):
    return await chatBotService.getBotById(id)


class PDFRequest(BaseModel):
    text: str
    title: str = "SkitSmith Export"


@router.post("/pdf",dependencies=[Depends(get_current_token)])
async def generate_pdf(data: PDFRequest):
    return await chatBotService.generate_pdf(data.text, data.title)

# @router.post("/fileUpload")
# async def upload(namespace_id: str= Form(...),files: List[UploadFile] = File(...),backgroundTasks: BackgroundTasks = None):
#     return await chatBotService.upload_files(namespace_id,files,backgroundTasks)

# @router.get("/files")
# async def getFiles(namespace_id: str):
#     return await chatBotService.get_files(namespace_id)

# @router.delete("/files")
# async def deleteFiles(data:DeleteFilesDTO,backgroundTasks: BackgroundTasks):
#     return await chatBotService.delete_files(data,backgroundTasks)

# @router.delete("/file")
# async def deleteFile(data:DeleteFileDTO,backgroundTasks: BackgroundTasks):
#     return await chatBotService.delete_file(data,backgroundTasks)



 

 