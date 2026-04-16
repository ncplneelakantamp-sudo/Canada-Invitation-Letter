# Canada Visa Invitation Letter Generator - Project Flow

This document outlines the step-by-step flow and architecture of the Canada Visa Invitation Letter Generator application.

## 1. Application Overview
The application is a multi-step form designed to collect all necessary information for a Canadian Invitation Letter (Visitor Visa or Super Visa) and use AI to generate a professional, formal document that meets IRCC standards.

## 2. User Journey (Step-by-Step)

### Step 1: Visa Type Selection
*   **Input**: User selects either "Visitor Visa" or "Super Visa".
*   **Logic**: Selecting "Super Visa" triggers specific LICO (Low Income Cut-Off) calculations and additional requirements in the AI prompt (e.g., medical insurance).

### Step 2: Inviter Details
*   **Input**: Full Name, Date of Birth, Status in Canada (Dropdown: PR Card, Work Permit, Study Permit, Canadian Citizen), UCI/PR Number, Address, Phone, Email, Occupation, and Annual Income.
*   **Logic**: Captures the "Sponsor" information required by IRCC.

### Step 3: Applicant Details
*   **Input**: Number of applicants (1 or 2), Full Name, Date of Birth, Passport Number, Address, Occupation, and Annual Income for each applicant.
*   **Logic**: Dynamically shows/hides fields for a second applicant if selected.

### Step 4: Visit Details
*   **Input**: Purpose of Visit (e.g., family reunion, tourism), Travel Dates (Start/End), Duration of Stay, and Stay Address in Canada.
*   **Logic**: Provides the core narrative for the visit.

### Step 5: Support & Ties
*   **Input**: Financial Support details, Inviter's Family in Canada, Applicant's Travel History, Assets/Property, Net Worth, and Ties to Home Country.
*   **Logic**: These fields are critical for proving the "genuine visitor" requirement to visa officers.

### Step 6: Final Review & Supporting Documents
*   **Input**: 
    *   **Letter Date**: Defaults to today.
    *   **Supporting Documents**: A comprehensive checkbox list (Sponsor PR Card, Work Permit, Employment Docs, Applicant Passport, etc.).
*   **Logic**: The selected documents are compiled into a formal bulleted list at the end of the letter.

## 3. Letter Generation (AI Integration)
*   **Process**: Once the user clicks "Generate Letter", the application sends the entire `formData` object to a backend service.
*   **AI Model**: Uses Google's Gemini API (`gemini-3.1-pro-preview`) with a highly structured prompt.
*   **Prompt Engineering**: The prompt enforces strict IRCC formatting, legal undertakings, and a professional tone. It ensures specific paragraphs (like financial commitments and return intentions) use exact, proven phrasing.

## 4. Preview & Export
*   **Preview**: The generated letter is displayed in a serif-font scrollable area for review.
*   **Editing**: Users can update details or select different supporting documents and "Regenerate" the letter immediately.
*   **Export Options**:
    *   **Copy**: Copies the raw text to the clipboard.
    *   **Download .docx**: Uses the `docx` library to generate a professionally formatted Microsoft Word document with tables and proper spacing.

## 5. Technical Stack
*   **Frontend**: React (Vite), TypeScript, Tailwind CSS.
*   **UI Components**: shadcn/ui (Radix UI).
*   **Animations**: Framer Motion (motion/react).
*   **AI**: Google Gemini API.
*   **Document Export**: `docx` and `file-saver`.
*   **Notifications**: Sonner (toast).

## 6. Key Features
*   **LICO Calculation**: Automatically calculates the required income for Super Visa based on family size (2026 standards).
*   **Real-time Validation**: Ensures mandatory fields are considered during the generation process.
*   **Responsive Design**: Fully functional on mobile and desktop devices.
