export interface CertificateSkillSummary {
  name: string;
  category: 'Foundations' | 'Algorithms' | 'Hardware' | 'Variational';
  level: 'Proficient' | 'Advanced' | 'Mastery';
}

export interface QuantumCertificate {
  id: string; // e.g. "QL-QC-2026-8942-X7"
  recipientName: string;
  recipientEmail: string;
  recipientRole: 'Student' | 'Researcher' | 'Engineer';
  courseTitle: string;
  courseCode: string;
  issueDate: string; // ISO date string e.g. "2026-09-29"
  formattedDate: string; // e.g. "September 29, 2026"
  expiryDate: 'Permanent' | string;
  
  // Academic & Performance Telemetry
  overallScore: number; // 0 - 100
  overallGrade: string; // 'A+' | 'A' | 'A*'
  distinction: 'Summa Cum Laude' | 'Magna Cum Laude' | 'Cum Laude' | 'Pass with Distinction';
  stateFidelityScore: number; // e.g. 99.85%
  completedLessonsCount: number;
  totalCourseLessons: number;
  totalXpEarned: number;
  circuitsDesignedCount: number;
  
  // Skills Mastered
  verifiedSkills: CertificateSkillSummary[];
  
  // Cryptographic & Integrity Proof
  verificationHash: string; // SHA-256 styled hash: "0x7f9a8b1c4e2d3f..."
  quantumSealNumber: string; // e.g. "SEAL-QPU-88219"
  verificationUrl: string; // e.g. "https://qualution.ai/?verify=QL-QC-2026-8942-X7"
  
  // Signatories
  signatories: {
    primary: {
      name: string;
      title: string;
      affiliation: string;
      signatureData: string; // SVG or text signature representation
    };
    secondary: {
      name: string;
      title: string;
      affiliation: string;
      signatureData: string;
    };
  };
}

export interface CertificateVerificationResult {
  isValid: boolean;
  certificate: QuantumCertificate | null;
  verifiedAt: string;
  tamperEvident: boolean;
  message: string;
}

export interface CertificateGenerationOptions {
  recipientName: string;
  recipientEmail: string;
  overallScore?: number;
  overallGrade?: string;
  stateFidelityScore?: number;
  completedLessonsCount?: number;
  totalXpEarned?: number;
  circuitsCount?: number;
}
