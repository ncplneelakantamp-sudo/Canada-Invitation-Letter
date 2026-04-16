import { generateInvitationLetter, type InvitationData } from "../src/lib/gemini.js";

// Ensure this runs in the Node.js runtime (Edge runtime doesn't support @google/genai properly).
export const runtime = "nodejs";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const data = req.body as InvitationData;
    const letter = await generateInvitationLetter(data);
    return res.status(200).json({ letter });
  } catch (error) {
    console.error("Vercel API error generating letter:", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to generate the letter right now.";
    return res.status(500).json({ error: message });
  }
}
