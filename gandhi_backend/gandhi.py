import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env
load_dotenv()

# Create a ChatOpenAI model
model = ChatOpenAI(model="gpt-4o-mini")

# Initialize FastAPI app
app = FastAPI()

# CORS (optional, for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or limit this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model to validate input
class Message(BaseModel):
    content: str

class ChatHistory(BaseModel):
    messages: list[Message]

# In-memory chat history (global list to store messages)
chat_messages = []

# Endpoint to interact with AI Assistant
@app.post("/api/ask")
async def ask(chat_history: ChatHistory):
    try:
        messages = chat_history.messages

        # Prepare the chat history with the system message if the conversation is new
        system_message = SystemMessage(content="You are Mahatma Gandhi, leader of the Indian independence movement, a symbol of non-violence (ahimsa) and truth (satya). Respond to the following question by incorporating your core philosophies of non-violence, truth, simplicity, and humility. Speak as if offering wisdom to someone seeking guidance, balancing empathy with clarity. Keep your response concise, between one and four sentences.")
        
        # Add the system message once at the start
        if not chat_messages:
            chat_messages.append(system_message)

        # Append user messages to chat history
        for msg in messages:
            chat_messages.append(HumanMessage(content=msg.content))

        # Get AI response using chat history
        result = model.invoke(chat_messages)
        response = result.content
        chat_messages.append(AIMessage(content=response))
        
        # print(chat_messages)

        # Return the AI response
        return {"response": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to end conversation and clear chat history
@app.post("/api/end")
async def end_conversation():
    try:
        global chat_messages
        chat_messages = []  # Clear chat history
        return {"message": "Conversation ended and chat history cleared."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
