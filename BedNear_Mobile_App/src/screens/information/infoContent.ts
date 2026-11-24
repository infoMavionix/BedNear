
export type InfoPage = "privacy" | "terms" | "support" | "about";

export type InfoSection = {
  heading: string;
  body: string;
  bullets?: string[];
};

export type FAQItem = {
  question: string;
  answer: string;
};

export const infoContent: Record<
  InfoPage,
  {
    title: string;
    subtitle: string;
    intro: string;
    sections: InfoSection[];
    faqs?: FAQItem[];
  }
> = {
  privacy: {
    title: "Privacy & Safety",
    subtitle: "Your privacy and safety matter to us.",
    intro:
      "At BedNear, we respect your privacy and are committed to handling your personal information responsibly while helping you discover PG accommodations.",
    sections: [
      {
        heading: "1. Information We Collect",
        body: "We may collect the following information when you use BedNear:",
        bullets: [
          "Personal details such as name, mobile number and email address.",
          "Account and authentication information.",
          "Enquiry details including preferred sharing type, move-in date and messages.",
          "Saved PG listings and enquiry history.",
          "Basic device and technical information.",
          "Location information only when you grant location permission.",
        ],
      },
      {
        heading: "2. How We Use Your Information",
        body: "We use collected information to provide and improve our services.",
        bullets: [
          "Help you discover suitable PG accommodations.",
          "Share relevant enquiry details with PG owners.",
          "Manage your account and saved properties.",
          "Maintain enquiry history.",
          "Respond to support requests and investigate reports.",
          "Improve application performance and reliability.",
        ],
      },
      {
        heading: "3. Information Sharing",
        body:
          "When you submit an enquiry, the information you provide may be shared with the relevant PG owner so they can contact you. We do not make your private account information publicly visible through property listings. Information may also be processed by service providers needed to operate BedNear.",
      },
      {
        heading: "4. Location Permission",
        body:
          "Location access is optional. You can search for PG accommodations by entering a locality, landmark, college or workplace manually. You can change location permissions through your device settings.",
      },
      {
        heading: "5. Data Security",
        body:
          "We take reasonable technical and organisational measures to protect your information against unauthorised access, misuse, alteration or disclosure. Access to personal information should be restricted to authorised purposes.",
      },
      {
        heading: "6. PG Verification & Safety",
        body:
          "BedNear reviews listings through its verification and moderation process. However, a verified listing does not guarantee property safety, quality, legality or availability.",
        bullets: [
          "Visit the PG before making any payment.",
          "Confirm rent, deposit and facilities directly with the owner.",
          "Avoid transferring money to unknown individuals without proper verification.",
          "Never share OTPs, passwords or banking credentials.",
          "Report suspicious listings or misleading information.",
        ],
      },
      {
        heading: "7. Your Privacy Choices",
        body: "You may:",
        bullets: [
          "Browse public listings without creating an account.",
          "Choose whether to grant location permission.",
          "Update permitted personal profile information.",
          "Contact support regarding privacy concerns.",
          "Request account deletion or deactivation through our support process.",
        ],
      },
      {
        heading: "8. Data Retention",
        body:
          "We retain personal information only for as long as reasonably necessary for the purposes for which it was collected, subject to applicable legal and operational requirements.",
      },
      {
        heading: "9. Policy Updates",
        body:
          "We may update this Privacy & Safety information when our services or practices change. Updated information will be made available through the application.",
      },
      {
        heading: "10. Contact Us",
        body:
          "For privacy-related questions or concerns, contact our BedNear support team.",
      },
    ],
  },

  terms: {
    title: "Terms & Privacy",
    subtitle: "Understand the rules for using BedNear.",
    intro:
      "Welcome to BedNear. By accessing or using our application, you agree to these Terms & Conditions. Please read them carefully.",
    sections: [
      {
        heading: "1. About BedNear",
        body:
          "BedNear is a PG accommodation discovery and enquiry platform designed to connect students and working professionals with PG owners.",
      },
      {
        heading: "2. Our Services",
        body: "BedNear provides the following features:",
        bullets: [
          "Search and discover PG accommodations.",
          "Filter properties by rent, sharing type, gender preference and amenities.",
          "View property details and reported bed availability.",
          "Contact PG owners through phone or WhatsApp.",
          "Submit enquiries and manage enquiry history.",
          "Save favourite PG listings.",
          "Report suspicious or misleading listings.",
        ],
      },
      {
        heading: "3. User Responsibilities",
        body: "Users agree to:",
        bullets: [
          "Provide accurate information when using the platform.",
          "Use BedNear only for legitimate purposes.",
          "Avoid false, misleading or abusive enquiries.",
          "Respect PG owners and other users.",
          "Avoid fraudulent or unauthorised activities.",
          "Keep account credentials and OTPs confidential.",
        ],
      },
      {
        heading: "4. Property Information",
        body:
          "Property details, rent, photographs, facilities and availability may be provided by PG owners. Information may change without notice. Users must independently confirm all important details before making accommodation decisions.",
      },
      {
        heading: "5. Enquiries & Bookings",
        body:
          "Submitting an enquiry does not constitute a confirmed booking, reservation or rental agreement. Users and PG owners must communicate directly to arrange property visits and accommodation.",
      },
      {
        heading: "6. Payments & Deposits",
        body:
          "In the current BedNear MVP, rent, deposits and other accommodation payments are handled directly between users and PG owners. BedNear does not collect rent or security deposits through the application.",
      },
      {
        heading: "7. PG Owner Responsibilities",
        body: "PG owners are responsible for:",
        bullets: [
          "Providing accurate property information.",
          "Uploading genuine property photographs.",
          "Maintaining updated rent and availability details.",
          "Responding appropriately to enquiries.",
          "Ensuring compliance with applicable laws and regulations.",
        ],
      },
      {
        heading: "8. Listing Verification",
        body:
          "BedNear may review, approve, reject, suspend or remove listings that contain inaccurate information, duplicate content, suspected fraud or policy violations. Verification does not guarantee property safety or quality.",
      },
      {
        heading: "9. Prohibited Activities",
        body: "Users must not:",
        bullets: [
          "Publish fraudulent or misleading information.",
          "Impersonate another person.",
          "Upload inappropriate or unauthorised content.",
          "Harass or threaten other users.",
          "Attempt unauthorised access to BedNear systems.",
          "Use the platform for unlawful activities.",
        ],
      },
      {
        heading: "10. Account Suspension",
        body:
          "BedNear may restrict, suspend or deactivate accounts that violate these terms, misuse the platform or engage in fraudulent activities, subject to applicable requirements.",
      },
      {
        heading: "11. Platform Limitations",
        body:
          "BedNear facilitates discovery and communication between prospective residents and PG owners. BedNear is not a party to rental agreements, property visits or direct financial transactions between them.",
      },
      {
        heading: "12. Changes to Terms",
        body:
          "We may revise these terms when our services or operational requirements change. Updated terms will be published within the application.",
      },
      {
        heading: "13. Contact",
        body:
          "For questions regarding these terms, please contact the BedNear support team.",
      },
    ],
  },

  support: {
    title: "Help & Support",
    subtitle: "We're here to help you find your next home.",
    intro:
      "Have a question or facing an issue? Find answers to common questions below or contact the BedNear support team.",
    sections: [
      {
        heading: "Contact Our Team",
        body:
          "For assistance with your account, PG listings, enquiries, privacy or technical issues, contact our support team using the contact options below.",
      },
      {
        heading: "Before Contacting Support",
        body:
          "To help us resolve your issue faster, provide:",
        bullets: [
          "Your registered name and mobile number, where relevant.",
          "A short description of the issue.",
          "The PG listing name or reference, if applicable.",
          "A screenshot of the issue, if available.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is BedNear?",
        answer:
          "BedNear helps students and working professionals discover PG accommodations near their preferred locality, college or workplace.",
      },
      {
        question: "Do I need an account to search for PGs?",
        answer:
          "No. You can browse and search public PG listings without signing in. An account may be required for saved PGs and enquiry history.",
      },
      {
        question: "How can I contact a PG owner?",
        answer:
          "Open the PG details page and choose Call, WhatsApp or Send Enquiry to contact the owner.",
      },
      {
        question: "Are PG listings verified?",
        answer:
          "Listings may undergo BedNear's verification and moderation process. However, verification does not guarantee property safety, quality or legality. Always inspect the property yourself.",
      },
      {
        question: "Is the displayed availability guaranteed?",
        answer:
          "No. Availability is based on the latest information reported to BedNear. Please confirm the vacancy directly with the PG owner.",
      },
      {
        question: "How can I save a PG?",
        answer:
          "Tap the heart icon on a property listing. Sign-in may be required to access synchronised favourites.",
      },
      {
        question: "How can I track my enquiries?",
        answer:
          "Sign in and open My Enquiries to view your submitted enquiries and their available statuses.",
      },
      {
        question: "Does BedNear collect rent or deposits?",
        answer:
          "No. In the current MVP, rental payments and deposits are arranged directly between candidates and PG owners.",
      },
      {
        question: "How do I report a suspicious listing?",
        answer:
          "Open the PG details page, choose Report Listing, select a reason and submit your report.",
      },
      {
        question: "What if I cannot log in?",
        answer:
          "Check your registered mobile number and internet connection. If the issue continues, contact our support team.",
      },
      {
        question: "How can I request account deletion?",
        answer:
          "Contact BedNear support using your registered account details to request account deletion or deactivation.",
      },
    ],
  },

  about: {
    title: "About BedNear",
    subtitle: "Find Your Next Home, Nearby.",
    intro:
      "Finding a comfortable and affordable PG accommodation should not be difficult. BedNear makes accommodation discovery simpler by connecting students and working professionals with PG owners.",
    sections: [
      {
        heading: "Our Mission",
        body:
          "Our mission is to simplify PG accommodation discovery by making property information, reported availability and owner communication more accessible.",
      },
      {
        heading: "What We Offer",
        body: "BedNear helps users with:",
        bullets: [
          "Location-based PG discovery.",
          "Rent and sharing preference filters.",
          "Property photographs and amenities.",
          "Reported bed availability.",
          "Direct owner communication.",
          "Saved properties and enquiry tracking.",
        ],
      },
      {
        heading: "Our Vision",
        body:
          "We aim to build a convenient accommodation discovery platform that helps people moving to new cities find suitable places to stay.",
      },
      {
        heading: "Our Commitment",
        body:
          "We continuously work towards improving listing quality, user experience, transparency and communication between PG owners and prospective residents.",
      },
      {
        heading: "Why BedNear?",
        body:
          "Because finding a place to stay should be easier than finding a place to search.",
      },
    ],
  },
};
