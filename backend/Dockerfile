# Use lightweight official Python base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies with caching disabled
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source files
COPY . .

# Expose port 8000
EXPOSE 8000

# Default CMD to run Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
