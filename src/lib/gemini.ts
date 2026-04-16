import { GoogleGenAI } from "@google/genai";

function getGeminiApiKey(): string {
  // Vite only exposes variables prefixed with `VITE_` to browser code.
  const viteKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
  // Fallback for non-browser contexts (tests / server-side scripts).
  const nodeKey =
    typeof process !== "undefined"
      ? (process as any)?.env?.GEMINI_API_KEY ?? (process as any)?.env?.VITE_GEMINI_API_KEY
      : undefined;
  return String(viteKey ?? nodeKey ?? "").trim();
}

function createGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Missing Gemini API key. Set `VITE_GEMINI_API_KEY` in your environment (.env).");
  }
  return new GoogleGenAI({ apiKey });
}

export interface InvitationData {
  visa_type: string;
  inviter_name: string;
  inviter_dob: string;
  inviter_status: string;
  inviter_id: string;
  inviter_address: string;
  inviter_phone: string;
  inviter_email: string;
  inviter_occupation: string;
  inviter_company?: string;
  inviter_income: string;
  inviter_college?: string;
  inviter_start_date?: string;
  applicant_name: string;
  applicant_dob: string;
  applicant_passport: string;
  applicant_address: string;
  applicant_occupation: string;
  applicant_income: string;
  applicant2_name?: string;
  applicant2_dob?: string;
  applicant2_passport?: string;
  applicant2_address?: string;
  applicant2_occupation?: string;
  applicant2_income?: string;
  relationship: string;
  num_applicants: number;
  purpose: string;
  start_date: string;
  end_date: string;
  duration: string;
  stay_address: string;
  financial_support: string;
  ties_home: string;
  family_size: string;
  inviter_family_details?: string;
  applicant_travel_history?: string;
  applicant_assets?: string;
  inviter_documents: string[];
  applicant_documents: string[];
  applicant2_documents: string[];
  father_details?: string;
  mother_business_details?: string;
  net_worth?: string;
  company_address?: string;
  home_country_family?: string;
  additional_info?: string;
  letter_date: string;
  supporting_documents: string[];
}

export async function extractInfoFromDocuments(files: { data: string, mimeType: string }[]) {
  const prompt = `
    Analyze the attached documents (Passports, Study Permits, PR Cards, etc.) and extract as much information as possible to fill out a Canadian Invitation Letter form.
    
    Return the data in JSON format matching these keys:
    - inviter_name
    - inviter_dob (YYYY-MM-DD)
    - inviter_status (One of: PR Card, Work Permit, Study Permit, Canadian Citizen)
    - inviter_id (UCI or Document #)
    - inviter_address
    - inviter_occupation (Job title or Student)
    - inviter_company (Company name if working)
    - inviter_college (College/University name if student)
    - inviter_start_date (Start date of employment or study - YYYY-MM-DD)
    - inviter_income (Annual income if found)
    - company_address (Address of the inviter's employer)
    - applicant_name
    - applicant_dob (YYYY-MM-DD)
    - applicant_passport
    - applicant_address
    - applicant_occupation
    - applicant_income (Annual income if found)
    - net_worth (Total net worth of the applicant in CAD or local currency)
    - applicant2_name
    - applicant2_dob (YYYY-MM-DD)
    - applicant2_passport
    - applicant2_address
    - applicant2_occupation
    - applicant2_income (Annual income if found)
    - relationship
    
    If a field is not found, leave it as an empty string.
  `;

  try {
    const ai = createGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: prompt },
          ...files.map(f => ({ inlineData: { data: f.data, mimeType: f.mimeType } }))
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text =
      typeof (response as any)?.text === "function"
        ? await (response as any).text()
        : (response as any)?.text;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error extracting info:", error);
    return {};
  }
}

