# Dispute Resolution Center

A comprehensive dispute resolution system for the Rent Space platform that allows users (owners and renters) to file disputes and enables super admins to manage and resolve them.

## Features

### For Users (Owner/Renter/Both)
- **File Disputes**: Report issues with bookings, payments, property conditions, etc.
- **Track Dispute Status**: Monitor the progress of submitted disputes
- **Communication**: Message directly with admin team through the dispute interface
- **Evidence Support**: Attach documents, images, and other evidence to support claims
- **Response System**: Respondents can submit their side of the story

### For Super Admins
- **Centralized Dashboard**: View all disputes with filtering options
- **Assignment System**: Assign disputes to specific admins
- **Status Management**: Update dispute status through the investigation process
- **Resolution Tools**: Make decisions and document resolutions
- **Statistics**: View dispute analytics and metrics
- **Communication**: Respond to both parties through the dispute interface

## Dispute Categories

The system supports the following dispute categories:
- Payment Issue
- Property Condition
- Cancellation Dispute
- Damage Claim
- Refund Request
- Behavior Issue
- Safety Concern
- Fraudulent Activity
- Breach of Terms
- Other

## Dispute Workflow

### 1. Submission
- User files a dispute with details about the issue
- System assigns a unique dispute ID
- Status: `submitted`
- Super admins are notified

### 2. Review
- Admin reviews the dispute details
- Can request additional information from either party
- Status: `under_review`

### 3. Investigation
- Admin investigates the claim
- Reviews evidence from both parties
- Communicates with involved parties
- Status: `investigating`

### 4. Awaiting Response
- Waiting for respondent to submit their response
- Status: `awaiting_response`

### 5. Resolution
- Super admin makes a decision
- Documents the resolution and action taken
- Awards compensation if applicable
- Status: `resolved`

### 6. Closure
- Dispute is closed after resolution is implemented
- Status: `closed`

## API Endpoints

### User Endpoints
```
POST   /api/v1/disputes                    - Create a new dispute
GET    /api/v1/disputes/my-disputes        - Get user's disputes
GET    /api/v1/disputes/:id                - Get dispute details
POST   /api/v1/disputes/:id/messages       - Add message to dispute
POST   /api/v1/disputes/:id/respond        - Submit respondent response
GET    /api/v1/users/search?query=...      - Search users by name/email/phone
```

### Admin Endpoints (Super Admin Only)
```
GET    /api/v1/disputes/admin/all          - Get all disputes
GET    /api/v1/disputes/admin/statistics   - Get dispute statistics
PUT    /api/v1/disputes/:id/assign         - Assign dispute to admin
PUT    /api/v1/disputes/:id/status         - Update dispute status
PUT    /api/v1/disputes/:id/resolve        - Resolve dispute
PUT    /api/v1/disputes/:id/close          - Close dispute
```

## Database Schema

### Dispute Model
```javascript
{
  disputeId: String (unique),
  complainant: ObjectId (User),
  respondent: ObjectId (User),
  booking: ObjectId (Booking, optional),
  listing: ObjectId (Listing, optional),
  category: String (enum),
  subject: String (max 200 chars),
  description: String (max 2000 chars),
  status: String (enum),
  priority: String (low/medium/high/urgent),
  assignedTo: ObjectId (User, admin),
  messages: [{
    sender: ObjectId (User),
    senderRole: String (complainant/respondent/admin/system),
    content: String,
    timestamp: Date
  }],
  resolution: {
    decision: String,
    explanation: String,
    action: String (enum),
    resolvedBy: ObjectId (User),
    resolvedAt: Date
  },
  requestedAmount: Number,
  awardedAmount: Number,
  timeline: [{
    action: String,
    performedBy: ObjectId (User),
    timestamp: Date
  }]
}
```

## Frontend Components

### User Components
- **Disputes** (`src/components/dashboard/Disputes.tsx`)
  - View and manage personal disputes
  - File new disputes
  - Communicate with admin team

### Admin Components
- **AdminDisputes** (`src/components/dashboard/admin/AdminDisputes.tsx`)
  - View all disputes with filters
  - Manage dispute lifecycle
  - Communicate with involved parties
  - Resolve and close disputes
  - View statistics

