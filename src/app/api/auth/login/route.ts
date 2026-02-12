/**
 * FIX-20260212-03
 * API Route para login - Reemplaza server action que fallaba
 * con error de JSON parse en Vercel
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: "Email y contraseña son requeridos" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[API/auth/login] Error:", err);
        return NextResponse.json(
            { success: false, error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
