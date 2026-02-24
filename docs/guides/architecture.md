# Architecture Overview

## Services
1. Integration Connectors
2. Scanner + Rules Engine
3. Policy Generator
4. Remediation Orchestrator
5. Evidence Vault + Audit Exporter
6. Dashboard + Reporting API

## Data Flow
Integrations → Normalized Assets → Scans → Findings → Policies → Tasks → Evidence → Audit Export

## Security
- Tenant isolation by org_id
- Audit logging for all actions
- Encryption at rest for evidence files
