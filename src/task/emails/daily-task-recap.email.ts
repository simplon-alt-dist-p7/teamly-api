import { EmailMessage } from 'src/email/email-sender';

export type DailyTaskRecapTask = {
  readonly label: string;
  readonly employeeFirstName?: string;
  readonly employeeLastName?: string;
  readonly checkedAt?: Date;
};

export type DailyTaskRecapList = {
  readonly name: string;
  readonly tasks: DailyTaskRecapTask[];
};

type DailyTaskRecapEmailProps = {
  readonly to: string;
  readonly restaurantName: string;
  readonly day: Date;
  readonly lists: DailyTaskRecapList[];
};

export function dailyTaskRecapEmail(
  props: DailyTaskRecapEmailProps,
): EmailMessage {
  const dayLabel = formatDay(props.day);
  const sections = props.lists.map((list) => ({
    name: list.name,
    lines: list.tasks.map((task) => formatTaskLine(task)),
  }));
  const lines = [
    'Bonjour,',
    '',
    `Voici les tâches à valider du ${dayLabel} pour ${props.restaurantName}.`,
    '',
  ];

  for (const section of sections) {
    lines.push(section.name);
    for (const taskLine of section.lines) {
      lines.push(taskLine);
    }
    lines.push('');
  }

  const text = lines.join('\n');

  return {
    to: props.to,
    subject: `Tâches du ${dayLabel}`,
    text,
    html: `<pre>${text}</pre>`,
  };
}

function formatDay(day: Date): string {
  const label = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(day);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTaskLine(task: DailyTaskRecapTask): string {
  if (!task.checkedAt) {
    return `${task.label} : non faite`;
  }

  const time = task.checkedAt.toLocaleTimeString('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
  });
  const name =
    `${task.employeeFirstName ?? ''} ${task.employeeLastName ?? ''}`.trim();

  return `${task.label} : faite par ${name} à ${time}`;
}
