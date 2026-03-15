export type FrameworkClauseSeed = {
  clauseCode: string;
  category: string;
  title: string;
  description: string;
  defaultApplicable: boolean;
};

export type FrameworkCatalog = {
  key: string;
  name: string;
  version: string;
  description: string;
  clauses: FrameworkClauseSeed[];
};
