import LegalLayout from "@/components/LegalLayout";

const Privacy = () => (
  <LegalLayout
    title="Privacy Policy"
    updated="May 12, 2026"
    intro="CourseConnect Nigeria Ltd. (“CourseConnect”, “we”, “us”, “our”) respects your privacy. This Policy explains how we collect, use, share, and protect your personal data in compliance with the Nigeria Data Protection Act, 2023 (NDPA) and the regulations of the Nigeria Data Protection Commission (NDPC)."
  >
    <h2>1. Who we are</h2>
    <p>CourseConnect is a Nigerian-incorporated company providing a platform for university students to share and access course materials. Our principal office is in Lagos, Nigeria.</p>

    <h2>2. Information we collect</h2>
    <ul>
      <li><strong>Account data:</strong> name, email address, password (hashed), university, department, and academic level.</li>
      <li><strong>Profile data:</strong> display name, avatar, bio, and any information you choose to add.</li>
      <li><strong>Content data:</strong> materials you upload (PDFs, videos, images, notes), titles, and descriptions.</li>
      <li><strong>Usage data:</strong> pages viewed, downloads, device type, browser, IP address, and approximate location.</li>
      <li><strong>Cookies:</strong> session cookies for authentication and analytics cookies for performance.</li>
    </ul>

    <h2>3. Lawful basis for processing</h2>
    <p>We process personal data based on your <strong>consent</strong>, the <strong>performance of a contract</strong> (our Terms), our <strong>legitimate interests</strong> in operating the service, and to comply with <strong>legal obligations</strong> under Nigerian law.</p>

    <h2>4. How we use your data</h2>
    <ul>
      <li>Create and secure your account.</li>
      <li>Display your uploads to other students after moderation.</li>
      <li>Send service updates, moderation notices, and security alerts.</li>
      <li>Detect fraud, abuse, and violations of our Community Guidelines.</li>
      <li>Improve our features and platform performance.</li>
    </ul>

    <h2>5. Sharing your data</h2>
    <p>We do not sell your personal data. We share data only with:</p>
    <ul>
      <li>Trusted infrastructure providers (hosting, database, storage) under data-processing agreements.</li>
      <li>Law-enforcement or regulators where required by Nigerian law (e.g., EFCC, NPF, NDPC, court orders).</li>
      <li>Other users — only the public parts of your profile and approved uploads.</li>
    </ul>

    <h2>6. International transfers</h2>
    <p>Some of our processors may store data outside Nigeria. Where this happens, we ensure adequate safeguards as required by the NDPA.</p>

    <h2>7. Data retention</h2>
    <p>We retain account and content data for as long as your account is active. You may request deletion at any time; certain records may be retained where required by law.</p>

    <h2>8. Your rights under the NDPA</h2>
    <ul>
      <li>Right to access, correct, or delete your data.</li>
      <li>Right to object to or restrict processing.</li>
      <li>Right to data portability.</li>
      <li>Right to withdraw consent at any time.</li>
      <li>Right to lodge a complaint with the Nigeria Data Protection Commission (NDPC) at <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer">ndpc.gov.ng</a>.</li>
    </ul>

    <h2>9. Security</h2>
    <p>We use encryption in transit (HTTPS), hashed passwords, role-based access control, and Row-Level Security on our database. Despite our efforts, no system is 100% secure.</p>

    <h2>10. Children</h2>
    <p>Our service is intended for students aged 16 and older. If you are under 16, you must have parental or guardian consent to use CourseConnect.</p>

    <h2>11. Changes</h2>
    <p>We will notify you of material changes through the platform or by email. Continued use after notice constitutes acceptance.</p>

    <h2>12. Contact our Data Protection Officer</h2>
    <p>Email: <a href="mailto:dpo@courseconnect.ng">dpo@courseconnect.ng</a><br />Address: Lagos, Nigeria</p>
  </LegalLayout>
);

export default Privacy;