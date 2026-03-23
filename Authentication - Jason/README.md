# Authentication - Jason Courtois

Implemented a login demo using authentication with supabase using Supabase Javascript SDK

Notes for production/development:
- For errors within AuthContext - do not leave data within console log, this is just for development purposes.
- Low rate limit - New user signup has a rate limit of 2 emails per hour. Even for a low use application this might be too low.
  - Workaround - Adapt google SSO later on which has a higher limit of 30 sign ups per hour [Rate Limit Docs](https://supabase.com/docs/guides/auth/rate-limits)
- Avoid using React Compiler! I had several issues with the order at which page reloads were called due to the compilers attempts at optimization. After disabling the react compiler these issues went away.

## Summary of how this code works
- supabaseClient.ts: establishes a connection to supabase via API keys that are safe to have on frontend applications. [Supabase API Key Docs](https://supabase.com/docs/guides/api/api-keys)

- AuthContext.tsx: Most important piece of code here, stores current login info on users browser so each page can display user content. [Supabase React Docs](https://supabase.com/docs/guides/auth/quickstarts/react) 

- App.tsx/Signin.tsx/Signup.tsx/Dashboard.tsx are all basic/incomplete pages to show the functionality of the auth system using the React Router to switch between pages.

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

### Signin/Signup/Dashboard
- These pages are all basic .tsx pages that have signin/signup functionality
- These pages all interact with AuthContext in order to get/modify the current user login state.