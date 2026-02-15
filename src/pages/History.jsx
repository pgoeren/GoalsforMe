import ChangeHistory from '../components/ChangeHistory';

export default function History() {
  return (
    <div className="history-page">
      <h1>Change History</h1>
      <p className="page-subtitle">All changes made to your goals are tracked here.</p>
      <ChangeHistory />
    </div>
  );
}
