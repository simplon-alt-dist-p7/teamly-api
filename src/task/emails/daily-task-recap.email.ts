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

const fontFamily = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

export function dailyTaskRecapEmail(
  props: DailyTaskRecapEmailProps,
): EmailMessage {
  const dayLabel = formatDay(props.day);
  const lines = [
    'Bonjour,',
    '',
    `Voici les tâches à valider du ${dayLabel} pour ${props.restaurantName}.`,
    '',
  ];
  const blocks: string[] = [];
  let done = 0;
  let total = 0;

  for (const list of props.lists) {
    lines.push(list.name);
    blocks.push(
      `<p style="margin:20px 0 0;font-size:15px;line-height:22px;font-weight:700;overflow-wrap:anywhere;">${escapeHtml(list.name)}</p>`,
    );

    for (const task of list.tasks) {
      total += 1;
      lines.push(formatTaskLine(task));
      if (task.checkedAt) {
        done += 1;
      }
      blocks.push(renderTask(task));
    }

    lines.push('');
  }

  const summaryLabel = done > 1 ? 'tâches faites' : 'tâche faite';

  return {
    to: props.to,
    subject: `Tâches du ${dayLabel}`,
    text: lines.join('\n'),
    html: renderHtml(
      props.restaurantName,
      dayLabel,
      `${done} ${summaryLabel} sur ${total}`,
      blocks.join(''),
    ),
  };
}

function formatDay(day: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(day);
}

function formatTaskLine(task: DailyTaskRecapTask): string {
  if (!task.checkedAt) {
    return `${task.label} : non faite`;
  }

  const time = formatTime(task.checkedAt);
  const name = employeeName(task);

  return `${task.label} : faite par ${name} à ${time}`;
}

function formatTime(checkedAt: Date): string {
  return checkedAt.toLocaleTimeString('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function employeeName(task: DailyTaskRecapTask): string {
  return `${task.employeeFirstName ?? ''} ${task.employeeLastName ?? ''}`.trim();
}

function renderTask(task: DailyTaskRecapTask): string {
  const checked = Boolean(task.checkedAt);
  const status = checked ? formatCheckedStatus(task) : 'Non faite';
  const color = checked ? '#15803d' : '#b91c1c';

  return `
<p style="margin:12px 0 0;font-size:15px;line-height:22px;overflow-wrap:anywhere;">${escapeHtml(task.label)}</p>
<p style="margin:0 0 12px;font-size:14px;line-height:20px;color:${color};overflow-wrap:anywhere;">${escapeHtml(status)}</p>`;
}

function formatCheckedStatus(task: DailyTaskRecapTask): string {
  const name = employeeName(task);
  const time = formatTime(task.checkedAt as Date);

  return name ? `${name} · ${time}` : time;
}

function renderHtml(
  restaurantName: string,
  dayLabel: string,
  summary: string,
  blocks: string,
): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0;padding:0;background:#f6f6f7;border-collapse:collapse;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e6e7eb;border-collapse:collapse;font-family:${fontFamily};color:#1e1f24;">
        <tr>
          <td style="padding:24px 16px;font-size:15px;line-height:22px;overflow-wrap:anywhere;">
            <p style="margin:0;font-size:20px;line-height:28px;font-weight:700;">${escapeHtml(restaurantName)}</p>
            <p style="margin:4px 0 0;font-size:14px;line-height:20px;color:#6b6e7a;">${escapeHtml(dayLabel)}</p>
            <p style="margin:16px 0 0;padding-top:16px;border-top:1px solid #e6e7eb;color:#6b6e7a;">${escapeHtml(summary)}</p>
            ${blocks}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
