server_endpoint log
-created AddPreset.js which will serve as backend server endpoint to insert into presets table
- tested functionality using node.js and dummy data on another project with identical table set up set up
-saw the data was inserted successfully into the dummy table.

- ran into RLS error when inserting into the actual table for testing purposes I turned off Row level security for the presets table

- will be updated along with database schema. 


still in progress:
- presets table schema modification. 
- function to edit existing table entries


note: clarity of presets table, and how it aligns with the JSON files provided by client.



docs used: 
https://supabase.com/docs/reference/javascript/insert 