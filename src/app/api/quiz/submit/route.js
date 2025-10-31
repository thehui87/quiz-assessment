import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req) {
  try {
    const { quizId, answers } = await req.json();

    if (!quizId || !answers || typeof answers !== "object") {
      return Response.json(
        { message: "Invalid payload: quizId and answers are required." },
        { status: 400 }
      );
    }

    // Try to resolve user from Authorization header (Bearer <token>)
    let userId = null;
    try {
      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

      if (token) {
        const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
        if (!userErr && userData?.user) userId = userData.user.id;
      }
    } catch (e) {
      console.warn("Auth check failed (continuing as anonymous)", e?.message);
    }

    // Load questions
    const { data: questionsData, error: qErr } = await supabaseAdmin
      .from("Question")
      .select("id, type, options:AnswerOption(id, text, is_correct, created_at)")
      .eq("quiz_id", quizId)
      .order("created_at", { foreignTable: "AnswerOption", ascending: true })
      .order("created_at", { ascending: true });

    if (qErr) {
      console.error("Failed to load questions:", qErr.message);
      return Response.json({ message: "Failed to load quiz." }, { status: 500 });
    }

    if (!questionsData || questionsData.length === 0) {
      return Response.json({ message: "Quiz not found or has no questions." }, { status: 404 });
    }

    // Score computation
    let score = 0;
    const detail = {};

    for (const q of questionsData) {
      const qid = q.id;
      const qtype = q.type;
      const opts = (q.options || []).map(o => ({
        id: o.id,
        text: o.text,
        is_correct: o.is_correct,
      }));
      const submitted = answers[qid];

      detail[qid] = { correct: false };

      if (qtype === "single_choice" || qtype === "true_false") {
        if (submitted === null || submitted === undefined) continue;

        let chosenOption = null;
        if (typeof submitted === "number") {
          chosenOption = opts[submitted] ?? null;
        } else if (typeof submitted === "string") {
          chosenOption = opts.find(o => o.id === submitted) ?? null;
        }

        if (chosenOption && chosenOption.is_correct) {
          score += 1;
          detail[qid].correct = true;
        }
      } else if (qtype === "text") {
        if (!submitted || typeof submitted !== "string") continue;

        const expected = (opts[0]?.text || "").trim().toLowerCase();
        const given = submitted.trim().toLowerCase();

        if (expected && given && expected === given) {
          score += 1;
          detail[qid].correct = true;
        }
      } else {
        detail[qid].reason = "unsupported question type";
      }
    }

    const total = questionsData.length;

    // Persist attempt (non-fatal)
    try {
      await supabaseAdmin
        .from("QuizAttempt")
        .insert([{ quiz_id: quizId, user_id: userId, answers, score, total }]);
    } catch (persistErr) {
      console.warn("Failed to persist attempt:", persistErr?.message);
    }

    return Response.json({ score, total, detail }, { status: 200 });
  } catch (err) {
    console.error("Quiz submission error:", err);
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
