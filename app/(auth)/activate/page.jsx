import ActivateAccountForm from "./activate-account-form";

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const token = params.token;

  return <ActivateAccountForm token={token} />;
}
