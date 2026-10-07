import ukMessages from '@/messages/uk.json';

type Messages = typeof ukMessages;

export function useTranslations(namespace: keyof Messages) {
  const messages = ukMessages[namespace] as Record<string, string>;
  return (key: string, values?: Record<string, string | number>) => {
    let message = messages[key] || key;
    if (values) {
      Object.entries(values).forEach(([k, v]) => {
        message = message.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return message;
  };
}

export function useLocale() {
  return 'uk' as const;
}

export function getMessages() {
  return ukMessages;
}
