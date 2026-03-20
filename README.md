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

Finished: 
- Sign up page and onboarding (+associated routing) 
- Created dashboard 
- Created initial navbar 
- Login and authentication (through supabase)  
- Created images and users database 
- Created images and profile pic images storage 
- Created upload page 
- Created profile page 
- Created profile info + edit profile pic button 
- Created initial images grid 
- updated upload page.  
- added functionality to delete old profiile pics if replaced 
- added functionality where users also deletes row if user deletes account (a.k.a. row is deleted from supabase auth users table)

TODO: 
- refine the upload page
-  AI model 
- UI / page design 
- handle database user deletes 
- middleware for route protection
- organizing folders a bit more (common libraries, organizing api endpoints, etc.)
- edge case: show no posts if user has no posts 
- verify JWTs in api endpoints 
- server side auth validation 

DATABASE WORK: 
- prevent data duplication 
- handle row deletion (if user is deleted from supabase auth users table, we need to delete it from our own users table as well) 
- if profile picture of a certain user edits it (replaces the old one), delete old one from s3 storage 

FRONTEND DESIGN WORK: 
- continue designing dashboard 

BACKEND WORK: 
- 
- brainstorm AI model and how to implement 

follows table:
- PK is composite key (follower, follows)


** setting cascade on users table so that when user row is deleted from supabase auth users table, its also deleted from OUR users table 
ALTER TABLE users
ADD CONSTRAINT users_user_id_fkey                                                                                                          
FOREIGN KEY (user_id) REFERENCES auth.users(id)                                                                                            
ON DELETE CASCADE; 

** creating follows table, composite pk with follower_id + following_id, fk relation with follower_id, as well as adding cascade 
CREATE TABLE follows (
      follower_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
      following_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (follower_id, following_id)
  );



