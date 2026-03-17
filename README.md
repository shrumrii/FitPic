# FitPic

FitPic is an application dedicated to analyzing and improving your style, and helping you get out of your comfort zone, showing your wardrobe to others. 

FitPic contains a place where you can upload images, and FitPic's AI agent will analyze your style for you as well as giving you fashion tips. 

You can also share pictures with others. 

Frontend in NextJS. 
Backend in Python FastAPI. 

Database for images: Supabase Storage 

## Database Schema 

users Table: 

images Table: 


## Commands 

Activate venv for backend: source venv/bin/activate
Run backend fastAPI: fastapi dev 
Run frontend Next.JS: npm run dev 
Identify and kill port: kill -9 $(lsof -t -i :8000)

TODO:
- 
- refine the upload page
-  Set up user login and authentication system 
-  AI model 
- UI / page design 
- API design 
- handle database user deletes 
- middleware for route protection

DATABASE WORK: 
- prevent data duplication 
- handle row deletion (if user is deleted from supabase auth users table, we need to delete it from our own users table as well) 
- if profile picture of a certain user edits it (replaces the old one), delete old one from s3 storage 

FRONTEND DESIGN WORK: 
- continue designing dashboard 
- add profile picture to navbar 
- dropdown from profile 

BACKEND WORK: 
- 
- brainstorm AI model and how to implement 





