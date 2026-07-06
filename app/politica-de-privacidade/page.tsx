import type { Metadata } from "next";

import { PrivacyPolicyView } from "@/features/legal/components/PrivacyPolicyView";

export const metadata: Metadata = {
  title: "Política de Privacidade | SobraAí",
  description:
    "Política de Privacidade do SobraAí para front-end web, back-end e aplicativo Android.",
};

export default function PoliticaDePrivacidadePage() {
  return <PrivacyPolicyView />;
}
