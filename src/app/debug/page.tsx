
import { createClient } from "@/lib/supabase/server";

export default async function DebugPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <pre>No user logged in</pre>;
  }

  // 1. Check raw profile query without .single()
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id);

  // 2. Check profile by email just in case
  const { data: profilesByEmail, error: emailError } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", user.email || 'no-email');

  return (
    <div className="p-8 font-mono text-sm space-y-4">
      <h1 className="text-xl font-bold">Debug Info</h1>
      
      <div className="bg-slate-100 p-4 rounded">
        <h2 className="font-bold">Auth User</h2>
        <pre>{JSON.stringify({ id: user.id, email: user.email }, null, 2)}</pre>
      </div>

      <div className="bg-slate-100 p-4 rounded">
        <h2 className="font-bold">Profiles Query (by ID)</h2>
        <p>Results: {profiles?.length}</p>
        <pre>{JSON.stringify(profiles, null, 2)}</pre>
        {profileError && <pre className="text-red-500">Error: {JSON.stringify(profileError, null, 2)}</pre>}
      </div>

      <div className="bg-slate-100 p-4 rounded">
        <h2 className="font-bold">Profiles Query (by Email)</h2>
           <p>Results: {profilesByEmail?.length}</p>
        <pre>{JSON.stringify(profilesByEmail, null, 2)}</pre>
        {emailError && <pre className="text-red-500">Error: {JSON.stringify(emailError, null, 2)}</pre>}
      </div>
    </div>
  );
}
