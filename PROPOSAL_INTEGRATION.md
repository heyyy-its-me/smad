# Proposal Form Integration - Setup Guide

## Overview
The ProposalForm component in the UI collects lead name and email, then triggers an n8n webhook to generate and send a personalized proposal.

## UI Integration

**File:** `components/testing/ProposalForm.tsx`

The form:
1. Collects `lead_name` and `lead_email` from user input
2. Calls the n8n webhook via `process.env.NEXT_PUBLIC_PROPOSAL_WEBHOOK_URL`
3. Sends payload:
   ```json
   {
     "lead_name": "John Smith",
     "lead_email": "john@example.com",
     "timestamp": "2026-08-04T12:00:00.000Z"
   }
   ```
4. Shows loading/success/error states

## Environment Setup

Add to `.env.local`:
```env
NEXT_PUBLIC_PROPOSAL_WEBHOOK_URL=https://n8n-smady-adgtdkg5hvacf7fs.canadacentral-01.azurewebsites.net/webhook/proposal-sample
```

Replace the webhook URL with your actual n8n webhook endpoint.

## N8N Workflow Architecture

You'll need to create an n8n workflow with these nodes in sequence:

### 1. **Webhook Trigger Node**
- **Method:** POST
- **Path:** `/webhook/proposal-sample` (or your chosen path)
- **Input:** Expects JSON with `lead_name`, `lead_email`, and `timestamp`

### 2. **Generate Proposal Content** (New - Middle Node for Email Generation)
Options:
- **Code Node:** Template-based HTML generation using lead_name
  ```javascript
  // Use lead_name and other data to generate personalized email content
  const leadName = $json.lead_name;
  const proposalContent = `
    Dear ${leadName},
    
    Thank you for meeting with our team! Here's your personalized proposal...
  `;
  return { proposalContent, leadName };
  ```
- **LLM/AI Node:** Generate dynamic proposal using OpenAI or similar
- **Static HTML Template:** Use a pre-defined proposal template

### 3. **Format Email** (New - Prepare Email for Delivery)
- Create email body from proposal content
- Use lead_name for personalized greeting
- Prepare subject line: `"Your Personalized Proposal - {{lead_name}}"`

### 4. **Send Email Node** (Gmail or SMTP)
- **To:** `{{ $json.lead_email }}`
- **Subject:** `"Your Personalized Proposal"`
- **Body:** Generated proposal content from step 2
- **From:** Your configured sender email

### 5. **Response Node** (Return to UI)
- Return success response:
  ```json
  {
    "status": "success",
    "message": "Proposal sent to {{$json.lead_email}}"
  }
  ```

## Example N8N Workflow Flow

```
[Webhook Trigger]
  ↓
  Input: { lead_name, lead_email, timestamp }
  ↓
[Generate Proposal Content Node]
  ↓
  Outputs: proposalContent, personalized email
  ↓
[Gmail/SMTP Send Email]
  ↓
  To: lead_email
  Subject: "Your Personalized Proposal"
  Body: proposalContent
  ↓
[Response Node]
  ↓
  Returns success to UI
  ↓
[UI shows "Proposal triggered! Check your email shortly."]
```

## Why Middle Nodes Matter

The middle nodes (between webhook and email) allow you to:
- **Generate Dynamic Content:** Create personalized proposals using lead_name
- **Apply Business Logic:** Add rules, templates, or approval workflows
- **Connect Data:** Pull additional data from databases or APIs
- **Format Properly:** Ensure email HTML/formatting is correct before sending
- **Add Approvals:** Route to reviewers before sending if needed

## Error Handling

If the webhook call fails:
- UI displays error message with specific details
- User can retry by re-submitting the form
- Check n8n logs for workflow execution failures

## Demo Mode (If No N8N Workflow Yet)

To test without full n8n setup:
1. Create just the Webhook + Simple Response nodes
2. Leave ProposalForm pointing to that endpoint
3. The form will trigger and show success (but no email sent yet)
4. Once middle nodes are ready, add them and enable email sending

## Future Enhancements

- Link proposals to specific meetings (pass `meeting_id`)
- Track proposal delivery and open status
- Allow custom proposal templates
- Add approval workflow before sending
- Integrate with CRM to update lead status
- Generate PDF proposals instead of email
