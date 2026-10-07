import { EmailMessage } from 'src/email/email-sender';

export function resetPasswordEmail(
  to: string,
  resetLink: string,
): EmailMessage {
  const appName = process.env.MAIL_FROM_NAME ?? 'Teamly';

  return {
    to,
    subject: `Réinitialisation de votre mot de passe ${appName}`,
    text: [
      'Bonjour,',
      '',
      `Vous avez demandé à réinitialiser le mot de passe de votre compte ${appName}.`,
      'Pour en choisir un nouveau, ouvrez ce lien (valable 1 heure) :',
      resetLink,
      '',
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.",
      '',
      `L'équipe ${appName}`,
    ].join('\n'),
    html: `
<div style="margin:0;padding:40px 16px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1e1f24;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:460px;margin:0 auto;">
    <tr>
      <td style="padding-bottom:20px;border-bottom:1px solid #e8e8ec;font-size:18px;font-weight:700;letter-spacing:-0.2px;">${appName}</td>
    </tr>
    <tr>
      <td style="padding-top:28px;">
        <p style="margin:0;font-size:20px;line-height:28px;font-weight:600;">Réinitialisez votre mot de passe</p>
        <p style="margin:12px 0 0;font-size:15px;line-height:24px;color:#3a3c42;">Vous avez demandé à réinitialiser le mot de passe de votre compte ${appName}. Ce lien est valable 1 heure.</p>
        <p style="margin:24px 0;">
          <a href="${resetLink}" style="display:inline-block;padding:11px 18px;background:#1e1f24;color:#ffffff;font-size:15px;font-weight:500;text-decoration:none;border-radius:6px;">Choisir un nouveau mot de passe</a>
        </p>
        <p style="margin:0;font-size:13px;line-height:20px;color:#80838d;">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br><a href="${resetLink}" style="color:#80838d;word-break:break-all;">${resetLink}</a></p>
        <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e8e8ec;font-size:13px;line-height:20px;color:#80838d;">Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email, votre mot de passe reste inchangé.</p>
      </td>
    </tr>
  </table>
</div>`,
  };
}
