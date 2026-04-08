const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log("No config");
  process.exit(1);
}
const supabase = createClient(url, key);
supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: 'richardgms001@gmail.com'
}).then(({data, error}) => {
  if (error) console.error(error);
  else {
    fs.writeFileSync('scripts/link.txt', data.properties.action_link);
    console.log("Written successfully.");
  }
});
