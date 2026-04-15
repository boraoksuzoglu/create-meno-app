export function generateEmailLocales(config) {
  return {
    en: generateEnLocale(config),
    tr: generateTrLocale(config),
  };
}

function generateEnLocale(config) {
  const { includeAuth } = config;

  return `/**
 * English email translations
 */
export const en = {
  subjects: {
    welcome: (name) => \`Welcome, \${name}!\`,
    ${
      includeAuth
        ? `forgotPassword: () => 'Reset your password',
    passwordChanged: () => 'Your password has been changed',`
        : ''
    }
  },

  common: {
    greeting: 'Hello,',
    teamSignature: 'Best regards,',
    teamName: 'The Team',
    copyright: 'All rights reserved.',
    sentToPrefix: 'This email was sent to',
    sentToSuffix: '.',
  },

  welcome: {
    title: 'Welcome!',
    subtitle: 'Your account has been created',
    body: 'Thank you for registering. Your account is ready to use.',
    buttonText: 'Get Started →',
  },
  ${
    includeAuth
      ? `
  forgotPassword: {
    title: 'Reset Your Password',
    subtitle: 'Password reset request',
    body: 'We received a request to reset your password. Click the button below to set a new password.',
    buttonText: 'Reset Password →',
    expiryNote: 'This link expires in 1 hour.',
    ignoreNote: 'If you did not request this, you can safely ignore this email.',
  },

  passwordChanged: {
    title: 'Password Changed',
    subtitle: 'Your password has been updated',
    body: 'Your password was successfully changed. If you did not make this change, please contact support immediately.',
    buttonText: 'Go to Dashboard →',
  },`
      : ''
  }
};

export default en;
`;
}

function generateTrLocale(config) {
  const { includeAuth } = config;

  return `/**
 * Turkish email translations
 */
export const tr = {
  subjects: {
    welcome: (name) => \`Hoş geldiniz, \${name}!\`,
    ${
      includeAuth
        ? `forgotPassword: () => 'Şifrenizi sıfırlayın',
    passwordChanged: () => 'Şifreniz değiştirildi',`
        : ''
    }
  },

  common: {
    greeting: 'Merhaba,',
    teamSignature: 'İyi çalışmalar dileriz,',
    teamName: 'Ekibimiz',
    copyright: 'Tüm hakları saklıdır.',
    sentToPrefix: 'Bu e-posta',
    sentToSuffix: ' adresine gönderilmiştir.',
  },

  welcome: {
    title: 'Hoş Geldiniz!',
    subtitle: 'Hesabınız oluşturuldu',
    body: 'Kayıt olduğunuz için teşekkürler. Hesabınız kullanıma hazır.',
    buttonText: 'Başlayın →',
  },
  ${
    includeAuth
      ? `
  forgotPassword: {
    title: 'Şifrenizi Sıfırlayın',
    subtitle: 'Şifre sıfırlama talebi',
    body: 'Şifrenizi sıfırlamak için bir talep aldık. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın.',
    buttonText: 'Şifreyi Sıfırla →',
    expiryNote: 'Bu bağlantı 1 saat içinde geçerliliğini yitirir.',
    ignoreNote: 'Bu talebi siz yapmadıysanız bu e-postayı güvenle görmezden gelebilirsiniz.',
  },

  passwordChanged: {
    title: 'Şifre Değiştirildi',
    subtitle: 'Şifreniz güncellendi',
    body: 'Şifreniz başarıyla değiştirildi. Bu değişikliği siz yapmadıysanız lütfen hemen destek ekibiyle iletişime geçin.',
    buttonText: "Dashboard'a Git →",
  },`
      : ''
  }
};

export default tr;
`;
}
