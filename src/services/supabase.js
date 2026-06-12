import { createClient } from '@supabase/supabase-js'
import { DEMO_MODE } from '../utils/constants'

export const supabaseUrl = 'https://ibameynehrwshrtlabjv.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliYW1leW5laHJ3c2hydGxhYmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MzkyMDEsImV4cCI6MjA1NjQxNTIwMX0.O7Fdae28PqIb0bHreuaumL3tCzVRIHJJq3I-fLQ5QdY'

const supabase = DEMO_MODE ? null : createClient(supabaseUrl, supabaseKey)

export default supabase
