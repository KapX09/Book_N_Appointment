require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const twilio = require('twilio');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// POST - save appointment + send confirmation
app.post('/api/appointments', async (req, res) => {
  const { customer_name, phone, appointment_time } = req.body;

  if (!customer_name || !phone || !appointment_time) {
    return res.status(400).json({ error: 'All fields required.' });
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert([{ customer_name, phone, appointment_time }])
    .select();

  if (error) return res.status(500).json({ error });

  const apptDate = new Date(appointment_time);
  const dateStr = apptDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = apptDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  await twilioClient.messages.create({
    from: process.env.TWILIO_PHONE,
    to: `whatsapp:${phone}`,
    body: `Hello ${customer_name},\n\nYour appointment has been confirmed at ${timeStr} on ${dateStr}.\n\nFor queries, contact: support@booknnappoint.com\n\n— Book N Appoint`
  });

  res.json({ success: true });
});

// GET - admin fetch all appointments
app.get('/api/appointments', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('appointment_time', { ascending: true });

  if (error) return res.status(500).json({ error });
  res.json(data);
});

// CRON - every 60s, reminder if appointment within 1 hour
cron.schedule('* * * * *', async () => {
  console.log('Cron tick:', new Date().toLocaleTimeString());
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  console.log('Checking between:', now.toISOString(), 'and', oneHourLater.toISOString());

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('reminder_sent', false)
    .gte('appointment_time', now.toISOString())
    .lte('appointment_time', oneHourLater.toISOString());

  console.log('Found:', data, 'Error:', error);

  for (const appt of data || []) {
    const apptDate = new Date(appt.appointment_time);
    const timeStr = apptDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE,
      to: `whatsapp:${appt.phone}`,
      body: `Hello ${appt.customer_name},\n\nReminder: Your appointment is coming up at ${timeStr} today!\n\nFor queries, contact: support@booknnappoint.com\n\n— Book N Appoint`
    });

    await supabase
      .from('appointments')
      .update({ reminder_sent: true })
      .eq('id', appt.id);

    console.log(`Reminder sent to ${appt.customer_name}`);
  }
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));