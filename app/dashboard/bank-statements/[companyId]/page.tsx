import BankStatementsPageClient from './BankStatementsPageClient';

interface PageProps {
  params: Promise<{
    companyId: string;
  }>;
}

export default async function CompanyBankStatementsPage({ params }: PageProps) {
  const { companyId } = await params;

  return <BankStatementsPageClient companyId={companyId} />;
}

