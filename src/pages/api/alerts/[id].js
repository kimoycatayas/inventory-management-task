// pages/api/alerts/[id].js
import { readJson, writeJsonAtomic } from '@/lib/dataStore';

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      // GET /api/alerts/[id]
      const alerts = await readJson('data/alerts.json');
      const alert = alerts.find((a) => a.id === id);

      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }

      res.status(200).json(alert);
    } else if (req.method === 'PUT') {
      // PUT /api/alerts/[id] - Update alert status
      const { status, notes } = req.body;

      const alerts = await readJson('data/alerts.json');
      const alertIndex = alerts.findIndex((a) => a.id === id);

      if (alertIndex === -1) {
        return res.status(404).json({ message: 'Alert not found' });
      }

      const alert = alerts[alertIndex];
      const now = new Date().toISOString();

      // Update alert
      alerts[alertIndex] = {
        ...alert,
        status: status || alert.status,
        notes: notes !== undefined ? notes : alert.notes,
        updatedAt: now,
        acknowledgedAt: status === 'acknowledged' && !alert.acknowledgedAt ? now : alert.acknowledgedAt,
        resolvedAt: status === 'resolved' && !alert.resolvedAt ? now : alert.resolvedAt,
      };

      await writeJsonAtomic('data/alerts.json', alerts);

      res.status(200).json(alerts[alertIndex]);
    } else if (req.method === 'DELETE') {
      // DELETE /api/alerts/[id] - Delete alert (or mark as dismissed)
      const alerts = await readJson('data/alerts.json');
      const alertIndex = alerts.findIndex((a) => a.id === id);

      if (alertIndex === -1) {
        return res.status(404).json({ message: 'Alert not found' });
      }

      // Instead of deleting, mark as dismissed
      alerts[alertIndex] = {
        ...alerts[alertIndex],
        status: 'dismissed',
        updatedAt: new Date().toISOString(),
      };

      await writeJsonAtomic('data/alerts.json', alerts);

      res.status(200).json({ message: 'Alert dismissed' });
    } else {
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error in alerts API:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
