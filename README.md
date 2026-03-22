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
- created friends table 
- created friends page and search for user endpoint 
- created get following endpoint 
- created feed endpoint 
- create feed modals 
- show "following" if already followed in friend search 
- created userContext


TODO: 
-  AI model 
- UI / page design 
- middleware for route protection
- organizing folders a bit more (common libraries, organizing api endpoints, etc.)
- edge case: show no posts if user has no posts 
- verify JWTs in api endpoints 
- server side auth validation 
- real time notification for "friend request received" 
- optimize feed endpoint 
- add forgot password 
- addd error handle for every post method in backend where a duplicate is a concern (follows) 
- Remove picture option 
- add modal for the profile page too 
- create sidebar
- clean up code 
- turn image grid and modal into components 
- create friends page. follow button can turn into modal as well 
- use react shared context for sidebar/navbar/page
- refactor pages with user context 

DATABASE WORK: 
- prevent data duplication 

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



