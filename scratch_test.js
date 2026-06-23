import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://hqtdiembzojagawrhuze.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxdGRpZW1iem9qYWdhd3JodXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4ODQ5MjAsImV4cCI6MjA5NzQ2MDkyMH0.AEett3sP_Reics4KlrsxlvRLX8Kn3Tk-MPJVSjYzXsE');

async function run() {
  const res = await supabase.from('orders').insert({
    table_id: null,
    status: 'New',
    source: 'Takeaway',
    notes: 'test',
    amount: 100
  }).select().single();
  
  console.log(JSON.stringify(res, null, 2));
}

run();
