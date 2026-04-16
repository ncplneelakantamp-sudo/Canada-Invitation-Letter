/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  User, 
  Users, 
  MapPin, 
  Wallet, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Download, 
  Copy, 
  Check,
  RefreshCw,
  Info,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import type { InvitationData } from "@/src/lib/gemini.js";
import { supabase } from "@/src/lib/supabase";

import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType,
  HeadingLevel,
  BorderStyle
} from "docx";
import { saveAs } from "file-saver";

const STEPS = [
  { id: "visa", title: "Visa Type", icon: FileText },
  { id: "inviter", title: "Inviter", icon: User },
  { id: "applicant", title: "Applicant", icon: Users },
  { id: "visit", title: "Visit", icon: MapPin },
  { id: "support", title: "Support & Ties", icon: Wallet },
  { id: "preview", title: "Preview", icon: FileText },
];

const LICO_2026: Record<number, number> = {
  1: 30526,
  2: 38003,
  3: 46720,
  4: 56723,
  5: 64335,
  6: 72559,
  7: 80783,
};

const SUPPORTING_DOCUMENTS = [
  "Sponsor PR Card",
  "Sponsor Work Permit",
  "Sponsor Study Permit",
  "Sponsor Canadian Citizen Document",
  "Sponsor Employment Documents",
  "Sponsor Address Proof",
  "Sponsor Passport",
  "Applicant Passport",
  "Applicant Employment Documents",
  "Applicant Financial Documents",
  "Applicant Medical Insurance",
  "Applicant Proof of Relationship Documents",
  "Applicant Networth Letter",
  "Applicant Bank Statements/Bank Letter"
];

