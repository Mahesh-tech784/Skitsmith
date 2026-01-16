import os
from config import constants
from utils.backgroud_exeption import handleExceptions
from utils.processor import parse_pdf,parse_text
from dotenv import load_dotenv
from pinecone import Pinecone
load_dotenv()
from langchain_pinecone import  PineconeVectorStore
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import ChatPromptTemplate 
from langchain_mistralai import ChatMistralAI,MistralAIEmbeddings
 

embed_model = MistralAIEmbeddings(
    model=os.getenv('MISTRAL_EMBED_MODEL'), 
    api_key=os.getenv('MISTRAL_API_KEY'),
    
)

llm = ChatMistralAI(
            mistral_api_key=os.getenv('MISTRAL_API_KEY'),
            model=os.getenv('MISTRAL_MODEL'),
            temperature=0, 
             )

pc=Pinecone(api_key=os.getenv('PINECONE_API_KEY'), environment=os.getenv('PINECONE_ENV'))

class PineconeService:  
    
    @handleExceptions
    async def vectorize_documents_main(self, namespace_id: str):
        """
        Vectorizes documents from the upload directory and stores them in Pinecone.
        Validates inputs and provides detailed error messages.
        """
        try:
            in_process_dir: str = os.path.join(constants.UPLOAD_DIR, namespace_id, constants.PRIMARY_FOLDER)
            
            # Check if directory exists
            if not os.path.exists(in_process_dir):
                print(f"Error: Upload directory does not exist: {in_process_dir}")
                raise FileNotFoundError(f"Upload directory not found: {in_process_dir}")
            
            documents = dict()
            documents[namespace_id] = list()

            # List files in directory
            files_in_dir = os.listdir(in_process_dir)
            print(f"Files found in {in_process_dir}: {files_in_dir}")
            
            if not files_in_dir:
                print(f"Warning: No files found in {in_process_dir}")
                return {"message": "No files to process in directory"}

            for file in files_in_dir:
                file_path: str = os.path.join(in_process_dir, file)
                
                # Skip if it's a directory
                if os.path.isdir(file_path):
                    print(f"Skipping directory: {file}")
                    continue

                # Process file
                print(f"Processing file: {file}")
                file_ext = file.split('.')[-1].lower()
                
                try:
                    if file_ext == 'txt':
                        documents[namespace_id].extend(parse_text(file_path))
                    elif file_ext == 'pdf':
                        documents[namespace_id].extend(parse_pdf(file_path))
                    else:
                        print(f"Unsupported file format: {file_ext}, skipping {file}")
                        continue
                    
                    # Remove file after processing
                    os.remove(file_path)
                    print(f"Successfully processed and removed: {file}")
                except Exception as file_error:
                    print(f"Error processing file {file}: {str(file_error)}")
                    continue

            # Check if we have documents to vectorize
            if not documents[namespace_id]:
                print(f"Warning: No documents extracted from files in {namespace_id}")
                return {"message": "No documents extracted from uploaded files"}
            
            print(f"Total documents extracted: {len(documents[namespace_id])}")

            # Vectorize and store in Pinecone
            pinecone_namespace = namespace_id

            for key, val in documents.items():
                print(f"Vectorizing {len(val)} documents for namespace: {pinecone_namespace}")
                try:
                    vectorstore_from_docs_faq = PineconeVectorStore.from_documents(
                        documents[key],
                        index_name=os.getenv('PINECONE_INDEX'),
                        embedding=embed_model,
                        namespace=pinecone_namespace
                    )
                    print(f"Successfully vectorized and stored documents in namespace: {pinecone_namespace}")
                except Exception as vectorize_error:
                    print(f"Error vectorizing documents: {str(vectorize_error)}")
                    import traceback
                    traceback.print_exc()
                    raise vectorize_error
            
            return {"message": "File uploaded and vectorized successfully!"}
        except Exception as e:
            print(f"Error in vectorize_documents_main: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e

    @handleExceptions
    async def delete_vectorized_docs(self, namespace_id: str, key: str, values: list[str]):
        index = pc.Index(os.getenv('PINECONE_INDEX'))   
        filter_condition = {key: {"$in": values}}
        response = index.delete(delete_all=False, namespace=namespace_id, filter=filter_condition)
        return response   

    async def chain_resp(self, namespace_id: str, question: str, chatHistory: str):
        """
        Generator function that streams chat responses.
        Yields error messages if something goes wrong.
        """
        try:
            # Validate inputs
            if not question or not question.strip():
                yield "Error: Question cannot be empty"
                return
            
            if not namespace_id or not namespace_id.strip():
                yield "Error: Namespace ID is missing"
                return
            
            system_prompt = """You are SkitSmith, a creative AI assistant for generating skits, scripts, stories, and dialogues.

Follow these rules:
1. Generate creative content based on user instructions
2. Only generate if instructions include: what to create, format, and at least one creative constraint (genre, tone, theme, characters, setting, length)
3. If instructions are unclear or missing details, respond: "Try again with clearer instructions."
4. Output only the formatted creative content - no explanations or system text
5. Use this format for skits:
   - Title
   - Genre
   - Topic
   - Characters (bullet list)
   - Setting
   - Scene Description
   - Scene dialogue (character names with dialogue below)
   - Ending
6. Do not add new constraints or repeat the user instruction"""

            user_template = """Based on the following context, generate the requested creative content.

Chat History: {chatHistory}

Available Context from Documents: {fileContent}

User Request: {question}"""

            index = pc.Index(os.getenv('PINECONE_INDEX'))
            from langchain.prompts import PromptTemplate
            prompt_template = PromptTemplate(template=user_template, input_variables=["chatHistory", "fileContent", "question"])

            try:
                vectorstore = PineconeVectorStore(
                    index=index, embedding=embed_model, text_key=os.getenv('PINECONE_TEXT_FIELD'), namespace=namespace_id
                ) 
                print(f"Connected to Pinecone namespace: {namespace_id}")
            except Exception as pc_error:
                print(f"Error connecting to Pinecone: {str(pc_error)}")
                yield f"Error: Unable to connect to the vector database. {str(pc_error)}"
                return

            try:
                retrieved_data = vectorstore.similarity_search(question, namespace=namespace_id, k=3)
                print(f"Retrieved {len(retrieved_data)} documents from Pinecone")
            except Exception as search_error:
                print(f"Error searching Pinecone: {str(search_error)}")
                yield f"Error: Unable to search documents. {str(search_error)}"
                return
            
            fileContent = ""

            for doc in retrieved_data: 
                if doc.metadata.get("type") == "pdf":
                    fileContent += f"{doc.page_content.strip()} \n Page No :{doc.metadata['page']} \n File Name : {doc.metadata['name']}" 
                else:
                    fileContent += f"{doc.page_content.strip()} \n File Name : {doc.metadata['name']}" 
                  
            if fileContent is None or fileContent.strip() == "":
                print(f"Warning: No documents found in namespace {namespace_id}. Proceeding without document context.")
            
            try:
                from langchain_core.messages import SystemMessage, HumanMessage
                
                # Create messages with system prompt separate from user input
                system_message = SystemMessage(content=system_prompt)
                
                # Format the user message with actual values
                user_message_content = user_template.format(
                    question=question, 
                    chatHistory=chatHistory, 
                    fileContent=fileContent
                )
                user_message = HumanMessage(content=user_message_content)
                
                # Use the LLM with both system and user messages
                messages = [system_message, user_message]
                chain = llm | StrOutputParser()

                for chunk in chain.stream(messages):
                    if chunk:  # Only yield non-empty chunks
                        yield chunk
            except Exception as llm_error:
                print(f"-----Error in LLM chain.stream-----: {str(llm_error)}")
                import traceback
                traceback.print_exc()
                yield f"Error generating response from LLM: {str(llm_error)}"
        except Exception as e:
            print(f"-----Error in chain_resp-----: {str(e)}")
            import traceback
            traceback.print_exc()
            yield f"Error: {str(e)}" 
  
          
      
            