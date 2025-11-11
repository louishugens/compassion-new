import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
  Button,
} from '@react-email/components';

interface AccountCreationCodeEmailProps {
  creationCode: string;
  email: string;
}

const AccountCreationCodeEmail = (props: AccountCreationCodeEmailProps) => {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Votre code pour créer votre compte Compassion Haiti</Preview>
      <Tailwind>
        <Body className="bg-[#F6F8FA] font-sans py-[40px]" style={{ backgroundColor: "#F6F8FA", fontFamily: "sans-serif", paddingTop: "40px", paddingBottom: "40px" }}>
          <Container className="bg-[#FFFFFF] rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[32px]" style={{ backgroundColor: "#FFFFFF", borderRadius: "8px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", maxWidth: "600px", margin: "0 auto", padding: "32px" }}>
            {/* Header with Logo */}
            <Section className="text-center mb-[32px]">
              <Img
                src="https://compassion.bizhightech.com/_next/image?url=%2Ficon.png&w=96&q=75"
                width="80"
                height="80"
                alt="Compassion Haiti"
                className="mx-auto mb-[16px]"
              />
              <Heading className="text-[24px] font-bold text-[#020304] m-0">
                Bienvenue sur la plateforme Compassion Haiti
              </Heading>
            </Section>

            {/* Main Content */}
            <Section className="mb-[32px]">
              <Text className="text-[16px] text-[#020304] mb-[16px] leading-[24px]">
                Bonjour,
              </Text>
              
              <Text className="text-[16px] text-[#020304] mb-[24px] leading-[24px]">
                Un administrateur vous a autorisé à créer votre compte sur la plateforme Compassion Haiti.
              </Text>
{/* 
              <Text className="text-[16px] text-[#020304] mb-[16px] leading-[24px]">
                Ensemble, nous œuvrons pour libérer les enfants de la pauvreté au nom de Jésus, 
                en leur offrant éducation, soins de santé et guidance spirituelle dans nos 15 centres 
                de développement à travers Haïti.
              </Text> */}
            </Section>

            {/* Access Code Section */}
            <Section className="bg-[#f8fafc] border border-solid border-[#e2e8f0] rounded-[8px] p-[24px] mb-[32px] text-center">
              <Text className="text-[14px] text-[#64748b] mb-[8px] m-0 uppercase tracking-wide font-semibold">
                Votre Code de Création de Compte
              </Text>
              <Text className="text-[32px] font-bold text-[#1e40af] m-0 letter-spacing-[4px] font-mono">
                {props.creationCode}
              </Text>
              <Text className="text-[12px] text-[#64748b] mt-[8px] m-0">
                Utilisez ce code pour créer votre compte
              </Text>
            </Section>

            {/* Instructions */}
            <Section className="mb-[32px]">
              <Heading className="text-[18px] font-bold text-[#020304] mb-[16px]">
                Comment créer votre compte :
              </Heading>
              
              <Text className="text-[16px] text-[#020304] mb-[12px] leading-[24px]">
                1. Rendez-vous sur notre plateforme : 
                <Link 
                  href="https://compassion.bizhightech.com/" 
                  className="text-[#1e40af] underline ml-[4px]"
                >
                  compassion.bizhightech.com
                </Link>
              </Text>
              
              <Text className="text-[16px] text-[#020304] mb-[12px] leading-[24px]">
                2. Cliquez sur "S'inscrire"
              </Text>
              
              <Text className="text-[16px] text-[#020304] mb-[12px] leading-[24px]">
                3. Saisissez votre adresse email : <strong>{props.email}</strong>
              </Text>
              
              <Text className="text-[16px] text-[#020304] mb-[12px] leading-[24px]">
                4. Entrez le code de création fourni ci-dessus
              </Text>

              <Text className="text-[16px] text-[#020304] mb-[24px] leading-[24px]">
                5. Complétez les informations de votre profil
              </Text>

              <Button
                href="https://compassion.bizhightech.com/"
                className="bg-blue-800 text-white px-[32px] py-[12px] rounded-full text-[16px] font-semibold no-underline box-border"
              >
                Créer mon compte
              </Button>
            </Section>

            {/* Important Note */}
            <Section className="bg-[#fef3c7] border border-solid border-[#f59e0b] rounded-[8px] p-[16px] mb-[32px]">
              <Text className="text-[14px] text-[#92400e] m-0 leading-[20px]">
                <strong>Important :</strong> Ce code est unique et personnel. 
                Gardez-le en sécurité et ne le partagez avec personne d'autre.
              </Text>
            </Section>

            {/* Support Section */}
            <Section className="mb-[32px]">
              <Text className="text-[14px] text-[#64748b] leading-[20px]">
                <strong>Besoin d'aide ?</strong><br />
                Notre équipe est là pour vous accompagner dans cette mission importante. 
                N'hésitez pas à nous contacter si vous rencontrez des difficultés lors de la création de votre compte.
              </Text>
            </Section>

            <Hr className="border-[#e2e8f0] my-[32px]" />

            {/* Footer */}
            <Section className="text-center">
              <Text className="text-[14px] text-[#64748b] mb-[8px] font-semibold">
                Libérer les enfants de la pauvreté au nom de Jésus.
              </Text>
              
              <Text className="text-[12px] text-[#64748b] m-0">
                © 2025 Compassion International - Haïti
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

AccountCreationCodeEmail.PreviewProps = {
  creationCode: "CH2025",
  email: "nouveau.membre@example.com",
};

export default AccountCreationCodeEmail;