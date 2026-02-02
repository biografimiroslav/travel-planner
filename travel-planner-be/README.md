# Travel Planner Backend

A FastAPI-based backend for managing travel projects and places using the Art Institute of Chicago API.

## Features

- CRUD operations for travel projects
- CRUD operations for places within projects
- Validation against Art Institute of Chicago API
- SQLite database
- CORS enabled for frontend integration

## Setup

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`.

## API Endpoints

### Projects

- `GET /projects/` - List all projects
- `GET /projects/{project_id}` - Get a single project
- `POST /projects/` - Create a new project
- `PUT /projects/{project_id}` - Update a project
- `DELETE /projects/{project_id}` - Delete a project (only if no places are visited)

### Places

- `GET /projects/{project_id}/places/` - List places in a project
- `GET /projects/{project_id}/places/{place_id}` - Get a single place
- `POST /projects/{project_id}/places/` - Add a place to a project
- `PUT /projects/{project_id}/places/{place_id}` - Update place notes
- `PATCH /places/{place_id}/visit` - Mark a place as visited

## Validation Rules

- Maximum 10 places per project
- Places must exist in Art Institute of Chicago API
- Cannot add duplicate external IDs to the same project
- Cannot delete projects with visited places
- Project completes when all places are visited
