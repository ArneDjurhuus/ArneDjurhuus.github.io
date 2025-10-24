from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

class Event(BaseModel):
    type: str
    payload: dict

class DigestRequest(BaseModel):
    events: List[Event]

@app.post("/digest")
def create_digest(request: DigestRequest):
    summary = f"Generated digest from {len(request.events)} events."
    return {"id": "digest-123", "summary": summary}
