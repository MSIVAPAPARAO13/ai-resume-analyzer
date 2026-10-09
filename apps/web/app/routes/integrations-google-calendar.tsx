import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { calendarApi } from '../lib/api.js';

export default function IntegrationsGoogleCalendarPage() {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const msgParam = searchParams.get('message');
    if (statusParam === 'success') {
      setSuccessMsg('Google Calendar connected successfully!');
    } else if (statusParam === 'error') {
      setError(msgParam || 'Failed to complete Google Calendar authorization.');
    }
  }, [searchParams]);

  useEffect(() => {
    loadCalendarStatus();
  }, []);

  async function loadCalendarStatus() {
    try {
      setLoading(true);
      const res = await calendarApi.getStatus();
      setStatus(res);
    } catch (err: any) {
      setError(err.message || 'Failed to check Google Calendar status.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      setError(null);
      const res = await calendarApi.getConnectUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google Calendar connection.');
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Google Calendar?'))
      return;
    try {
      setDisconnecting(true);
      setError(null);
      await calendarApi.disconnect();
      setSuccessMsg('Google Calendar disconnected.');
      await loadCalendarStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect Google Calendar.');
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Top Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/interviews" className="btn btn-outline-secondary btn-sm">
            ← Interviews
          </Link>
          <span className="navbar-brand fw-bold text-info mb-0">
            📅 Google Calendar Integration
          </span>
        </div>
      </nav>

      <div className="container py-5" style={{ maxWidth: 650 }}>
        {successMsg && (
          <div className="alert alert-success py-2">{successMsg}</div>
        )}
        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="card bg-secondary bg-opacity-10 border-secondary p-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              className="rounded bg-white p-2 d-flex align-items-center justify-content-center"
              style={{ width: 48, height: 48 }}
            >
              <span className="fs-3">📅</span>
            </div>
            <div>
              <h5 className="fw-bold mb-0">Google Calendar</h5>
              <span className="text-secondary small">
                Sync mock interviews & live interviews directly to your personal
                calendar.
              </span>
            </div>
          </div>

          <hr className="border-secondary my-3" />

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-info" role="status" />
            </div>
          ) : status?.connected ? (
            <div>
              <div className="alert alert-success border-success bg-opacity-10 d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-5">✓</span>
                  <div>
                    <strong>Connected</strong>
                    <div className="text-secondary small">
                      Scope: {status.connection?.scope || 'calendar.events'}
                    </div>
                  </div>
                </div>
                <span className="badge bg-success">Active</span>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <Link to="/interviews" className="btn btn-outline-light btn-sm">
                  Back to Interviews
                </Link>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  id="disconnect-calendar-btn"
                >
                  {disconnecting ? 'Disconnecting…' : 'Disconnect Calendar'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-secondary small mb-4">
                Connect your Google Calendar to add interview reminders,
                scheduled mock interviews, and live interview slots with one
                click. Resumind requests the narrowest scope (
                <code>calendar.events</code>) and never reads your private
                emails.
              </p>

              <div className="d-flex justify-content-between align-items-center">
                <Link
                  to="/interviews"
                  className="btn btn-outline-secondary btn-sm"
                >
                  Cancel
                </Link>
                <button
                  className="btn btn-info fw-semibold px-4"
                  onClick={handleConnect}
                  id="connect-google-calendar-btn"
                >
                  Connect with Google →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