## Usage

### For Users

#### Filing a Dispute
1. Navigate to Dashboard → Disputes
2. Click "File New Dispute"
3. Fill in the required information:
   - **Select User**: Search and select the other party by typing their name, email, or phone number
   - Booking ID (if applicable)
   - Category
   - Subject
   - Detailed description
   - Requested amount (if applicable)
4. Submit the dispute

**User Selection Feature:**
- Type at least 2 characters to start searching
- Search by name, email, or phone number
- See user's avatar, name, email, and role
- Select from the dropdown list
- System automatically fills in the respondent ID

#### Tracking a Dispute
- View all your disputes in the Disputes tab
- Filter by status (Submitted, Under Review, etc.)
- Click "View Details" to see full dispute information
- Add messages to communicate with the admin team

#### Responding to a Dispute
- If you're named as a respondent, you'll see the dispute in your list
- Open the dispute and click "Submit Response"
- Provide your side of the story with evidence

### For Super Admins

#### Managing Disputes
1. Navigate to Dashboard → Dispute Management
2. View all disputes or filter by status
3. Click "View & Manage" on any dispute

#### Resolving a Dispute
1. Open the dispute details
2. Review all information from both parties
3. Communicate with parties if needed
4. Click "Assign to Me" to take ownership
5. Update status as investigation progresses
6. When ready, click "Resolve Dispute"
7. Fill in:
   - Decision summary
   - Detailed explanation
   - Action taken
   - Awarded amount (if applicable)
8. Submit resolution

## Priority Levels

- **Low**: Minor issues, no immediate impact
- **Medium**: Standard disputes requiring attention
- **High**: Significant issues affecting user experience
- **Urgent**: Critical issues requiring immediate attention (safety, fraud, etc.)

## Resolution Actions

- **Refund Issued**: Full or partial refund provided
- **Warning Given**: Formal warning issued to a party
- **Account Suspended**: User account temporarily or permanently suspended
- **Booking Cancelled**: Related booking cancelled
- **Compensation Provided**: Additional compensation given
- **No Action Required**: Dispute resolved without action
- **Mediation Required**: Requires further mediation
- **Other**: Custom action

## Best Practices

### For Users
- Provide detailed information with evidence
- Respond promptly to admin requests
- Keep communication professional
- Be honest and accurate in your claims

### For Admins
- Review all evidence thoroughly
- Communicate clearly with both parties
- Document all decisions and actions
- Maintain impartiality
- Update status regularly to keep parties informed
- Resolve disputes in a timely manner

## Security Considerations

- **Complete Privacy**: Only involved parties (complainant & respondent) and admins can view dispute details
- **No Third-Party Access**: Other users cannot see disputes they're not involved in
- All communications are logged with timestamps
- Super admin privileges required for resolutions
- Sensitive information is protected
- Timeline tracks all actions for accountability
- Authorization checks on every API endpoint ensure privacy

### How Privacy is Enforced

1. **Database Level**: Disputes only store complainant and respondent IDs
2. **API Level**: All endpoints check if the requesting user is either:
   - The complainant
   - The respondent  
   - An admin/super admin
3. **Frontend Level**: Disputes only shown in user's personal list if they're involved
4. **Query Level**: Users can only fetch disputes where they are complainant OR respondent

## Integration with Existing Systems

The dispute resolution system integrates with:
- **User System**: Links to users as complainants/respondents
- **Booking System**: Associates disputes with specific bookings
- **Listing System**: References related property listings
- **Payment System**: Handles refunds and compensation
- **Notification System**: Alerts users about dispute updates
- **Message System**: Enables communication between parties

## Future Enhancements

Potential improvements for the system:
- [ ] Automated dispute detection based on patterns
- [ ] Escalation rules for urgent disputes
- [ ] Multi-language support for dispute content
- [ ] Video evidence upload support
- [ ] Automated refund processing
- [ ] Dispute mediation scheduling
- [ ] Appeal process for resolved disputes
- [ ] Integration with customer support ticketing
- [ ] Mobile app support
- [ ] Email notifications for all dispute events
- [ ] SMS alerts for urgent disputes
- [ ] Dispute resolution templates
- [ ] Machine learning for dispute categorization
