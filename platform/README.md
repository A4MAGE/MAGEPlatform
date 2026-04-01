# Authentication & Engine - Jason Courtois

Implemented a login demo using authentication with supabase using Supabase Javascript SDK

Notes for production/development:
- For errors within AuthContext - do not leave data within console log, this is just for development purposes.
- Avoid using React Compiler! I had several issues with the order at which page reloads were called due to the compilers attempts at optimization. After disabling the react compiler these issues went away.
- Several errors are generated when calling engine.dispose(); with the MAGE engine. Brandon has been made aware of this issue and was working on a patch.

## Summary of how this code works
- supabaseClient.ts: establishes a connection to supabase via API keys that are safe to have on frontend applications. [Supabase API Key Docs](https://supabase.com/docs/guides/api/api-keys)

- AuthContext.tsx: Most important piece of code here, stores current login info on users browser so each page can display user content. [Supabase React Docs](https://supabase.com/docs/guides/auth/quickstarts/react) 

- App.tsx/Signin.tsx/Signup.tsx/Dashboard.tsx are all basic/incomplete pages to show the functionality of the auth system using the React Router to switch between pages.

- EnginePlayer.tsx - Loads the MAGE engine with the selected preset and CSS properties like width and height.

- Dashboard.tsx - Manages preset and audio state to be controlled with the MAGE engine and audio controller respectively.

### AuthContext.tsx
- This context provider keeps track of the users current login session information.
- The context provided is wrapped around this whole application, so in our final react app this would surround the whole site.
- Establishes a connection to our MAGE supabase instance using the public safe API keys
- There is also some gross looking typescript boilerplate for type definitions at the top
- Within AuthContext is 3 important main functions
  - signUpNewUser
  - signIn
  - signout
- These functions are all effectively wrappers for supabase SDK functions.
- There is also a critically important useEffect which keeps the session updated in the user's browser.
  - This useEffects sets up a callback function so that way if user signs in/out, it gets updated across the whole site.

### supabaseClient.ts
- uses env variables stored in .env.local in order to establish a connection to supabase
- These keys should not be pasted into .env directly, because we don't want them on github.
- Instead, they should be placed in a new file called .env.local that has the same template as .env

### PrivateRoute.tsx
- Wrapper component that protects pages from users who aren't logged in
- Checks to see if session is set to null, if it is, then it navigates back to websites home page

### Signin.tsx/Signup.tsx
- Both pages are all basic .tsx pages that have signin/signup functionality
- These pages all interact with AuthContext in order to get/modify the current user login state.

### Dashboard.tsx
- Manages the state of EnginePlayer and audio controller.
- This will allow the user to easily select audio tracks and different presets.

### EnginePlayer.tsx
- This component integrates the engine into a canvas which can be loaded on our engine player page.
- Right now it just loads one audio file, and pulls presets from the public folder in the repo.