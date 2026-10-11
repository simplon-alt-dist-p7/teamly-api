import { dailyTaskRecapEmail } from './daily-task-recap.email';

describe('dailyTaskRecapEmail', () => {
  const day = new Date('2026-10-11T00:00:00.000Z');
  const message = dailyTaskRecapEmail({
    to: 'owner@test.com',
    restaurantName: 'Le Bistrot',
    day,
    lists: [
      {
        name: 'Ouverture "soir"',
        tasks: [
          {
            label: '<b> &',
            employeeFirstName: 'Alice',
            employeeLastName: "O'Neil",
            checkedAt: new Date('2026-10-11T07:12:00.000Z'),
          },
          {
            label: 'Nettoyer le plan',
          },
        ],
      },
    ],
  });

  it('includes the year in the subject and keeps the weekday lowercase', () => {
    expect(message.subject).toBe('Tâches du dimanche 11 octobre 2026');
    expect(message.text).toContain(
      'Voici les tâches à valider du dimanche 11 octobre 2026 pour Le Bistrot.',
    );
  });

  it('shows the employee name and time for a checked task', () => {
    expect(message.html).toContain('Alice O&#39;Neil · 09:12');
    expect(message.text).toContain("<b> & : faite par Alice O'Neil à 09:12");
  });

  it('shows Non faite for an unchecked task', () => {
    expect(message.html).toContain('Non faite');
    expect(message.html).toContain('color:#b91c1c');
  });

  it('escapes user text in the html', () => {
    expect(message.html).toContain('&lt;b&gt; &amp;');
    expect(message.html).toContain('Ouverture &quot;soir&quot;');
    expect(message.html).not.toContain('<b>');
  });

  it('counts checked tasks in the summary', () => {
    expect(message.html).toContain('1 tâche faite sur 2');
  });

  it('lets a long label wrap on its own line', () => {
    const longLabel =
      'Vérifier que le réservoir de la machine à café est plein avant le service du matin et noter la température du frigo';
    const longMessage = dailyTaskRecapEmail({
      to: 'owner@test.com',
      restaurantName: 'Le Bistrot',
      day,
      lists: [{ name: 'Ouverture', tasks: [{ label: longLabel }] }],
    });

    expect(longMessage.html).toContain(longLabel);
    expect(longMessage.html).toContain('overflow-wrap:anywhere');
    expect(longMessage.html).toContain('Non faite');
  });
});