export async function generateInvitationLetter(data: InvitationData) {
  const prompt = `
    You are a professional Canadian immigration document writer. Your expertise is in drafting high-quality invitation letters for Visitor Visa and Super Visa applications submitted to Immigration, Refugees and Citizenship Canada (IRCC).

    Your goal is to generate a strong, formal, and visa-approval-focused invitation letter following the EXACT structure and format of the provided sample.

    INPUT DATA:
    Visa Type: ${data.visa_type}
    
    INVITER DETAILS:
    Full Name: ${data.inviter_name}
    Date of Birth: ${data.inviter_dob}
    Status in Canada: ${data.inviter_status}
    UCI/PR Number: ${data.inviter_id}
    Address: ${data.inviter_address}
    Phone: ${data.inviter_phone}
    Email: ${data.inviter_email}
    Occupation/College: ${data.inviter_occupation} ${data.inviter_company ? `at ${data.inviter_company}` : ''} ${data.inviter_college ? `at ${data.inviter_college}` : ''}
    Annual Income: ${data.inviter_income}
    Family Size: ${data.family_size}
    Start Date in Canada: ${data.inviter_start_date || 'N/A'}

    APPLICANT 1 DETAILS:
    Full Name: ${data.applicant_name}
    Date of Birth: ${data.applicant_dob}
    Passport Number: ${data.applicant_passport}
    Address: ${data.applicant_address}
    Occupation: ${data.applicant_occupation}
    Annual Income: ${data.applicant_income}
    
    ${data.num_applicants > 1 ? `
    APPLICANT 2 DETAILS:
    Full Name: ${data.applicant2_name}
    Date of Birth: ${data.applicant2_dob}
    Passport Number: ${data.applicant2_passport}
    Address: ${data.applicant2_address}
    Occupation: ${data.applicant2_occupation}
    Annual Income: ${data.applicant2_income}
    ` : ''}

    Relationship to Inviter: ${data.relationship}
    Additional Information: ${data.additional_info || 'N/A'}

    VISIT DETAILS:
    Purpose of Visit: ${data.purpose}
    Travel Dates: ${data.start_date} to ${data.end_date}
    Duration: ${data.duration}
    Stay Address in Canada: ${data.stay_address}

    FINANCIAL & TIES:
    Financial Support: ${data.financial_support}
    Inviter Family in Canada: ${data.inviter_family_details || 'N/A'}
    Applicant 1 Assets & Property: ${data.applicant_assets || 'N/A'}
    Applicant 1 Travel History: ${data.applicant_travel_history || 'N/A'}
    Ties to Home Country: ${data.ties_home}
    Father's Details: ${data.father_details || 'N/A'}
    Mother's Business Details: ${data.mother_business_details || 'N/A'}

    DOCUMENTS:
    Inviter Documents: ${data.inviter_documents.join(", ")}
    Applicant 1 Documents: ${data.applicant_documents.join(", ")}
    ${data.num_applicants > 1 ? `Applicant 2 Documents: ${data.applicant2_documents.join(", ")}` : ''}
    Supporting Documents: ${data.supporting_documents.join(", ")}

    STRICT FORMATTING INSTRUCTIONS (FOLLOW EXACTLY):
    1. Title: "# LETTER OF INVITATION AND FINANCIAL SUPPORT for the ${data.visa_type} application of ${data.applicant_name}" (Use # for the title)
    2. Date: "Date: ${new Date(data.letter_date).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}"
    3. Recipient: "To:\nThe Canada Embassy\nImmigration section"
    4. Salutation: "Dear Visa Officer,"
    5. Opening Paragraph (SPONSOR INTRODUCTION): Write a single, strong, and impactful paragraph introducing the inviter, ${data.inviter_name}. Clearly state their status in Canada (${data.inviter_status}), their passport number (${data.inviter_id}), and their current residence at ${data.inviter_address}. Emphasize their professional standing and their strong foundation in Canada.
    6. Second Paragraph (APPLICANT & PURPOSE): Write a single, strong paragraph introducing the applicant, ${data.applicant_name}, and explaining exactly why they are being invited (Purpose: ${data.purpose}). Emphasize the emotional bond and the importance of this visit for both the inviter and the applicant.
    7. Table 1 (APPLICANT TABLE - 5 COLUMNS, SINGLE ROW): Immediately after the second paragraph, insert this table:
       | Name | Date of Birth | Passport No | Relationship/Status | Address |
       | :--- | :--- | :--- | :--- | :--- |
       | ${data.applicant_name} | ${data.applicant_dob} | ${data.applicant_passport} | ${data.relationship} | ${data.applicant_address} |
       ${data.num_applicants > 1 ? `| ${data.applicant2_name} | ${data.applicant2_dob} | ${data.applicant2_passport} | ${data.relationship} | ${data.applicant2_address} |` : ''}
    8. Sponsor Professional/Educational Info: Immediately after Table 1, provide information about the sponsor's current occupation or studies. If the sponsor is working, detail their role as a ${data.inviter_occupation} at ${data.inviter_company || 'N/A'}, located at ${data.company_address || 'N/A'}, with an annual income of CAD ${data.inviter_income}. ${data.visa_type === "Super Visa" ? `Explicitly state that this income meets the Low Income Cut-Off (LICO) requirement for a family size of ${data.family_size}.` : ''} If the sponsor is a student, detail their studies at ${data.inviter_college || 'N/A'}. Emphasize their financial capability to support the visit.
    9. Ties to Home Country: Detail the applicant's family ties in their home country (e.g., ${data.home_country_family || 'other children and grandchildren'}), social, and financial ties. Mention they live in close proximity to family and play an active role in their lives.
    10. Property/Residence: Mention the applicant is a long-standing resident of their own home in their home city, which they independently own and manage. Emphasize their deep attachment to their home country and local neighborhood.
    11. Visit Details: "My ${data.relationship} is planning to visit Canada on a ${data.visa_type} and stay for approximately ${data.duration}, tentatively from ${data.start_date} to ${data.end_date}. During her stay, she will reside with me at our home located at ${data.inviter_address}. My ${data.relationship} is a citizen of [Home Country] and currently resides at ${data.applicant_address}."
    12. Net Worth: "To support this, we have attached a Chartered Accountant's Net Worth Certificate showing a net worth equivalent to CAD ${data.net_worth || 'N/A'}, along with family photographs and documentation that reflect her continued involvement in her community and family life in [Home Country]."
    13. Additional Information Section: If provided, add a section titled "### Additional Information" followed by the details: ${data.additional_info || ''}
    14. Supporting Documents: "### Supporting Documents Attached" (Use ### for this heading)
        Followed by a bulleted list of all documents provided.
    15. Legal Undertaking: "I, at this moment, undertake the complete legal responsibility of my ${data.relationship} during her stay in Canada. During her visit here in Canada, she will be staying with me at our residence, and i will take care of food, accommodation, health insurance and other local expenses in Canada and will book the flight tickets."
    16. Funds: "I hold sufficient funds to support her living expenses in Canada and am fully prepared to sign any further undertakings that may be required by the Government of Canada."
    17. Financial Commitment: "This letter should be considered a signed declaration of my financial commitment to my ${data.relationship} for her entire duration of stay under the ${data.visa_type} program."
    18. Return Intention: "I further undertake that my ${data.relationship} will not remain in Canada beyond the period allowed for their ${data.visa_type} entitled to stay and that she will return to [Home Country] before the expiry of the visa grant period as stated by the conditions of her ${data.visa_type}."
    19. Medical: "Please note that an upfront medical examination has not been submitted with this application. However, my ${data.relationship} is fully prepared to undergo the required medical examination upon receiving instructions or a formal request from IRCC."
    20. Table 2 (INVITER TABLE - 5 COLUMNS, SINGLE ROW): "Personal details of self (inviter), are given below:"
       Use a 5-column markdown table:
       | Name | Date of Birth | Status in Canada | Relationship | Residence |
       | :--- | :--- | :--- | :--- | :--- |
       | ${data.inviter_name} | ${data.inviter_dob} | ${data.inviter_status} | ${data.relationship} | ${data.inviter_address} |
    21. Supporting Documents Section: "### Supporting Documents Attached" (Use ### for this heading)
        Followed by a bulleted list of all documents provided from the Supporting Documents list: ${data.supporting_documents.join(", ")}.
    22. Closing: "Please do not hesitate to contact me at ${data.inviter_phone}/${data.inviter_email} should you require further information."
    23. Signature Block: "Sincerely,\n\n${data.inviter_name}"
    24. Notary Section: "### SIGNED BEFORE ME" (Use ### for this heading)
        Followed by: "Date: ____________________\n\nNotary Public Stamp: ____________________"

    WRITING STYLE:
    - Professional, formal, and deeply emotional where appropriate.
    - MANDATORY: USE THE EXACT TEXT PROVIDED BELOW FOR EACH SECTION (11, 12, 15, 16, 17, 18, 19, 21). DO NOT add, remove, or change any words in these specific paragraphs.
    - Use the exact phrasing from the screenshots for the legal undertakings.
    - DO NOT use placeholders like [Name]. Use the provided data.
    - DO NOT use HTML tags.
    - ONLY use markdown for Tables (using | and -) and Headings (using # and ###).
    - DO NOT use markdown for bold (**), italics (*), or underlines.
    - Ensure the tone is respectful and demonstrates high credibility.

    SPECIFIC STRENGTHENING INSTRUCTIONS:
    - Emphasize the inviter's successful integration and financial contribution to Canada.
    - Detail the applicant's established life in their home country (career, assets, family) to prove they are a genuine visitor.
    - Clearly link the financial documents to the ability to cover all trip expenses without recourse to public funds.
    - If specific bank balances or asset values are provided in the summaries, weave them naturally into the narrative.

    CONDITIONAL LOGIC:
    - If Visa Type is "Super Visa":
        - Add statement confirming inviter meets LICO income requirements for a family of ${data.family_size}.
        - Mention full financial support by inviter.
        - Include medical insurance coverage for at least one year.
        - Emphasize long-term visit eligibility.
  `;

  try {
    const ai = createGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });

    const letterText =
      typeof (response as any)?.text === "function"
        ? await (response as any).text()
        : (response as any)?.text;
    return letterText;
  } catch (error) {
    console.error("Error generating letter:", error);
    throw error;
  }
}
