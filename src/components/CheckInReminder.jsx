import { getCheckInReminderLinks, downloadICSFile } from '../utils/calendarLinks';
import { formatDate } from '../utils/checkInDates';

export default function CheckInReminder({ year, quarter, goalTitle, checkInDate, type = 'halfway' }) {
  const links = getCheckInReminderLinks(year, quarter, goalTitle, checkInDate, type);
  const isPast = new Date(checkInDate) < new Date();
  const typeLabel = type === 'full' ? 'Full Review' : 'Halfway';

  return (
    <div className={`checkin-reminder ${isPast ? 'past' : 'upcoming'}`}>
      <div className="checkin-date">
        <span className="checkin-quarter">Q{quarter} — {typeLabel}</span>
        <span className="checkin-date-text">{formatDate(checkInDate)}</span>
      </div>
      {!isPast && (
        <div className="checkin-actions">
          <a
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline"
          >
            Google Calendar
          </a>
          <a
            href={links.outlook}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline"
          >
            Outlook
          </a>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => downloadICSFile(links.icsTitle, checkInDate, links.icsDescription)}
          >
            iCal
          </button>
        </div>
      )}
    </div>
  );
}
