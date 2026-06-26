# main.py — FastAPI backend for MRLA

import os
import re
import json
import asyncio
import tempfile
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from groq import RateLimitError

from pipeline import (
    run_research_pipeline_stream,
    review_user_report,
    compare_reports,
    load_report_from_file,
    save_as_docx_to_bytes
)

app = FastAPI(title="MRLA API", description="Multi-agent Research & Literature Analyzer Backend")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    topic: str


class DownloadRequest(BaseModel):
    content: str
    topic: str


# Custom handler for Groq RateLimitError (HTTP 429)
@app.exception_handler(RateLimitError)
async def groq_rate_limit_handler(request, exc: RateLimitError):
    retry_after = 60
    if hasattr(exc, "response") and exc.response is not None:
        try:
            retry_after = int(exc.response.headers.get("retry-after", 60))
        except (ValueError, TypeError):
            pass
    return JSONResponse(
        status_code=429,
        content={
            "message": "Groq API rate limit reached. Please wait before retrying.",
            "retry_after": retry_after
        }
    )


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/generate")
async def api_generate(body: GenerateRequest):
    if not body.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    async def event_generator():
        try:
            async for event in run_research_pipeline_stream(body.topic):
                yield {
                    "event": event["event"],
                    "data": json.dumps(event["data"])
                }
        except RateLimitError as e:
            yield {
                "event": "error",
                "data": json.dumps({
                    "message": "Rate limit exceeded. Please try again later.",
                    "retry_after": 60
                })
            }
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"message": f"Pipeline error: {str(e)}"})
            }

    return EventSourceResponse(event_generator())


@app.post("/api/review")
async def api_review(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".docx", ".pdf"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only .docx and .pdf files are supported."
        )

    # Save uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        # Load content using pipeline helper
        report_text = load_report_from_file(tmp_path)
        if not report_text.strip():
            raise HTTPException(status_code=400, detail="The uploaded report appears to be empty.")

        # Review report in a thread pool to avoid blocking the event loop
        feedback = await asyncio.to_thread(review_user_report, report_text)
        return {"feedback": feedback}
    except RateLimitError as e:
        retry_after = 60
        if hasattr(e, "response") and e.response is not None:
            try:
                retry_after = int(e.response.headers.get("retry-after", 60))
            except Exception:
                pass
        return JSONResponse(
            status_code=429,
            content={
                "message": "Rate limit reached. Please try again later.",
                "retry_after": retry_after
            }
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process report: {str(e)}")
    finally:
        # Ensure temporary file cleanup
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/api/compare")
async def api_compare(file: UploadFile = File(...), topic: str = Form(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".docx", ".pdf"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only .docx and .pdf files are supported."
        )
    if not topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    # Save uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        user_report_text = load_report_from_file(tmp_path)
        if not user_report_text.strip():
            raise HTTPException(status_code=400, detail="The uploaded report appears to be empty.")
    except Exception as e:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    async def sse_compare_generator():
        try:
            # 1. Generate AI report first and stream its progress
            ai_report = ""
            async for event in run_research_pipeline_stream(topic):
                if event["event"] == "report":
                    ai_report = event["data"]["report"]
                    yield {
                        "event": "ai_report",
                        "data": json.dumps(event["data"])
                    }
                elif event["event"] == "error":
                    yield {
                        "event": "error",
                        "data": json.dumps(event["data"])
                    }
                    return
                else:
                    yield {
                        "event": event["event"],
                        "data": json.dumps(event["data"])
                    }

            if not ai_report:
                yield {
                    "event": "error",
                    "data": json.dumps({"message": "AI report generation failed."})
                }
                return

            # 2. Perform comparison step
            yield {
                "event": "step",
                "data": json.dumps({
                    "agent": "critic",
                    "status": "running",
                    "content": "Critic agent is comparing the generated AI report with your uploaded report..."
                })
            }

            comparison = await asyncio.to_thread(compare_reports, topic, ai_report, user_report_text)

            yield {
                "event": "comparison",
                "data": json.dumps({
                    "comparison": comparison,
                    "ai_report": ai_report
                })
            }
        except RateLimitError as e:
            yield {
                "event": "error",
                "data": json.dumps({
                    "message": "Groq rate limit reached.",
                    "retry_after": 60
                })
            }
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"message": f"Comparison pipeline error: {str(e)}"})
            }
        finally:
            # Ensure the temp file is deleted once streaming completes
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    return EventSourceResponse(sse_compare_generator())


@app.post("/api/download")
async def api_download(body: DownloadRequest):
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty.")

    try:
        # Generate DOCX in memory
        bio = save_as_docx_to_bytes(body.content)
        # Clean topic name for safe attachment header
        safe_topic = re.sub(r'[^\w\s-]', '', body.topic).strip().replace(' ', '_')[:50]
        filename = f"{safe_topic or 'mrla_report'}.docx"

        return StreamingResponse(
            bio,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate download: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
