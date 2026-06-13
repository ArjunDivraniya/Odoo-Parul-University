const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;
let isReady = false;

exports.initialize = () => {
  try {
    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
      }),
      puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    client.on('qr', (qr) => {
      console.log('\n========================================================');
      console.log('📱 SCAN THE QR CODE BELOW WITH WHATSAPP TO CONNECT 📱');
      console.log('========================================================\n');
      qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
      console.log('✅ WhatsApp Web Client is Ready!');
      isReady = true;
    });

    client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp Authentication Failure:', msg);
    });

    client.on('disconnected', (reason) => {
      console.log('🔌 WhatsApp Client Disconnected:', reason);
      isReady = false;
    });

    client.initialize().catch(err => {
      console.error('❌ Failed to initialize WhatsApp client:', err);
    });
  } catch (err) {
    console.error('❌ Error creating WhatsApp client:', err);
  }
};

exports.isReady = () => {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const hasTwilio = twilioSid && twilioToken && 
                    !twilioSid.includes('placeholder') && 
                    !twilioToken.includes('placeholder');
  return isReady || hasTwilio;
};

exports.sendReceipt = async (phone, message) => {
  // Level 1: Try Twilio WhatsApp Cloud API
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';

  const hasTwilio = twilioSid && twilioToken && 
                    !twilioSid.includes('placeholder') && 
                    !twilioToken.includes('placeholder');

  if (hasTwilio) {
    try {
      console.log('🔄 Attempting WhatsApp Cloud sending via Twilio...');
      let cleanTo = phone.replace(/\D/g, '');
      if (cleanTo.length === 10) {
        cleanTo = '91' + cleanTo; // India default
      }
      const formattedTo = `whatsapp:+${cleanTo}`;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', formattedTo);
      params.append('From', twilioFrom);
      params.append('Body', message);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (response.ok) {
        console.log(`✅ [Twilio Cloud] WhatsApp message sent successfully to ${cleanTo}`);
        return true;
      } else {
        const errText = await response.text();
        console.warn(`⚠️ [Twilio Cloud] API call failed: ${errText}. Trying Local WWebJS fallback...`);
      }
    } catch (twilioErr) {
      console.warn('⚠️ [Twilio Cloud] request failed. Trying Local WWebJS fallback...', twilioErr.message);
    }
  }

  // Level 2: Try Local whatsapp-web.js
  if (isReady && client) {
    let cleanNum = phone.replace(/\D/g, '');
    if (cleanNum.length === 10) {
      cleanNum = '91' + cleanNum;
    }
    const chatId = `${cleanNum}@c.us`;
    try {
      await client.sendMessage(chatId, message);
      console.log(`✅ [Local WWebJS] WhatsApp receipt sent to ${cleanNum}`);
      return true;
    } catch (wwebErr) {
      console.error(`❌ [Local WWebJS] failed to send message:`, wwebErr.message);
      throw wwebErr;
    }
  }

  // Level 3: Graceful fallback
  console.log(`\n🚨 [WhatsApp Fallback Logging] WhatsApp client is not connected & Twilio is disabled.`);
  console.log(`To: ${phone}\nMessage:\n${message}\n`);
  throw new Error('NO_CONNECTED_WHATSAPP_METHOD');
};
