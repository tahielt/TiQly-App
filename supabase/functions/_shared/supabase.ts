import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { jsonResponse } from "./http.ts";

const getEnv = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error("Supabase env missing");
  }

  return { supabaseUrl, anonKey, serviceRoleKey };
};

export const createServiceClient = () => {
  const { supabaseUrl, serviceRoleKey } = getEnv();
  return createClient(supabaseUrl, serviceRoleKey);
};

export const createUserClient = (authHeader: string) => {
  const { supabaseUrl, anonKey } = getEnv();
  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
};

export const requireUser = async (req: Request): Promise<{ user: User; serviceClient: SupabaseClient }> => {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) {
    throw jsonResponse({ error: "Unauthorized" }, 401);
  }

  const userClient = createUserClient(authHeader);
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) {
    throw jsonResponse({ error: "Invalid user session" }, 401);
  }

  return {
    user: data.user,
    serviceClient: createServiceClient(),
  };
};
