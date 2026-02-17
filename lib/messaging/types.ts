// Messaging System Types

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: "sponsor" | "cde" | "investor" | "admin";
  senderOrganization: string;
  recipientId: string;
  recipientName: string;
  recipientRole: "sponsor" | "cde" | "investor" | "admin";
  recipientOrganization: string;
  content: string;
  messageType:
    | "text"
    | "deal_inquiry"
    | "loi_request"
    | "document_share"
    | "meeting_request"
    | "system";
  dealId?: string;
  dealName?: string;
  attachments?: MessageAttachment[];
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageThread {
  id: string;
  participants: ThreadParticipant[];
  dealId?: string;
  dealName?: string;
  subject: string;
  lastMessage: Message;
  unreadCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadParticipant {
  userId: string;
  userName: string;
  userRole: "sponsor" | "cde" | "investor" | "admin";
  organizationName: string;
  isActive: boolean;
  joinedAt: string;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedAt: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  messageType: Message["messageType"];
  targetRole: "sponsor" | "cde" | "investor";
}

// Quick message templates for common scenarios
export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "cde-inquiry",
    name: "CDE Interest Inquiry",
    subject: "Interest in {{dealName}} - NMTC Allocation Available",
    content:
      "Hi {{recipientName}},\n\nI noticed your interest in {{dealName}}. We have {{allocationAmount}} in NMTC allocation available and would love to discuss this opportunity.\n\nKey highlights:\n- Location: {{location}}\n- Total Project Cost: {{projectCost}}\n- Jobs Created: {{jobsCreated}}\n\nWould you be available for a brief call this week?\n\nBest regards,\n{{senderName}}",
    messageType: "deal_inquiry",
    targetRole: "cde",
  },
  {
    id: "investor-pitch",
    name: "Investor Pitch",
    subject: "{{programType}} Investment Opportunity - {{dealName}}",
    content:
      "Hello {{recipientName}},\n\nI have an excellent {{programType}} investment opportunity that matches your investment criteria:\n\n{{dealName}}\n- Investment Amount: {{investmentAmount}}\n- Credit Price: {{creditPrice}}\n- Location: {{location}}\n- Expected Closing: {{expectedClosing}}\n\nThis deal has been pre-screened and scored {{tCredexScore}}/100 on our platform.\n\nInterested in learning more?\n\n{{senderName}}",
    messageType: "deal_inquiry",
    targetRole: "investor",
  },
  {
    id: "loi-request",
    name: "LOI Request",
    subject: "LOI Request for {{dealName}}",
    content:
      "Hi {{recipientName}},\n\nWe're ready to move forward with {{dealName}} and would like to request a Letter of Intent.\n\nDeal Summary:\n- Allocation: {{allocationAmount}}\n- Timeline: {{timeline}}\n- Key Terms: {{keyTerms}}\n\nPlease let me know if you need any additional information.\n\nThanks,\n{{senderName}}",
    messageType: "loi_request",
    targetRole: "cde",
  },
];
