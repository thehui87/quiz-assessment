import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { quizId, answers } = req.body || {};

    // Basic validation
    if (!quizId || !answers || typeof answers !== "object") {
      return res.status(400).json({ message: "Invalid payload: quizId and answers are required." });
    }

    // Optional: try to resolve a user from an Authorization header (Bearer <token>)
    let userId = null;
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
      if (token) {
        const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
        if (!userErr && userData?.user) userId = userData.user.id;
      }
    } catch (e) {
      // Non-fatal: authentication failed, continue as anonymous
      console.warn("Auth check failed for submission (continuing as anonymous)", e?.message || e);
    }

    // Fetch canonical questions and correct answers from the DB using the admin client
    const { data: questionsData, error: qErr } = await supabaseAdmin
      .from("Question")
      .select("id, type, options:AnswerOption(id, text, is_correct, created_at)")
      .eq("quiz_id", quizId)
      .order("created_at", { foreignTable: "AnswerOption", ascending: true })
      .order("created_at", { ascending: true });

    if (qErr) {
      console.error("Failed to load questions for grading:", qErr.message || qErr);
      return res.status(500).json({ message: "Failed to load quiz for grading." });
    }

    if (!questionsData || questionsData.length === 0) {
      return res.status(404).json({ message: "Quiz not found or has no questions." });
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

      // Default: incorrect
      detail[qid] = { correct: false };

      if (qtype === "single_choice" || qtype === "true_false") {
        // Expect a numeric index from client (0-based) or an option id string
        if (submitted === null || submitted === undefined) {
          detail[qid].reason = "no answer";
          continue;
        }

        let chosenOption = null;
        if (typeof submitted === "number") {
          chosenOption = opts[submitted] ?? null;
        } else if (typeof submitted === "string") {
          chosenOption = opts.find(o => o.id === submitted) ?? null;
        }

        if (chosenOption && chosenOption.is_correct) {
          score += 1;
          detail[qid].correct = true;
        } else {
          detail[qid].correct = false;
        }
      } else if (qtype === "text") {
        // Expect a string answer; compare normalized values
        if (!submitted || typeof submitted !== "string") {
          detail[qid].reason = "no answer";
          continue;
        }
        const expected = (opts[0]?.text || "").trim().toLowerCase();
        const given = submitted.trim().toLowerCase();
        if (expected && given && expected === given) {
          score += 1;
          detail[qid].correct = true;
        } else {
          detail[qid].correct = false;
        }
      } else {
        // Unknown type — skip
        detail[qid].reason = "unsupported question type";
      }
    }

    const total = questionsData.length;

    // Optional: persist attempt (best-effort — ignore failures)
    try {
      await supabaseAdmin.from("QuizAttempt").insert({
        quiz_id: quizId,
        user_id: userId,
        answers: answers,
        score,
        total,
      });
    } catch (persistErr) {
      // don't fail the request if saving attempt fails (table may not exist)
      console.warn(
        "Failed to persist quiz attempt (non-fatal):",
        persistErr?.message || persistErr
      );
    }

    return res.status(200).json({ score, total, detail });
  } catch (err) {
    console.error("Quiz submission error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