const getLICO = (size: number) => {
  if (size <= 7) return LICO_2026[size] || 0;
  return LICO_2026[7] + (size - 7) * 8224;
};

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [formData, setFormData] = useState<InvitationData>({
    visa_type: "Visitor Visa",
    inviter_name: "",
    inviter_dob: "",
    inviter_status: "Canadian Citizen",
    inviter_id: "",
    inviter_address: "",
    inviter_phone: "",
    inviter_email: "",
    inviter_occupation: "",
    inviter_company: "",
    inviter_income: "",
    inviter_college: "",
    inviter_start_date: "",
    applicant_name: "",
    applicant_dob: "",
    applicant_passport: "",
    applicant_address: "",
    applicant_occupation: "",
    applicant_income: "",
    applicant2_name: "",
    applicant2_dob: "",
    applicant2_passport: "",
    applicant2_address: "",
    applicant2_occupation: "",
    applicant2_income: "",
    relationship: "",
    num_applicants: 1,
    purpose: "",
    start_date: "",
    end_date: "",
    duration: "",
    stay_address: "",
    financial_support: "",
    ties_home: "",
    family_size: "1",
    inviter_documents: [],
    applicant_documents: [],
    applicant2_documents: [],
    father_details: "",
    mother_business_details: "",
    inviter_family_details: "",
    applicant_travel_history: "",
    applicant_assets: "",
    net_worth: "",
    company_address: "",
    home_country_family: "",
    letter_date: new Date().toISOString().split('T')[0],
    supporting_documents: [],
  });

  const [newInviterDoc, setNewInviterDoc] = useState("");
  const [newApplicantDoc, setNewApplicantDoc] = useState("");
  const [newApplicant2Doc, setNewApplicant2Doc] = useState("");

  const updateFormData = (field: keyof InvitationData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSupportingDoc = (doc: string) => {
    const current = formData.supporting_documents;
    if (current.includes(doc)) {
      updateFormData("supporting_documents", current.filter(d => d !== doc));
    } else {
      updateFormData("supporting_documents", [...current, doc]);
    }
  };

  const licoRequirement = getLICO(parseInt(formData.family_size) || 1);
  const currentIncome = parseFloat(formData.inviter_income.replace(/,/g, "")) || 0;
  const isLICOValid = formData.visa_type === "Super Visa" ? currentIncome >= licoRequirement : true;

  const addInviterDoc = () => {
    if (newInviterDoc.trim()) {
      updateFormData("inviter_documents", [...formData.inviter_documents, newInviterDoc.trim()]);
      setNewInviterDoc("");
    }
  };

  const removeInviterDoc = (index: number) => {
    const newList = [...formData.inviter_documents];
    newList.splice(index, 1);
    updateFormData("inviter_documents", newList);
  };

  const addApplicantDoc = () => {
    if (newApplicantDoc.trim()) {
      updateFormData("applicant_documents", [...formData.applicant_documents, newApplicantDoc.trim()]);
      setNewApplicantDoc("");
    }
  };

  const removeApplicantDoc = (index: number) => {
    const newList = [...formData.applicant_documents];
    newList.splice(index, 1);
    updateFormData("applicant_documents", newList);
  };

  const addApplicant2Doc = () => {
    if (newApplicant2Doc.trim()) {
      updateFormData("applicant2_documents", [...formData.applicant2_documents, newApplicant2Doc.trim()]);
      setNewApplicant2Doc("");
    }
  };

  const removeApplicant2Doc = (index: number) => {
    const newList = [...formData.applicant2_documents];
    newList.splice(index, 1);
    updateFormData("applicant2_documents", newList);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const rawBody = await response.text();
      let payload: any = {};

      if (rawBody) {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          payload = { error: rawBody };
        }
      }

      if (!response.ok) {
        throw new Error(
          payload?.error || `Unable to generate the letter right now (HTTP ${response.status}).`
        );
      }

      const letter = payload?.letter as string | undefined;
      if (letter) {
        setGeneratedLetter(letter);
        
        // Save to Supabase
        if (supabase) {
          const { error } = await supabase
            .from('letters')
            .insert([
              {
                applicant_name: formData.applicant_name,
                visa_type: formData.visa_type,
                letter_content: letter,
                form_data: formData,
                inviter_name: formData.inviter_name
              }
            ]);
            
          if (error) {
            console.error("Supabase save error:", error);
          } else {
            toast.success("Letter saved to database!");
          }
        }
      }
      toast.success("Invitation letter generated successfully!");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to generate the letter right now.";
      toast.error(`Error generating letter: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedLetter) {
      navigator.clipboard.writeText(generatedLetter);
      setIsCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!generatedLetter) return;

    try {
      const lines = generatedLetter.split("\n");
      const docChildren: any[] = [];
      let isInTable = false;
      let currentTableRows: TableRow[] = [];

      lines.forEach((line) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.includes("|") && trimmedLine.split("|").length > 2) {
          // Skip separator lines like | :--- | :--- |
          if (trimmedLine.includes("---")) return;
          
          isInTable = true;
          const cells = trimmedLine.split("|").filter(c => c.trim() !== "" || (trimmedLine.startsWith("|") && trimmedLine.endsWith("|")));
          // If we split by | and it starts/ends with |, we might get empty strings at the ends.
          // Let's refine the cell extraction.
          const actualCells = trimmedLine.split("|").map(c => c.trim()).filter((c, i, arr) => {
            if (i === 0 && c === "") return false;
            if (i === arr.length - 1 && c === "") return false;
            return true;
          });

          if (actualCells.length > 0) {
            const isHeaderRow = currentTableRows.length === 0;
            currentTableRows.push(
              new TableRow({
                children: actualCells.map((cell, idx) => new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: cell, 
                      size: 24, 
                      font: "Calibri",
                      bold: isHeaderRow || (actualCells.length === 2 && idx === 0)
                    })] 
                  })],
                  width: { size: 100 / actualCells.length, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  }
                }))
              })
            );
          }
        } else {
          if (isInTable) {
            docChildren.push(
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: currentTableRows,
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
              })
            );
            docChildren.push(new Paragraph({ text: "" }));
            currentTableRows = [];
            isInTable = false;
          }

          if (trimmedLine === "") {
            docChildren.push(new Paragraph({ text: "" }));
          } else if (trimmedLine.startsWith("Date:")) {
            docChildren.push(
              new Paragraph({
                children: [new TextRun({ text: trimmedLine, size: 24, font: "Calibri" })],
                alignment: AlignmentType.RIGHT,
                spacing: { before: 120, after: 120 },
              })
            );
          } else if (trimmedLine.startsWith("#")) {
            const level = trimmedLine.match(/^#+/)?.[0].length || 1;
            docChildren.push(
              new Paragraph({
                children: [new TextRun({ text: trimmedLine.replace(/^#+\s*/, ""), size: 32, font: "Calibri", bold: true })],
                alignment: (trimmedLine.includes("Letter of Invitation") || trimmedLine.includes("LETTER OF INVITATION")) ? AlignmentType.CENTER : AlignmentType.LEFT,
                spacing: { before: 200, after: 200 },
              })
            );
          } else {
            docChildren.push(
              new Paragraph({
                children: [new TextRun({ text: trimmedLine, size: 24, font: "Calibri" })],
                spacing: { line: 360, before: 120, after: 120 },
              })
            );
          }
        }
      });

      if (isInTable && currentTableRows.length > 0) {
        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: currentTableRows,
          })
        );
      }

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: "Calibri",
                size: 24,
              },
            },
          },
        },
        sections: [
          {
            properties: {},
            children: docChildren,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Invitation_Letter_${formData.applicant_name.replace(/\s+/g, "_")}.docx`);
      toast.success("Word document generated!");
    } catch (error) {
      console.error("Error generating Word doc:", error);
      toast.error("Failed to generate Word document. Downloading as text instead.");
      
      const element = document.createElement("a");
      const file = new Blob([generatedLetter], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `Invitation_Letter_${formData.applicant_name.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(element);
      element.click();
    }
  };

  const resetForm = () => {
    setGeneratedLetter(null);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-neutral-900">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="border-b border-neutral-100 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-100">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Canada Visa Invitation Letter</h1>
            <p className="text-sm text-neutral-500">Professional letter generator for IRCC applications</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!generatedLetter ? (
          <div className="flex flex-col gap-8">
            {/* Custom Stepper */}
            <div className="mx-auto w-full max-w-4xl px-6">
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-neutral-200" />
                
                {STEPS.map((step, idx) => (
                  <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                    <div 
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                        idx === currentStep 
                          ? "border-red-600 bg-red-600 text-white shadow-lg shadow-red-100" 
                          : idx < currentStep
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-neutral-200 bg-white text-neutral-400"
                      }`}
                    >
                      {idx < currentStep ? <Check className="h-5 w-5" /> : <span className="text-sm font-bold">{idx + 1}</span>}
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                      idx === currentStep ? "text-red-600" : "text-neutral-400"
                    }`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-4xl">
              <Card className="overflow-hidden border-neutral-200 shadow-xl shadow-neutral-200/50">
                <CardContent className="p-8 sm:p-12">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentStep === 0 && (
                        <div className="space-y-10">
                          <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Select Visa Type</h2>
                            <p className="text-neutral-500">Choose the type of visa your guest is applying for.</p>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <button
                              onClick={() => updateFormData("visa_type", "Visitor Visa")}
                              className={`flex flex-col items-start gap-4 rounded-2xl border-2 p-6 text-left transition-all hover:border-red-200 ${
                                formData.visa_type === "Visitor Visa" 
                                  ? "border-red-600 bg-red-50/50 shadow-sm" 
                                  : "border-neutral-100 bg-white"
                              }`}
                            >
                              <div className={`rounded-xl p-3 ${formData.visa_type === "Visitor Visa" ? "bg-red-600 text-white" : "bg-neutral-100 text-neutral-500"}`}>
                                <FileText className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-bold text-neutral-900">Visitor Visa</h3>
                                <p className="text-sm text-neutral-500">Temporary Resident Visa for short-term visits</p>
                              </div>
                            </button>

                            <button
                              onClick={() => updateFormData("visa_type", "Super Visa")}
                              className={`flex flex-col items-start gap-4 rounded-2xl border-2 p-6 text-left transition-all hover:border-red-200 ${
                                formData.visa_type === "Super Visa" 
                                  ? "border-red-600 bg-red-50/50 shadow-sm" 
                                  : "border-neutral-100 bg-white"
                              }`}
                            >
                              <div className={`rounded-xl p-3 ${formData.visa_type === "Super Visa" ? "bg-red-600 text-white" : "bg-neutral-100 text-neutral-500"}`}>
                                <Users className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-bold text-neutral-900">Super Visa</h3>
                                <p className="text-sm text-neutral-500">Extended stay visa for parents and grandparents</p>
                              </div>
                            </button>
                          </div>

                          {formData.visa_type === "Super Visa" && (
                            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 space-y-4">
                              <div className="flex items-center gap-3 text-blue-900 font-bold">
                                <Info className="h-5 w-5" />
                                Super Visa Requirements
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor="family_size">Total Family Size (Inviter + Dependents + Guests)</Label>
                                  <Select 
                                    value={formData.family_size} 
                                    onValueChange={(v) => updateFormData("family_size", v)}
                                  >
                                    <SelectTrigger id="family_size" className="bg-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                        <SelectItem key={n} value={n.toString()}>{n} Persons</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>LICO Income Requirement (2026)</Label>
                                  <div className="flex h-10 items-center rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm font-bold text-neutral-900">
                                    ${licoRequirement.toLocaleString()} CAD
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-blue-700 italic">
                                Note: Your annual income must be at least ${licoRequirement.toLocaleString()} to qualify for a Super Visa.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {currentStep === 1 && (
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Inviter Details</h2>
                            <p className="text-neutral-500">Provide information about the person inviting the guest to Canada.</p>
                          </div>

                          <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="inviter_name">Full Name</Label>
                              <Input 
                                id="inviter_name" 
                                placeholder="As shown on ID" 
                                value={formData.inviter_name}
                                onChange={(e) => updateFormData("inviter_name", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="inviter_dob">Date of Birth</Label>
                              <Input 
                                id="inviter_dob" 
                                type="date" 
                                value={formData.inviter_dob}
                                onChange={(e) => updateFormData("inviter_dob", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="inviter_status">Status in Canada</Label>
                              <Select 
                                value={formData.inviter_status} 
                                onValueChange={(v) => updateFormData("inviter_status", v)}
                              >
                                <SelectTrigger id="inviter_status">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PR Card">PR Card</SelectItem>
                                  <SelectItem value="Work Permit">Work Permit</SelectItem>
                                  <SelectItem value="Study Permit">Study Permit</SelectItem>
                                  <SelectItem value="Canadian Citizen">Canadian Citizen</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="inviter_id">UCI or PR Card Number</Label>
                              <Input 
                                id="inviter_id" 
                                placeholder="8 or 10 digit number" 
                                value={formData.inviter_id}
                                onChange={(e) => updateFormData("inviter_id", e.target.value)}
                              />
                            </div>
                            <div className="col-span-full space-y-2">
                              <Label htmlFor="inviter_address">Current Address in Canada</Label>
                              <Input 
                                id="inviter_address" 
                                placeholder="Street, City, Province, Postal Code" 
                                value={formData.inviter_address}
                                onChange={(e) => updateFormData("inviter_address", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="inviter_phone">Phone Number</Label>
                              <Input 
                                id="inviter_phone" 
                                placeholder="+1 (xxx) xxx-xxxx" 
                                value={formData.inviter_phone}
                                onChange={(e) => updateFormData("inviter_phone", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="inviter_email">Email Address</Label>
                              <Input 
                                id="inviter_email" 
                                type="email" 
                                placeholder="email@example.com" 
                                value={formData.inviter_email}
                                onChange={(e) => updateFormData("inviter_email", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="inviter_occupation">Occupation / Status</Label>
                              <Input 
                                id="inviter_occupation" 
                                placeholder="e.g. Software Engineer, Student" 
                                value={formData.inviter_occupation}
                                onChange={(e) => updateFormData("inviter_occupation", e.target.value)}
                              />
                            </div>
                            {formData.inviter_occupation.toLowerCase().includes("student") ? (
                              <div className="space-y-2">
                                <Label htmlFor="inviter_college">Institution / College Name</Label>
                                <Input 
                                  id="inviter_college" 
                                  placeholder="e.g. Humber College" 
                                  value={formData.inviter_college}
                                  onChange={(e) => updateFormData("inviter_college", e.target.value)}
                                />
                              </div>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="inviter_company">Company Name</Label>
                                  <Input 
                                    id="inviter_company" 
                                    placeholder="e.g. Google Canada" 
                                    value={formData.inviter_company}
                                    onChange={(e) => updateFormData("inviter_company", e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="company_address">Company Address</Label>
                                  <Input 
                                    id="company_address" 
                                    placeholder="Street, City, Province, Postal Code" 
                                    value={formData.company_address}
                                    onChange={(e) => updateFormData("company_address", e.target.value)}
                                  />
                                </div>
                              </>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="inviter_start_date">Start Date of Employment/Study</Label>
                              <Input 
                                id="inviter_start_date" 
                                type="date"
                                value={formData.inviter_start_date}
                                onChange={(e) => updateFormData("inviter_start_date", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="inviter_income">Annual Income (CAD)</Label>
                              <Input 
                                id="inviter_income" 
                                placeholder="e.g. 65,000" 
                                value={formData.inviter_income}
                                onChange={(e) => updateFormData("inviter_income", e.target.value)}
                                className={!isLICOValid ? "border-red-500 focus-visible:ring-red-500" : ""}
                              />
                              {!isLICOValid && (
                                <p className="text-xs text-red-600 font-medium">
                                  Income is below the LICO requirement of ${licoRequirement.toLocaleString()} for a family of {formData.family_size}.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Applicant Details</h2>
                            <p className="text-neutral-500">Provide information about the guest(s) visiting Canada.</p>
                          </div>

                          <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-white">
                            <Label className="font-bold text-neutral-700">Number of Applicants:</Label>
                            <div className="flex gap-2">
                              <Button 
                                type="button"
                                variant={formData.num_applicants === 1 ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateFormData("num_applicants", 1)}
                                className={formData.num_applicants === 1 ? "bg-red-600 hover:bg-red-700" : ""}
                              >
                                1 Applicant
                              </Button>
                              <Button 
                                type="button"
                                variant={formData.num_applicants === 2 ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateFormData("num_applicants", 2)}
                                className={formData.num_applicants === 2 ? "bg-red-600 hover:bg-red-700" : ""}
                              >
                                2 Applicants
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-8">
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                                <User className="h-5 w-5 text-red-600" />
                                Applicant 1 Details
                              </h3>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor="applicant_name">Full Name</Label>
                                  <Input 
                                    id="applicant_name" 
                                    placeholder="As shown on Passport" 
                                    value={formData.applicant_name}
                                    onChange={(e) => updateFormData("applicant_name", e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="applicant_dob">Date of Birth</Label>
                                  <Input 
                                    id="applicant_dob" 
                                    type="date" 
                                    value={formData.applicant_dob}
                                    onChange={(e) => updateFormData("applicant_dob", e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="applicant_passport">Passport Number</Label>
                                  <Input 
                                    id="applicant_passport" 
                                    placeholder="Passport #" 
                                    value={formData.applicant_passport}
                                    onChange={(e) => updateFormData("applicant_passport", e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="relationship">Relationship to Inviter</Label>
                                  <Input 
                                    id="relationship" 
                                    placeholder="e.g. Mother, Father, Friend" 
                                    value={formData.relationship}
                                    onChange={(e) => updateFormData("relationship", e.target.value)}
                                  />
                                </div>
                                <div className="col-span-full space-y-2">
                                  <Label htmlFor="applicant_address">Home Address (Home Country)</Label>
                                  <Input 
                                    id="applicant_address" 
                                    placeholder="Full address in home country" 
                                    value={formData.applicant_address}
                                    onChange={(e) => updateFormData("applicant_address", e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="applicant_occupation">Occupation</Label>
                                  <Input 
                                    id="applicant_occupation" 
                                    placeholder="Current job in home country" 
                                    value={formData.applicant_occupation}
                                    onChange={(e) => updateFormData("applicant_occupation", e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="applicant_income">Annual Income (Local Currency)</Label>
                                  <Input 
                                    id="applicant_income" 
                                    placeholder="e.g. 1,200,000" 
                                    value={formData.applicant_income}
                                    onChange={(e) => updateFormData("applicant_income", e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>

                            {formData.num_applicants > 1 && (
                              <div className="space-y-4 pt-4 border-t border-neutral-200">
                                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                                  <User className="h-5 w-5 text-red-600" />
                                  Applicant 2 Details
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="applicant2_name">Full Name</Label>
                                    <Input 
                                      id="applicant2_name" 
                                      placeholder="As shown on Passport" 
                                      value={formData.applicant2_name}
                                      onChange={(e) => updateFormData("applicant2_name", e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="applicant2_dob">Date of Birth</Label>
                                    <Input 
                                      id="applicant2_dob" 
                                      type="date" 
                                      value={formData.applicant2_dob}
                                      onChange={(e) => updateFormData("applicant2_dob", e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="applicant2_passport">Passport Number</Label>
                                    <Input 
                                      id="applicant2_passport" 
                                      placeholder="Passport #" 
                                      value={formData.applicant2_passport}
                                      onChange={(e) => updateFormData("applicant2_passport", e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="applicant2_occupation">Occupation</Label>
                                    <Input 
                                      id="applicant2_occupation" 
                                      placeholder="Current job in home country" 
                                      value={formData.applicant2_occupation}
                                      onChange={(e) => updateFormData("applicant2_occupation", e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-full space-y-2">
                                    <Label htmlFor="applicant2_address">Home Address (Home Country)</Label>
                                    <Input 
                                      id="applicant2_address" 
                                      placeholder="Full address in home country" 
                                      value={formData.applicant2_address}
                                      onChange={(e) => updateFormData("applicant2_address", e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="applicant2_income">Annual Income (Local Currency)</Label>
                                    <Input 
                                      id="applicant2_income" 
                                      placeholder="e.g. 1,200,000" 
                                      value={formData.applicant2_income}
                                      onChange={(e) => updateFormData("applicant2_income", e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {currentStep === 3 && (
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Visit Details</h2>
                            <p className="text-neutral-500">Provide information about the purpose and duration of the visit.</p>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="col-span-full space-y-2">
                              <Label htmlFor="purpose">Purpose of Visit</Label>
                              <Textarea 
                                id="purpose" 
                                placeholder="Describe the occasion, family event, or reason for the visit..." 
                                className="min-h-[100px]"
                                value={formData.purpose}
                                onChange={(e) => updateFormData("purpose", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="start_date">Expected Start Date</Label>
                              <Input 
                                id="start_date" 
                                type="date" 
                                value={formData.start_date}
                                onChange={(e) => updateFormData("start_date", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="end_date">Expected End Date</Label>
                              <Input 
                                id="end_date" 
                                type="date" 
                                value={formData.end_date}
                                onChange={(e) => updateFormData("end_date", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="duration">Duration of Stay</Label>
                              <Input 
                                id="duration" 
                                placeholder={formData.visa_type === "Super Visa" ? "e.g. 2 years (Super Visa allows up to 5 years)" : "e.g. 3 weeks"} 
                                value={formData.duration}
                                onChange={(e) => updateFormData("duration", e.target.value)}
                              />
                            </div>
                            <div className="col-span-full space-y-2">
                              <Label htmlFor="stay_address">Stay Address in Canada</Label>
                              <Input 
                                id="stay_address" 
                                placeholder="Where will the applicant stay?" 
                                value={formData.stay_address}
                                onChange={(e) => updateFormData("stay_address", e.target.value)}
                              />
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-xs"
                                onClick={() => updateFormData("stay_address", formData.inviter_address)}
                              >
                                Same as inviter address
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === 4 && (
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Support & Ties</h2>
                            <p className="text-neutral-500">Demonstrate financial stability and ties to the home country.</p>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="financial_support">Financial Support Details</Label>
                              <Textarea 
                                id="financial_support" 
                                placeholder="Mention bank balance, fixed deposits, net worth certificates, and who will bear the travel expenses..." 
                                className="min-h-[100px]"
                                value={formData.financial_support}
                                onChange={(e) => updateFormData("financial_support", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="inviter_family_details">Inviter's Family in Canada</Label>
                              <Textarea 
                                id="inviter_family_details" 
                                placeholder="Mention spouse, children, and their status in Canada..." 
                                className="min-h-[80px]"
                                value={formData.inviter_family_details}
                                onChange={(e) => updateFormData("inviter_family_details", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="applicant_travel_history">Applicant's International Travel History</Label>
                              <Textarea 
                                id="applicant_travel_history" 
                                placeholder="List countries visited in the last 10 years (e.g., USA, UK, UAE)..." 
                                className="min-h-[80px]"
                                value={formData.applicant_travel_history}
                                onChange={(e) => updateFormData("applicant_travel_history", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="applicant_assets">Applicant's Assets & Property</Label>
                              <Textarea 
                                id="applicant_assets" 
                                placeholder="Detail property ownership, land, or business assets in home country..." 
                                className="min-h-[80px]"
                                value={formData.applicant_assets}
                                onChange={(e) => updateFormData("applicant_assets", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="net_worth">Applicant's Net Worth (CAD)</Label>
                              <Input 
                                id="net_worth" 
                                placeholder="e.g. 76,208" 
                                value={formData.net_worth}
                                onChange={(e) => updateFormData("net_worth", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="home_country_family">Family Members in Home Country</Label>
                              <Textarea 
                                id="home_country_family" 
                                placeholder="List names of children, grandchildren, or other close relatives in home country..." 
                                className="min-h-[80px]"
                                value={formData.home_country_family}
                                onChange={(e) => updateFormData("home_country_family", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ties_home">Strong Ties to Home Country</Label>
                              <Textarea 
                                id="ties_home" 
                                placeholder="Mention property ownership, business management, family responsibilities, and employment..." 
                                className="min-h-[100px]"
                                value={formData.ties_home}
                                onChange={(e) => updateFormData("ties_home", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="additional_info">Additional Information</Label>
                              <Textarea 
                                id="additional_info" 
                                placeholder="Any extra details you want to include in the letter..." 
                                className="min-h-[100px]"
                                value={formData.additional_info}
                                onChange={(e) => updateFormData("additional_info", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === 5 && (
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Final Review</h2>
                            <p className="text-neutral-500">Review your document list and generate the letter.</p>
                          </div>

                          <div className="space-y-6">
                            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-4">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="letter_date" className="font-semibold text-neutral-900">Letter Date</Label>
                                <Input 
                                  id="letter_date"
                                  type="date"
                                  value={formData.letter_date}
                                  onChange={(e) => updateFormData("letter_date", e.target.value)}
                                  className="w-48 bg-white"
                                />
                              </div>
                              <p className="text-xs text-neutral-500">This date will appear at the top of your invitation letter.</p>
                            </div>

                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-neutral-900">Supporting Documents</h3>
                              <p className="text-sm text-neutral-500">Select all documents you are providing with this application:</p>
                              <div className="grid gap-3 sm:grid-cols-2">
                                {SUPPORTING_DOCUMENTS.map((doc) => (
                                  <div 
                                    key={doc} 
                                    className="flex items-start space-x-3 p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors cursor-pointer" 
                                    onClick={() => toggleSupportingDoc(doc)}
                                  >
                                    <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${formData.supporting_documents.includes(doc) ? 'bg-red-600 border-red-600 text-white' : 'border-neutral-300 bg-white'}`}>
                                      {formData.supporting_documents.includes(doc) && <Check className="h-3.5 w-3.5" />}
                                    </div>
                                    <span className="text-sm font-medium text-neutral-700 leading-tight">{doc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-lg bg-blue-50 p-4 text-blue-900">
                              <p className="flex items-center gap-2 text-sm font-medium">
                                <Info className="h-4 w-4" />
                                Final Checklist
                              </p>
                              <p className="mt-1 text-xs opacity-80">
                                Review your document list. These will be included as a formal bulleted list at the end of your invitation letter.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-neutral-100 p-6">
                  <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    disabled={currentStep === 0 || isGenerating}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    disabled={isGenerating}
                    className="bg-red-600 hover:bg-red-700 gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : currentStep === STEPS.length - 1 ? (
                      <>
                        Generate Letter
                        <Check className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">Your Invitation Letter</h2>
                <p className="text-neutral-500">Review and export your document</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={resetForm} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Start Over
                </Button>
                <Button variant="outline" onClick={handleCopy} className="gap-2">
                  {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  Copy
                </Button>
                <Button onClick={handleDownload} className="bg-red-600 hover:bg-red-700 gap-2">
                  <Download className="h-4 w-4" />
                  Download .docx
                </Button>
              </div>
            </div>

            <Card className="border-neutral-200 shadow-xl">
              <CardContent className="p-0">
                <ScrollArea className="h-[600px] w-full rounded-xl bg-white p-8 sm:p-12">
                  <div className="mx-auto max-w-2xl font-serif text-lg leading-relaxed text-neutral-800 whitespace-pre-wrap">
                    {generatedLetter}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 bg-neutral-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Final Stage Editing</CardTitle>
                <CardDescription>Add any missing documents or update information before final export.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Supporting Documents Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-neutral-700">Supporting Documents</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SUPPORTING_DOCUMENTS.map((doc) => (
                      <div 
                        key={doc} 
                        className="flex items-start space-x-3 p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors cursor-pointer" 
                        onClick={() => toggleSupportingDoc(doc)}
                      >
                        <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${formData.supporting_documents.includes(doc) ? 'bg-red-600 border-red-600 text-white' : 'border-neutral-300 bg-white'}`}>
                          {formData.supporting_documents.includes(doc) && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <span className="text-sm font-medium text-neutral-700 leading-tight">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-center">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                    className="bg-neutral-900 text-white hover:bg-neutral-800 gap-2 w-full sm:w-auto"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Regenerate Letter with New Documents
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4" />
                Important Disclaimer
              </p>
              <p className="mt-1 text-xs opacity-80">
                This letter is generated based on the information provided. While it follows IRCC guidelines, it does not guarantee visa approval. Please ensure all details are accurate and consult with a licensed immigration professional if needed.
              </p>
            </div>
          </motion.div>
        )}
      </main>

      <footer className="mt-auto border-t border-neutral-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 flex justify-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-600/10 p-1.5 text-red-600">
              <FileText className="h-full w-full" />
            </div>
            <span className="text-xl font-bold text-neutral-900">Canada Visa Invitation Letter</span>
          </div>
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} Canada Visa Invitation Letter Generator. Not affiliated with IRCC or the Government of Canada.
          </p>
        </div>
      </footer>
    </div>
  );
}
