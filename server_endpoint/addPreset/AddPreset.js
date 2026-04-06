import { supabase } from '../Lib/supabaseClient.js';


//edit params to be JSON preset file for now this is just for a test
async function AddPreset() {
  //Supabase API insert logic
    const { data, error } = await supabase
      .from('preset')
      .insert([
        { 
          name: 'Amanda', 
          tag: 12,
          audiosource: 'testing server endpoint'
        }
      ])
      .select();

    if (error) {
      console.error('Error inserting data:', error.message); 
    } else {
      console.log('Success! Saved:', data);
    }

};

AddPreset();