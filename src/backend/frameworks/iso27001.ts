export type IsoClauseSeed = {
  clauseCode: string;
  category: "Organizational" | "People" | "Physical" | "Technological";
  title: string;
  description: string;
  defaultApplicable: boolean;
};

const withCodes = (
  prefix: string,
  titles: string[],
  category: IsoClauseSeed["category"]
): IsoClauseSeed[] =>
  titles.map((title, idx) => {
    const clauseCode = `${prefix}.${idx + 1}`;
    return {
      clauseCode,
      category,
      title,
      description: `Annex A ${clauseCode}: ${title}.`,
      defaultApplicable: true
    };
  });

const ORGANIZATIONAL_TITLES = [
  "Policies for information security",
  "Information security roles and responsibilities",
  "Segregation of duties",
  "Management responsibilities",
  "Contact with authorities",
  "Contact with special interest groups",
  "Threat intelligence",
  "Information security in project management",
  "Inventory of information and other associated assets",
  "Acceptable use of information and other associated assets",
  "Return of assets",
  "Classification of information",
  "Labelling of information",
  "Information transfer",
  "Access control",
  "Identity management",
  "Authentication information",
  "Access rights",
  "Information security in supplier relationships",
  "Addressing information security within supplier agreements",
  "Managing information security in the ICT supply chain",
  "Monitoring, review and change management of supplier services",
  "Information security for use of cloud services",
  "Information security incident management planning and preparation",
  "Assessment and decision on information security events",
  "Response to information security incidents",
  "Learning from information security incidents",
  "Collection of evidence",
  "Information security during disruption",
  "ICT readiness for business continuity",
  "Legal, statutory, regulatory and contractual requirements",
  "Intellectual property rights",
  "Protection of records",
  "Privacy and protection of PII",
  "Independent review of information security",
  "Compliance with policies, rules and standards for information security",
  "Documented operating procedures"
] as const;

const PEOPLE_TITLES = [
  "Screening",
  "Terms and conditions of employment",
  "Information security awareness, education and training",
  "Disciplinary process",
  "Responsibilities after termination or change of employment",
  "Confidentiality or non-disclosure agreements",
  "Remote working",
  "Information security event reporting"
] as const;

const PHYSICAL_TITLES = [
  "Physical security perimeters",
  "Physical entry controls",
  "Securing offices, rooms and facilities",
  "Physical security monitoring",
  "Protecting against physical and environmental threats",
  "Working in secure areas",
  "Clear desk and clear screen",
  "Equipment siting and protection",
  "Security of assets off-premises",
  "Storage media",
  "Supporting utilities",
  "Cabling security",
  "Equipment maintenance",
  "Secure disposal or re-use of equipment"
] as const;

const TECHNOLOGICAL_TITLES = [
  "User endpoint devices",
  "Privileged access rights",
  "Information access restriction",
  "Access to source code",
  "Secure authentication",
  "Capacity management",
  "Protection against malware",
  "Management of technical vulnerabilities",
  "Configuration management",
  "Information deletion",
  "Data masking",
  "Data leakage prevention",
  "Information backup",
  "Redundancy of information processing facilities",
  "Logging",
  "Monitoring activities",
  "Clock synchronization",
  "Use of privileged utility programs",
  "Installation of software on operational systems",
  "Network security",
  "Security of network services",
  "Segregation of networks",
  "Web filtering",
  "Use of cryptography",
  "Secure development life cycle",
  "Application security requirements",
  "Secure system architecture and engineering principles",
  "Secure coding",
  "Security testing in development and acceptance",
  "Outsourced development",
  "Separation of development, test and production environments",
  "Change management",
  "Test information",
  "Protection of information systems during audit testing"
] as const;

export const ISO_27001_2022_CLAUSES: IsoClauseSeed[] = [
  ...withCodes("A.5", [...ORGANIZATIONAL_TITLES], "Organizational"),
  ...withCodes("A.6", [...PEOPLE_TITLES], "People"),
  ...withCodes("A.7", [...PHYSICAL_TITLES], "Physical"),
  ...withCodes("A.8", [...TECHNOLOGICAL_TITLES], "Technological")
];

export const ISO_27001_2022 = {
  key: "ISO27001",
  name: "ISO/IEC 27001",
  version: "2022",
  description: "Information security, cybersecurity and privacy protection management systems",
  clauses: ISO_27001_2022_CLAUSES
};

export const ISO_ANNEX_A_CONTROL_COUNT = ISO_27001_2022_CLAUSES.length;
