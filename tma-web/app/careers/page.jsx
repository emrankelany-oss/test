import CareersApp from "@/components/careers/CareersApp";
import ClientShell from "@/components/shell/ClientShell";

export const metadata = {
  title: "Careers",
  description:
    "Join The Motion Agency. Open roles in Amman and Riyadh — strategists, designers, growth marketers, producers building category-defining brands across the GCC.",
};

export default function CareersPage() {
  return (
    <>
      <ClientShell enableScrolledNav={false} />
      <CareersApp />
    </>
  );
}
