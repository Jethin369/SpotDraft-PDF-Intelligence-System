from supabase import create_client, Client

from config import (
    SUPABASE_URL,
    SUPABASE_KEY,
    SUPABASE_SECRET_KEY,
)

# Normal client
# Use this for normal auth/user operations.
supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)

# Admin/server client
# Use this only inside the FastAPI backend for trusted operations
# such as Storage uploads and server-side database writes.
supabase_admin: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)