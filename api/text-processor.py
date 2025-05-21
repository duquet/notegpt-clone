from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from wtpsplit import SaT
import uvicorn

app = FastAPI()

# Initialize the model
sat = SaT("wtpsplit-base")


class TextRequest(BaseModel):
    text: str


@app.post("/api/process-text")
async def process_text(request: TextRequest):
    try:
        # Split the text into sentences
        sentences = sat.split(request.text)

        # Join sentences with proper punctuation
        processed_text = ". ".join(sentences)

        return {"processed_text": processed_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
