import { getCheckInReminderLinks } from '../utils/calendarLinks';
import { formatDate } from '../utils/checkInDates';

export default function CheckInReminder({ year, quarter, goalTitle, checkInDate }) {
  const links = getCheckInReminderLinks(year, quarter, goalTitle, checkInDate);

  const isPast = new Date(checkInDate) < new Date();

  return (
    <div className={`checkin-reminder ${isPast ? 'past' : 'upcoming'}`}>
      <div className="checkin-date">
        <span className="checkin-quarter">Q{quarter}</span>
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
        </div>
      )}
    </div>
  );
}
