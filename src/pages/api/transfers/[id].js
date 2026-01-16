// pages/api/transfers/[id].js
import { readJson } from '@/lib/dataStore';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      
      const transfers = await readJson('data/transfers.json');
      const transfer = transfers.find((t) => t.id === id);
      
      if (transfer) {
        res.status(200).json(transfer);
      } else {
        res.status(404).json({ message: 'Transfer not found' });
      }
    } else {
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error in transfers/[id] API:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}