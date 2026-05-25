import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { supabaseServer } from "@/lib/supabase";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "idToken required" }, { status: 400 });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const email = payload.email;
    const name = payload.name || "";

    // Upsert user in Supabase
    const sb = supabaseServer();
    const { data: existingUser } = await sb
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    let userId: string;
    let isNewUser = false;
    if (existingUser?.id) {
      userId = existingUser.id;
    } else {
      isNewUser = true;
      const { data: newUser, error } = await sb
        .from("users")
        .insert({ email, name, created_at: new Date().toISOString() })
        .select("id")
        .single();
      if (error || !newUser?.id) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
      userId = newUser.id;
    }

    return NextResponse.json({
      userId,
      email,
      name,
      walletCreated: false,
      isNewUser,
    });
  } catch (err: any) {
    console.error("[Google Auth] Error:", err);
    return NextResponse.json(
      { error: err.message || "Auth failed" },
      { status: 500 }
    );
  }
}
