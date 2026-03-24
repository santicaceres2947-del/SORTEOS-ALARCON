const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://qkwucupyywwacmhumpal.supabase.co"
const supabaseKey = "sb_publishable_qXGwkDj9-MliRjwFrTdfPA_ztzOfa75"

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase