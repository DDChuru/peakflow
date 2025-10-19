# SMTP Email Delivery Implementation Guide

**Status**: Architecture designed, ready for implementation when email credentials available
**Estimated Effort**: 3-4 hours with credentials
**Dependencies**: SMTP server credentials, SendGrid/Mailgun/AWS SES account

---

## 🎯 What's Needed

### 1. Email Service Provider Setup

**Recommended Options**:
- **SendGrid** (easiest) - Free tier: 100 emails/day
- **AWS SES** - Very reliable, $0.10 per 1,000 emails
- **Mailgun** - Developer-friendly, free tier available
- **SMTP Server** - Company's own email server

### 2. Environment Variables

Add to `.env.local`:
```env
# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxx
SMTP_FROM_EMAIL=noreply@peakflow.co.za
SMTP_FROM_NAME=PeakFlow
```

---

## 📧 Implementation Plan

### Phase 1: Email Service (1-2 hours)

Create `/src/lib/email/email-service.ts`:

```typescript
import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: options.to.join(', '),
        cc: options.cc?.join(', '),
        bcc: options.bcc?.join(', '),
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
```

### Phase 2: Email Templates (1 hour)

Create `/src/lib/email/templates/statement-email.ts`:

```typescript
export function generateStatementEmail(options: {
  customerName: string;
  statementDate: string;
  closingBalance: number;
  companyName: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${options.companyName}</h1>
          <p>Customer Statement</p>
        </div>
        <div class="content">
          <p>Dear ${options.customerName},</p>
          <p>Please find attached your account statement dated ${options.statementDate}.</p>
          <p>Your current balance is:</p>
          <p class="amount">R${options.closingBalance.toFixed(2)}</p>
          <p>Please review the attached statement and contact us if you have any questions.</p>
          <p>Thank you for your business!</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

### Phase 3: API Route (30 minutes)

Create `/app/api/statements/[id]/email/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/email-service';
import { generateStatementEmail } from '@/lib/email/templates/statement-email';
import { createStatementService, pdfService } from '@/lib/accounting';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { companyId, userId, to, cc, bcc } = await request.json();

    // Get statement
    const statementService = createStatementService(companyId, userId);
    const statementDoc = await statementService.getStatement(params.id);

    // Generate PDF
    const pdfBlob = await pdfService.generateStatementPDF(statementDoc, {
      companyName: 'PeakFlow',
      // ... other options
    });

    // Convert blob to buffer
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Generate email HTML
    const emailHtml = generateStatementEmail({
      customerName: statementDoc.customerName,
      statementDate: statementDoc.statementDate.toLocaleDateString(),
      closingBalance: statementDoc.closingBalance,
      companyName: 'PeakFlow',
    });

    // Send email
    const sent = await emailService.sendEmail({
      to,
      cc,
      bcc,
      subject: `Statement for ${statementDoc.statementDate.toLocaleDateString()}`,
      html: emailHtml,
      attachments: [
        {
          filename: `Statement-${statementDoc.customerName}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    if (sent) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Phase 4: UI Integration (1 hour)

Update statements page to call email API:

```typescript
async function handleEmailStatement(statement: CustomerStatement) {
  try {
    setIsSending(true);

    const response = await fetch(`/api/statements/${statement.id}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        userId: user.uid,
        to: [statement.customerEmail],
        cc: [],
        bcc: [],
      }),
    });

    const result = await response.json();

    if (result.success) {
      toast.success('Statement emailed successfully');
      // Update statement status to 'sent'
    } else {
      toast.error('Failed to send email');
    }
  } catch (error) {
    toast.error('Error sending email');
  } finally {
    setIsSending(false);
  }
}
```

---

## 🔄 Batch Email Implementation

For batch sending (all customers at once):

### Batch API Route

Create `/app/api/statements/batch-email/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  const { statementIds, companyId, userId } = await request.json();

  const results = [];
  for (const statementId of statementIds) {
    // Send each statement
    // Add delay to avoid rate limits: await sleep(1000)
    results.push(await sendStatementEmail(statementId, companyId, userId));
  }

  return NextResponse.json({
    total: statementIds.length,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  });
}
```

---

## ✅ Testing Checklist

Once SMTP credentials are available:

1. **[ ] Single Email Test**
   - Send test statement to your own email
   - Verify PDF attachment opens correctly
   - Check email formatting

2. **[ ] Multiple Recipients**
   - Test with CC and BCC
   - Verify all recipients receive email

3. **[ ] Error Handling**
   - Test with invalid email address
   - Test with SMTP credentials removed
   - Verify graceful error messages

4. **[ ] Batch Sending**
   - Test with 2-3 statements
   - Verify rate limiting works
   - Check all emails sent successfully

5. **[ ] Production Testing**
   - Send to real customer (with permission)
   - Verify professional appearance
   - Confirm customer can open PDF

---

## 📊 Current Status

**What's Ready**:
- ✅ PDF generation working
- ✅ Statement service has all data
- ✅ UI has email buttons in place
- ✅ Architecture designed above

**What's Pending**:
- ⏳ SMTP credentials configuration
- ⏳ nodemailer package installation
- ⏳ Email service implementation
- ⏳ API routes creation
- ⏳ Template creation
- ⏳ UI integration

**Time to Complete**: 3-4 hours once credentials available

---

## 🚀 Quick Start (When Ready)

1. **Install Dependencies**:
   ```bash
   npm install nodemailer
   npm install --save-dev @types/nodemailer
   ```

2. **Add Environment Variables** (see section 2 above)

3. **Create Email Service** (copy code from Phase 1)

4. **Create API Route** (copy code from Phase 3)

5. **Test Single Email**:
   ```typescript
   // In statements page
   <Button onClick={() => handleEmailStatement(statement)}>
     Email to Customer
   </Button>
   ```

6. **Deploy and Monitor**:
   - Check email delivery rates
   - Monitor bounce rates
   - Track customer opens (optional with SendGrid)

---

## 💡 Pro Tips

- **Use SendGrid** if starting fresh - easiest setup
- **Add rate limiting** - don't send more than 5 emails/second
- **Track delivery** - update statement status when sent
- **Handle bounces** - mark invalid emails
- **Add unsubscribe** - comply with email regulations
- **Test thoroughly** - email is critical for customer communication

---

**Ready to implement when you have SMTP credentials!** 🎉
